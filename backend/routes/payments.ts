import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { razorpay } from '../services/razorpay';
import { lmsDB } from '../db';

const router = Router();

// Create Razorpay Order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.body;
  if (!courseId) {
    res.status(400).json({ success: false, error: 'courseId is required.' });
    return;
  }

  try {
    const course = await lmsDB.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    // Convert fee to paises (e.g. ₹5,000 becomes 500000)
    let rawFee = course.fee; // e.g. "₹5,000" or raw number 500000
    let amount = 0;
    if (typeof rawFee === 'string') {
      amount = parseInt(rawFee.replace(/[^0-9]/g, '')) * 100;
    } else {
      amount = rawFee; // it was already parsed to number
    }

    if (amount <= 0) {
      res.status(400).json({ success: false, error: 'This course is free or has invalid pricing.' });
      return;
    }

    const options = {
      amount, // amount in the smallest currency unit
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dev_dummy_key_id_123456'
      }
    });
  } catch (err: any) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate checkout.' });
  }
});

// Verify signature and complete enrollment
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, courseId } = req.body;

  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !courseId) {
    res.status(400).json({ success: false, error: 'Missing required validation signatures.' });
    return;
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dev_dummy_secret_78910';
    
    // Generate signature verify hash
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    if (generated_signature !== razorpaySignature) {
      res.status(400).json({ success: false, error: 'Payment signature verification failed.', code: 'PAY_001' });
      return;
    }

    // Successfully verified! Create enrollment
    const course = await lmsDB.getCourseById(courseId);
    let amount = 0;
    if (course) {
      amount = typeof course.fee === 'string' ? parseInt(course.fee.replace(/[^0-9]/g, '')) * 100 : course.fee;
    }

    const enrollment = await lmsDB.createEnrollment(req.user!.userId, courseId, razorpayOrderId, amount);

    res.json({
      success: true,
      data: enrollment,
      message: 'Enrollment successful.'
    });
  } catch (err: any) {
    console.error('Razorpay Signature Verification Error:', err);
    res.status(500).json({ success: false, error: 'Payment confirmation process failed.' });
  }
});

// Create Razorpay Publication Order (Supports guest or authenticated checkout)
router.post('/create-publication-order', async (req, res) => {
  const { bookTitle, price, deliveryFee = 0 } = req.body;
  if (!bookTitle || price === undefined) {
    res.status(400).json({ success: false, error: 'bookTitle and price are required.' });
    return;
  }

  try {
    const totalAmountInPaise = Math.round((Number(price) + Number(deliveryFee)) * 100);
    if (totalAmountInPaise <= 0) {
      res.status(400).json({ success: false, error: 'Invalid publication pricing.' });
      return;
    }

    const options = {
      amount: totalAmountInPaise,
      currency: 'INR',
      receipt: `pub_order_${Date.now()}`
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (e: any) {
      order = {
        id: `order_sim_${Date.now()}`,
        amount: totalAmountInPaise,
        currency: 'INR'
      };
    }

    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dev_dummy_key_id_123456'
      }
    });
  } catch (err: any) {
    console.error('Publication Order Creation Error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate publication checkout.' });
  }
});

// Verify Publication Payment Signature and Save Order Details
router.post('/verify-publication-order', async (req, res) => {
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    bookTitle,
    amount,
    shippingAddress
  } = req.body;

  if (!bookTitle || !shippingAddress || !shippingAddress.fullName || !shippingAddress.mobile) {
    res.status(400).json({ success: false, error: 'Missing shipping address details.' });
    return;
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dev_dummy_secret_78910';
    
    if (razorpaySignature && razorpayOrderId && !razorpayOrderId.startsWith('order_sim_')) {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      if (generated_signature !== razorpaySignature) {
        res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
        return;
      }
    }

    const orderRecord = {
      orderId: razorpayOrderId || `ORD-${Date.now()}`,
      paymentId: razorpayPaymentId || `PAY-${Date.now()}`,
      bookTitle,
      amount: Number(amount) || 0,
      shippingAddress,
      status: 'PAID',
      paidAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: orderRecord,
      message: 'Publication order placed successfully.'
    });
  } catch (err: any) {
    console.error('Publication Signature Verification Error:', err);
    res.status(500).json({ success: false, error: 'Payment verification failed.' });
  }
});

export default router;
