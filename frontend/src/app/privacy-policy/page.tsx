import { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Final Attempt Institute Patna',
  description:
    'Read the official Privacy Policy of Final Attempt. Learn how we collect, protect, and use student data across our digital learning platform, courses, and test series.',
  keywords: [
    'Final Attempt Privacy Policy',
    'Final Attempt Patna Data Privacy',
    'BPSC Student Data Protection',
    'EdTech Privacy Terms'
  ],
  openGraph: {
    title: 'Privacy Policy | Final Attempt Institute Patna',
    description:
      'Learn how Final Attempt protects aspirant data, handles payment information, and ensures secure digital learning experiences.',
    siteName: 'Final Attempt',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="At Final Attempt, we are committed to safeguarding your personal data and upholding your right to privacy when using our digital learning platform and services."
      lastUpdated="July 21, 2026"
      breadcrumbName="Privacy Policy"
    >
      <h2>1. Introduction & Overview</h2>
      <p>
        Final Attempt (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates our digital learning portal, mobile applications, and educational services. This Privacy Policy outlines the types of information we collect from aspirants, students, and website visitors (&quot;Users&quot; or &quot;you&quot;), how we use, store, and protect that data, and your privacy rights under Indian legislation, including the Information Technology Act, 2000 and applicable data protection regulations.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        To provide seamless access to our Online Courses, Test Series, PDF Study Notes, Video Lectures, and Mock Tests, we collect the following categories of information:
      </p>
      <ul>
        <li>
          <strong>Personal Identification Data:</strong> Full Name, Email Address, Mobile Phone Number, Residential Address, State/City of Residence, and optional Profile Avatar images provided during account registration.
        </li>
        <li>
          <strong>Educational & Academic Credentials:</strong> Target Examination (e.g., BPSC Foundation, Prelims, Mains, Interview), Medium of Instruction (English/Hindi), academic performance metrics, quiz attempt records, and mock test scores.
        </li>
        <li>
          <strong>Transaction & Billing Data:</strong> Payment order identifiers, transaction status, and timestamps processed securely via authorized Indian payment gateways (e.g., Razorpay). <em>Note: We do not store credit/debit card numbers or bank passwords on our servers.</em>
        </li>
        <li>
          <strong>Technical & Device Information:</strong> IP address, browser type, device type, operating system version, access timestamps, and session logs gathered automatically for security verification and analytics.
        </li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>
        The data we collect is utilized strictly for educational delivery, account administration, and platform security, including:
      </p>
      <ul>
        <li>Enrolling students in requested Online Courses, Test Series, and Answer Writing evaluation programs.</li>
        <li>Delivering personalized mentorship feedback, answer script grading, and AI-driven performance analytics.</li>
        <li>Sending essential transactional communications, OTP authentications, schedule alerts, and course access updates.</li>
        <li>Improving website load speeds, user interface components, and content delivery infrastructure.</li>
        <li>Preventing unauthorized account sharing, piracy of proprietary study materials, and fraudulent transactions.</li>
      </ul>

      <h2>4. Cookies & Web Analytics</h2>
      <p>
        We use cookies and similar session tokens to remember your login state, theme preferences (Light/Dark mode), and active shopping cart selections. You may choose to disable cookies through your web browser settings; however, certain interactive features of our student dashboard may function with limited capabilities as a result.
      </p>

      <h2>5. Disclosure & Data Sharing</h2>
      <p>
        Final Attempt does not sell, rent, or trade your personal information to third-party marketing organizations. We disclose user information only under the following limited circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Trusted third-party technology partners who assist in payment processing (Razorpay), SMS/Email OTP delivery, cloud hosting, and video streaming. These providers operate under strict confidentiality obligations.
        </li>
        <li>
          <strong>Legal Obligations:</strong> When required by applicable Indian laws, judicial summons, or government law enforcement directives.
        </li>
      </ul>

      <h2>6. Data Protection & Security Controls</h2>
      <p>
        We employ industry-standard administrative, technical, and physical security measures—including SSL/TLS encryption for data in transit, restricted database permissions, and regular system updates—to protect your personal records against unauthorized access, alteration, or disclosure.
      </p>

      <h2>7. Student Rights & Account Management</h2>
      <p>
        As a registered student of Final Attempt, you maintain the right to:
      </p>
      <ul>
        <li>Review and update your personal profile details directly through your Student Dashboard.</li>
        <li>Request correction of erroneous contact details stored in our database.</li>
        <li>Opt out of non-essential promotional communications at any time by contacting our support team.</li>
      </ul>

      <h2>8. Updates to This Privacy Policy</h2>
      <p>
        We reserve the right to modify or update this Privacy Policy at any time to reflect operational changes or statutory updates. Any changes will be posted on this page with a revised &quot;Last Updated&quot; date.
      </p>

      <h2>9. Grievance Redressal & Contact Information</h2>
      <p>
        If you have any questions, concerns, or grievances regarding this Privacy Policy or your personal information, please contact our Grievance Redressal Officer at:
      </p>
      <p>
        <strong>Final Attempt Grievance Cell</strong><br />
        Boring Road Crossing, Patna, Bihar – 800001, India<br />
        Email: <a href="mailto:enquiry@finalattemptias.com">enquiry@finalattemptias.com</a><br />
        Phone: +91 97099 92093
      </p>
    </LegalLayout>
  );
}
