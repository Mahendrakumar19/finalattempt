import { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Final Attempt Institute Patna',
  description:
    'Review the official Refund and Cancellation Policy of Final Attempt. Understand the eligibility criteria, timelines, duplicate payment resolutions, and disbursal terms for courses and test series.',
  keywords: [
    'Final Attempt Refund Policy',
    'Final Attempt Cancellation Terms',
    'BPSC Coaching Fees Refund Patna',
    'EdTech Cancellation Rules'
  ],
  openGraph: {
    title: 'Refund & Cancellation Policy | Final Attempt Institute Patna',
    description:
      'Learn about Final Attempt course cancellation guidelines, refund eligibility windows, duplicate payment resolutions, and disbursal channels.',
    siteName: 'Final Attempt',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="This Refund and Cancellation Policy outlines the conditions under which refunds, cancellations, and payment adjustments are processed for courses, test series, and study materials purchased through Final Attempt."
      lastUpdated="July 21, 2026"
      breadcrumbName="Refund Policy"
    >
      <h2>1. Overview & General Principle</h2>
      <p>
        At Final Attempt, we strive to deliver industry-leading BPSC and civil services preparation programs, including live/recorded courses, test series, evaluation modules, and study materials. Because our digital assets, proprietary PDF notes, video streams, and answer evaluation workflows are accessible immediately upon enrollment, <strong>all course fees and digital purchases are generally non-refundable</strong> once access has been granted, except under specific circumstances outlined in this policy.
      </p>

      <h2>2. Refund Eligibility Criteria</h2>
      <p>
        Refund requests are evaluated strictly on a case-by-case basis under the following eligible conditions:
      </p>
      <ul>
        <li>
          <strong>Duplicate / Multiple Payment Deduction:</strong> If a student is charged multiple times for a single course enrollment due to a payment gateway glitch or network timeout, the duplicate amount will be refunded in full.
        </li>
        <li>
          <strong>Technical Access Failure:</strong> If a student pays for a course but is unable to access the course material due to a verified technical defect on our platform that our technical team fails to resolve within 7 working days.
        </li>
        <li>
          <strong>Pre-Batch Cancellation (Subject to Review):</strong> Refund requests submitted at least 48 hours prior to the official batch start date for newly announced offline/classroom foundation batches, subject to a 10% administrative and processing deduction.
        </li>
      </ul>

      <h2>3. Non-Refundable Categories</h2>
      <p>
        Refunds will <strong>NOT</strong> be issued under any of the following scenarios:
      </p>
      <ul>
        <li>Change of mind, personal schedule conflicts, or decision to discontinue preparation after obtaining access to course materials.</li>
        <li>Test Series packages (Prelims or Mains) once test links or PDF question booklets have been accessed or downloaded.</li>
        <li>Single-item purchases of PDF Notes, Rapid Revision Materials, or Bihar Special Compendiums.</li>
        <li>Accounts terminated or suspended due to copyright infringement, abusive behavior, or unauthorized login sharing.</li>
        <li>Failure to clear an examination or dissatisfaction with personal exam results.</li>
      </ul>

      <h2>4. Refund Request Procedure</h2>
      <p>
        To submit a refund request for eligible transactions, please follow these steps:
      </p>
      <ol>
        <li>
          Send an official email to <strong>enquiry@finalattemptias.com</strong> within <strong>7 calendar days</strong> of the transaction.
        </li>
        <li>Include your Registered Student Name, Registered Mobile Number, Registered Email ID, Course Name, Payment Reference ID / Transaction Number, and a clear description of the reason for the refund request.</li>
        <li>Attach supporting proof, such as payment gateway receipts or bank statements showing duplicate deductions.</li>
      </ol>

      <h2>5. Verification & Processing Timeline</h2>
      <p>
        Once your refund request is received:
      </p>
      <ul>
        <li>
          <strong>Initial Review (2-3 Business Days):</strong> Our billing team will verify the payment logs with our payment partner (Razorpay) and inspect your account access history.
        </li>
        <li>
          <strong>Approval Notice:</strong> You will receive an official email confirmation stating whether your refund request has been approved or rejected.
        </li>
        <li>
          <strong>Disbursal Timeline (5-7 Business Days):</strong> If approved, the refund will be credited back to the original source account (UPI ID, Net Banking, or Credit/Debit Card) within 5 to 7 business days from the date of approval.
        </li>
      </ul>

      <h2>6. Batch Transfer & Course Exchange Policy</h2>
      <p>
        If an aspirant wishes to transfer from one batch to another (e.g., from English Medium to Hindi Medium, or from Prelims Test Series to Foundation Batch), a batch transfer request may be submitted within 14 days of enrollment. Batch transfers are subject to seat availability and adjustment of any differential course fees.
      </p>

      <h2>7. Contact for Payment Assistance</h2>
      <p>
        For any billing inquiries, transaction status checks, or refund requests, please contact our financial assistance team at:
      </p>
      <p>
        <strong>Final Attempt Billing &amp; Finance Desk</strong><br />
        Boring Road Crossing, Patna, Bihar – 800001, India<br />
        Email: <a href="mailto:enquiry@finalattemptias.com">enquiry@finalattemptias.com</a><br />
        Phone: +91 97099 92093
      </p>
    </LegalLayout>
  );
}
