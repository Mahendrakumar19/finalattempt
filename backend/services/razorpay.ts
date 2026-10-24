import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TTzBxGpMqc0rAD';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '4ViOK1jEPrPtZPYcou4ut48V';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});
