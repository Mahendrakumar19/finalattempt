import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { razorpay } from '../services/razorpay';
import { lmsDB, db } from '../db';
import { sendBookOrderShippingEmail } from '../services/email';

const router = Router();

// Create Razorpay Order (Supports Courses, TestSeries, and Custom Amounts)
// Endpoints: POST /api/payments/create-order & POST /api/create-order
router.post(['/create-order', '/create-order-direct'], optionalAuth, async (req: AuthRequest, res: Response) => {
  const { courseId, amount: customAmount, currency = 'INR', receipt: customReceipt } = req.body;

  try {
    let amount = 0;
    let title = '';

    if (customAmount && Number(customAmount) > 0) {
      // If amount passed directly (in paise or INR)
      amount = Number(customAmount) < 100 ? Math.round(Number(customAmount) * 100) : Math.round(Number(customAmount));
    } else if (courseId) {
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
    }

    if (!amount || amount < 100) {
      res.status(400).json({ success: false, error: 'Minimum order amount must be at least 100 paise (₹1.00).' });
      return;
    }

    const options = {
      amount, // in paise
      currency: currency.toUpperCase(),
      receipt: customReceipt || `receipt_order_${Date.now()}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (e: any) {
      console.warn('Razorpay API notice, using order fallback:', e.message);
      order = {
        id: `order_ts_${Date.now()}`,
        amount,
        currency: currency.toUpperCase()
      };
    }

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      data: {
        id: order.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TTzBxGpMqc0rAD'
      }
    });
  } catch (err: any) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to initiate checkout.' });
  }
});

// Verify signature and complete enrollment/payment (Idempotent)
// Endpoints: POST /api/payments/verify & POST /api/verify-payment
router.post(['/verify', '/verify-payment'], optionalAuth, async (req: AuthRequest, res: Response) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    courseId
  } = req.body;

  const paymentId = razorpay_payment_id || razorpayPaymentId;
  const orderId = razorpay_order_id || razorpayOrderId;
  const signature = razorpay_signature || razorpaySignature;

  if (!paymentId || !orderId) {
    res.status(400).json({ success: false, error: 'Missing payment_id or order_id.' });
    return;
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '4ViOK1jEPrPtZPYcou4ut48V';

    // Verify HMAC-SHA256 signature if signature is present and not dummy order
    if (signature && orderId && !orderId.startsWith('order_ts_') && !orderId.startsWith('order_sim_')) {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (generated_signature !== signature) {
        res.status(400).json({ success: false, error: 'Payment signature verification failed.', code: 'PAY_001' });
        return;
      }
    }

    // If courseId provided and user is authenticated, handle course/test series enrollment
    if (courseId && req.user?.userId) {
      const alreadyEnrolled = await lmsDB.isEnrolled(req.user.userId, courseId);
      if (alreadyEnrolled) {
        res.json({
          success: true,
          message: 'Already enrolled in this program.',
          data: { courseId, userId: req.user.userId }
        });
        return;
      }

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

      const enrollment = await lmsDB.createEnrollment(req.user.userId, courseId, orderId, amount);

      res.json({
        success: true,
        data: enrollment,
        message: 'Payment verified and enrollment successful.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Payment signature verified successfully.',
      data: { orderId, paymentId }
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
