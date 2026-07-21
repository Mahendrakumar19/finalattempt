import { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Final Attempt Institute Patna',
  description:
    'Read the official Terms and Conditions of Final Attempt. Review the rules governing online courses, student portal access, intellectual property, and acceptable platform usage.',
  keywords: [
    'Final Attempt Terms and Conditions',
    'Final Attempt Patna Terms of Service',
    'BPSC Coaching User Agreement',
    'EdTech Terms of Use'
  ],
  openGraph: {
    title: 'Terms & Conditions | Final Attempt Institute Patna',
    description:
      'Review the terms governing course enrollment, digital portal usage, and intellectual property rights at Final Attempt.',
    siteName: 'Final Attempt',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function TermsAndConditionsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="Welcome to Final Attempt. These Terms and Conditions govern your access to and use of our web portal, online courses, test series, and digital learning ecosystem."
      lastUpdated="July 21, 2026"
      breadcrumbName="Terms & Conditions"
    >
      <h2>1. Agreement to Terms</h2>
      <p>
        By accessing, registering on, or using our digital learning platform, course portals, or services provided by Final Attempt (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree with any part of these Terms, you must discontinue your use of our platform immediately.
      </p>

      <h2>2. Educational Services Offered</h2>
      <p>
        Final Attempt is a specialized civil services coaching institute providing educational resources for BPSC, UPSC, and competitive examinations, including but not limited to:
      </p>
      <ul>
        <li>Online Foundation, Prelims, and Mains Courses</li>
        <li>Live and Recorded Video Lectures</li>
        <li>Sectional and Full-Length Test Series &amp; Mock Tests</li>
        <li>Current Affairs Compendiums &amp; Daily Feeds</li>
        <li>Downloadable PDF Study Notes and Mindmaps</li>
        <li>Personalized Mentorship &amp; Answer Writing Evaluation</li>
      </ul>

      <h2>3. Student Account Registration & Security</h2>
      <p>
        To access certain courses or features, you must create a Student Account. You represent and warrant that all registration details provided by you are accurate, current, and complete. You are solely responsible for maintaining the confidentiality of your account credentials (email, password, OTPs). Account sharing, simultaneous logins across unauthorized devices, or selling account access to third parties is strictly prohibited and will result in immediate termination without refund.
      </p>

      <h2>4. Intellectual Property & Anti-Piracy Policy</h2>
      <p>
        All content available on Final Attempt—including video lectures, PDF notes, test questions, model answers, infographics, graphics, logos, and software code—is the exclusive intellectual property of Final Attempt and is protected under Indian Copyright and Trademark laws.
      </p>
      <ul>
        <li>
          <strong>Permitted Use:</strong> Enrolled students are granted a limited, personal, non-transferable, non-exclusive license to view and download study materials solely for their personal preparation.
        </li>
        <li>
          <strong>Prohibited Actions:</strong> You may not record, screen-capture, redistribute, resell, reupload, modify, or broadcast any course material or video streams on Telegram, WhatsApp, YouTube, or any other public or private channels.
        </li>
        <li>
          <strong>Digital Watermarking:</strong> We embed dynamic student tracking watermarks (such as mobile numbers and student IDs) in PDF notes and video streams to detect copyright infringement. Infringing accounts will face legal action under the Indian Copyright Act, 1957.
        </li>
      </ul>

      <h2>5. Course Fees & Payments</h2>
      <p>
        Course fees, test series pricing, and subscription packages are clearly stated on our platform. All fees must be paid in full prior to obtaining course access unless an official installment schedule has been pre-approved. Payments are processed securely via authorized Indian payment gateways (such as Razorpay). You agree to pay all applicable statutory taxes (including GST) associated with your purchase.
      </p>

      <h2>6. Platform Code of Conduct</h2>
      <p>
        Aspirants using our live chat rooms, discussion forums, or mentorship portals must adhere to professional decorum. You agree not to post content that is obscene, abusive, defamatory, discriminatory, political, or disruptive. We reserve the right to remove non-compliant content and suspend accounts violating community standards.
      </p>

      <h2>7. Course Modification & Availability</h2>
      <p>
        While we strive to adhere strictly to published batch schedules, Final Attempt reserves the right to adjust class timings, substitute faculty members, update syllabus modules, or modify test delivery schedules to align with updated exam patterns announced by public service commissions (BPSC/UPSC).
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Final Attempt provides high-quality educational guidance and test preparation. However, we do not guarantee selection, job placement, or specific exam ranks. In no event shall Final Attempt, its directors, educators, or affiliates be liable for indirect, incidental, or consequential damages resulting from your use or inability to use our platform.
      </p>

      <h2>9. Termination & Account Cancellation</h2>
      <p>
        We reserve the right to suspend or terminate your account immediately if you breach these Terms, engage in copyright infringement, or exhibit abusive behavior toward faculty or staff. Upon termination, your access rights to digital materials shall immediately cease.
      </p>

      <h2>10. Governing Law & Dispute Jurisdiction</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes or claims arising out of or in connection with these Terms or your use of the platform shall be subject to the exclusive jurisdiction of the competent courts in <strong>Patna, Bihar, India</strong>.
      </p>

      <h2>11. Contact Information</h2>
      <p>
        For any inquiries regarding these Terms &amp; Conditions, please reach out to us at:
      </p>
      <p>
        <strong>Final Attempt Legal Department</strong><br />
        Boring Road Crossing, Patna, Bihar – 800001, India<br />
        Email: <a href="mailto:enquiry@finalattemptias.com">enquiry@finalattemptias.com</a><br />
        Phone: +91 97099 92093
      </p>
    </LegalLayout>
  );
}
