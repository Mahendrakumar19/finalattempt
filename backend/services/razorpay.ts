import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_dev_dummy_key_id_123456';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dev_dummy_secret_78910';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});
