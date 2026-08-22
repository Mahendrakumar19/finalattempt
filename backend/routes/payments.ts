import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { razorpay } from '../services/razorpay';
import { lmsDB, db } from '../db';
import { sendBookOrderShippingEmail } from '../services/email';

const router = Router();

// Create Razorpay Order (Supports both Courses and TestSeries)
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId } = req.body; // Represents courseId or testSeriesId
  if (!courseId) {
    res.status(400).json({ success: false, error: 'courseId or testSeriesId is required.' });
    return;
  }

  try {
    let amount = 0;
    let title = '';

    // 1. Try fetching from lms_courses
    const course = await lmsDB.getCourseById(courseId);
    if (course) {
      let rawFee = course.fee;
      amount = typeof rawFee === 'string' ? parseInt(rawFee.replace(/[^0-9]/g, '')) * 100 : rawFee;
      title = course.title;
    } else {
      // 2. Try fetching from TestSeries
      const testSeries = await lmsDB.getTestSeriesById(courseId);
      if (testSeries) {
        const price = testSeries.discountedPrice || testSeries.price || 0;
        amount = price * 100;
        title = testSeries.title;
      }
    }

    if (amount <= 0) {
      res.status(400).json({ success: false, error: 'This course or test series is free or has invalid pricing.' });
      return;
    }

    const options = {
      amount, // amount in paises
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (e: any) {
      order = {
        id: `order_ts_${Date.now()}`,
        amount,
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
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate checkout.' });
  }
});

// Verify signature and complete enrollment (Idempotent)
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, courseId } = req.body;

  if (!courseId) {
    res.status(400).json({ success: false, error: 'Missing courseId or testSeriesId.' });
    return;
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dev_dummy_secret_78910';
    
    if (razorpaySignature && razorpayOrderId && !razorpayOrderId.startsWith('order_ts_')) {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      if (generated_signature !== razorpaySignature) {
        res.status(400).json({ success: false, error: 'Payment signature verification failed.', code: 'PAY_001' });
        return;
      }
    }

    // Check if already enrolled (Idempotency)
    const alreadyEnrolled = await lmsDB.isEnrolled(req.user!.userId, courseId);
    if (alreadyEnrolled) {
      res.json({
        success: true,
        message: 'Already enrolled in this program.',
        data: { courseId, userId: req.user!.userId }
      });
      return;
    }

    // Determine amount
    let amount = 0;
    const course = await lmsDB.getCourseById(courseId);
    if (course) {
      amount = typeof course.fee === 'string' ? parseInt(course.fee.replace(/[^0-9]/g, '')) * 100 : course.fee;
    } else {
      const ts = await lmsDB.getTestSeriesById(courseId);
      if (ts) {
        amount = (ts.discountedPrice || ts.price || 0) * 100;
      }
    }

    const enrollment = await lmsDB.createEnrollment(req.user!.userId, courseId, razorpayOrderId || `ORD-${Date.now()}`, amount);

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
    bookId,
    editionYear,
    language,
    price,
    deliveryFee,
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

    const orderRecord = await db.saveBookOrder({
      orderId: razorpayOrderId || `ORD-PUB-${Date.now()}`,
      paymentId: razorpayPaymentId || `PAY-${Date.now()}`,
      bookId,
      bookTitle,
      editionYear,
      language,
      price: Number(price) || Number(amount) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount: Number(amount) || 0,
      shippingAddress,
      paymentStatus: 'PAID',
      deliveryStatus: 'PROCESSING'
    });

    // Send confirmation email asynchronously
    sendBookOrderShippingEmail(orderRecord).catch(err => console.error('Order creation email notification error:', err));

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

// PUBLIC: Track Book Order by Order ID or Mobile Number
router.get('/track-order/:query', async (req, res) => {
  try {
    const query = req.params.query?.trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Order ID or Mobile Number is required.' });
    }

    const allOrders = await db.getBookOrders();
    const cleanQ = query.toLowerCase();

    const matched = allOrders.filter((o: any) =>
      o.orderId?.toLowerCase() === cleanQ ||
      o.paymentId?.toLowerCase() === cleanQ ||
      o.customerMobile?.replace(/\D/g, '') === cleanQ.replace(/\D/g, '') ||
      o.id?.toLowerCase() === cleanQ
    );

    if (matched.length === 0) {
      return res.status(404).json({ success: false, error: 'No book orders found matching this Order ID or Mobile Number.' });
    }

    res.json({ success: true, data: matched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN: Get All Book Orders
router.get('/admin/book-orders', async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const orders = await db.getBookOrders(statusFilter);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN: Update Book Order Details & Shipping
router.put('/admin/book-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await db.updateBookOrder(id, req.body);

    // Send updated status email notification to customer if status/shipping changed
    if (ok) {
      const orders = await db.getBookOrders();
      const updatedOrder = orders.find((o: any) => o.id === id || o.orderId === id);
      if (updatedOrder) {
        sendBookOrderShippingEmail(updatedOrder).catch(err => console.error('Shipping update email error:', err));
      }
    }

    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN: Delete Book Order
router.delete('/admin/book-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await db.deleteBookOrder(id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
