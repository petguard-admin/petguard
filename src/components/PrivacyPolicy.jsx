import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <Navbar dark />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Privacy Policy</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            <div className="h-1 bg-green-500 mt-4 w-24"></div>
          </div>

          <div className="prose prose-invert max-w-none prose-headings:text-slate-50 prose-a:text-emerald-400 prose-strong:text-slate-200">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                PetGuard ("we", "our", or "us") is committed to protecting your personal data and respecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                pet management services, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Data Controller</h2>
              <p className="text-slate-300 leading-relaxed">
                PetGuard is the data controller responsible for your personal information. For any privacy-related concerns, 
                please contact us at:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Email: petguard.admin@gmail.com</li>
                <li>Address: Mamburao, Occidental Mindoro, Philippines</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Personal Data We Collect</h2>
              <p className="text-slate-300 leading-relaxed">
                We collect the following types of personal data:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, barangay, gender, birthday</li>
                <li><strong>Pet Information:</strong> Pet name, species, breed, weight, color, date of birth, vaccination records, 
                medical records, tag information, habitat details</li>
                <li><strong>Authentication Data:</strong> Login credentials (encrypted), user ID</li>
                <li><strong>Usage Data:</strong> IP address, device information, browsing activity, timestamps</li>
                <li><strong>Communications:</strong> Messages sent through our platform</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Purpose of Collection</h2>
              <p className="text-slate-300 leading-relaxed">
                We collect your personal data for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>To provide and maintain your PetGuard account</li>
                <li>To manage and track your pet's health records and vaccination schedules</li>
                <li>To facilitate communication between pet owners and veterinary services</li>
                <li>To send important notifications about your pets and platform updates</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Legal Basis for Processing</h2>
              <p className="text-slate-300 leading-relaxed">
                Under the Data Privacy Act of 2012, we process your personal data based on:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li><strong>Consent:</strong> You have given us clear consent to process your personal data for specific purposes</li>
                <li><strong>Contractual Necessity:</strong> Processing is necessary for the performance of our service agreement with you</li>
                <li><strong>Legal Obligation:</strong> Processing is necessary to comply with our legal obligations</li>
                <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests in providing secure and efficient services</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Data Sharing and Disclosure</h2>
              <p className="text-slate-300 leading-relaxed">
                We may share your personal data with:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li><strong>Authorized Personnel:</strong> Our staff and administrators who need access to perform their duties</li>
                <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (e.g., Firebase for database hosting, Cloudinary for image storage)</li>
                <li><strong>Government Authorities:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Veterinary Professionals:</strong> When you request or authorize sharing of medical records</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                We do not sell your personal data to third parties for marketing purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Data Security Measures</h2>
              <p className="text-slate-300 leading-relaxed">
                We implement appropriate security measures to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Access controls and role-based permissions</li>
                <li>Regular security audits and updates</li>
                <li>Secure data storage with reputable cloud providers</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, 
                unless a longer retention period is required or permitted by law. When you delete your account, we will 
                permanently delete or anonymize your personal data, except for records we are required to keep for legal purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Your Rights Under the Data Privacy Act</h2>
              <p className="text-slate-300 leading-relaxed">
                Under the Data Privacy Act of 2012, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li><strong>Access:</strong> Request access to your personal data we hold</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data when it is no longer necessary</li>
                <li><strong>Object:</strong> Object to the processing of your personal data</li>
                <li><strong>Complaint:</strong> File a complaint with the National Privacy Commission if you believe your privacy rights have been violated</li>
                <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time, subject to legal or contractual restrictions</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                To exercise these rights, please contact us at petguard.admin@gmail.com.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Children's Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Our services are not intended for children under 18 years of age. We do not knowingly collect personal 
                data from children. If we become aware that we have collected personal data from a child without parental 
                consent, we will take steps to delete such information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Changes to This Privacy Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
                the new policy on our platform and updating the "Last updated" date. Your continued use of our services 
                after such changes constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Contact Information</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, 
                please contact us at:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Email: petguard.admin@gmail.com</li>
                <li>Address: Mamburao, Occidental Mindoro, Philippines</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                You may also file a complaint with the National Privacy Commission (NPC) of the Philippines if you believe 
                your privacy rights have been violated.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
