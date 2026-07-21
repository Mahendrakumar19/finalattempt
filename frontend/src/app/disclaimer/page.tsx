import { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Legal Disclaimer | Final Attempt Institute Patna',
  description:
    'Read the official Legal Disclaimer of Final Attempt. Review our non-governmental affiliation notices, educational content scope, and platform guidelines.',
  keywords: [
    'Final Attempt Legal Disclaimer',
    'Final Attempt BPSC Non-Govt Notice',
    'Final Attempt Patna Disclaimer',
    'EdTech Disclaimer Terms'
  ],
  openGraph: {
    title: 'Legal Disclaimer | Final Attempt Institute Patna',
    description:
      'Review the legal disclaimer regarding educational content, examination guidance, and non-affiliation with public service commissions.',
    siteName: 'Final Attempt',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Legal Disclaimer"
      subtitle="This Disclaimer sets forth the general guidelines, disclosures, and limitations of liability regarding the educational information and services provided on our platform."
      lastUpdated="July 21, 2026"
      breadcrumbName="Disclaimer"
    >
      <h2>1. Educational Purpose Only</h2>
      <p>
        The content, study materials, video lectures, test series, current affairs digests, and answer evaluation notes provided on our platform (&quot;Website&quot;) are compiled solely for educational, academic preparation, and informational purposes. While we strive to ensure that all study materials reflect current examination trends and syllabus requirements, the materials should not be construed as official government notifications or legal advice.
      </p>

      <h2>2. Non-Affiliation with Government Bodies</h2>
      <p>
        <strong>Final Attempt is an independent private educational coaching institute and digital learning platform.</strong> We are <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with</strong> the Bihar Public Service Commission (BPSC), Union Public Service Commission (UPSC), Staff Selection Commission (SSC), or any other Central or State Government recruitment agency or examination board in India.
      </p>
      <p>
        Official examination schedules, eligibility notifications, result declarations, and official answer keys are published exclusively on official government portals such as <a href="https://bpsc.bih.nic.in" target="_blank" rel="noopener noreferrer">bpsc.bih.nic.in</a> and <a href="https://upsc.gov.in" target="_blank" rel="noopener noreferrer">upsc.gov.in</a>. Candidates are advised to cross-reference all administrative announcements with official government gazettes.
      </p>

      <h2>3. Accuracy of Content & Study Materials</h2>
      <p>
        While our team of experienced educators, subject matter experts, and former civil servants takes rigorous care to verify historical facts, statistical figures, economic budget data, and current affairs feeds, Final Attempt makes no warranties or representations, express or implied, regarding the absolute completeness, accuracy, reliability, or timeliness of any content on the Website.
      </p>

      <h2>4. Examination Performance & Results Disclaimer</h2>
      <p>
        Final Attempt provides structured guidance, micro-scheduling, mock tests, and performance analytics to assist aspirants in their preparation. However, <strong>we do not guarantee selection, job placement, specific ranks, or minimum passing marks in any public service examination</strong>. Success in competitive exams depends on individual student effort, examination room performance, personal dedication, and official commission grading standards.
      </p>

      <h2>5. External Links & Third-Party Resources</h2>
      <p>
        Our Website and study notes may contain links to external third-party websites, news portals, reference archives, or government documents. These external links are provided solely for the convenience of students. Final Attempt does not monitor, control, or endorse the content, privacy practices, or accuracy of information hosted on third-party websites.
      </p>

      <h2>6. Intellectual Property & Copyright Notice</h2>
      <p>
        All brand names, trademarks, exam names (such as BPSC, UPSC, Civil Services Exam), logos, and government commission titles referenced on this platform belong to their respective trademark owners. Their reference on Final Attempt is strictly for identification and educational descriptive purposes and does not imply any official endorsement.
      </p>

      <h2>7. Technical Disclaimer & Availability</h2>
      <p>
        Final Attempt makes reasonable efforts to maintain 24/7 uptime for our student portal and digital learning infrastructure. However, we do not warrant that the Website will be uninterrupted, error-free, or free of viruses or technical glitches resulting from server maintenance, ISP outages, or cyber incidents.
      </p>

      <h2>8. Updates to Disclaimer</h2>
      <p>
        We reserve the right to amend or update this Disclaimer at any time without prior notice. Continued use of the Website following any changes constitutes your acceptance of the revised Disclaimer.
      </p>

      <h2>9. Contact & Inquiries</h2>
      <p>
        If you require further clarification regarding this Disclaimer, please reach out to us at:
      </p>
      <p>
        <strong>Final Attempt Help Desk</strong><br />
        Boring Road Crossing, Patna, Bihar – 800001, India<br />
        Email: <a href="mailto:enquiry@finalattemptias.com">enquiry@finalattemptias.com</a><br />
        Phone: +91 97099 92093
      </p>
    </LegalLayout>
  );
}
