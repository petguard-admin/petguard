import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Terms of Service</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
            <div className="h-1 bg-green-500 mt-4 w-24"></div>
          </div>

          <div className="prose prose-invert max-w-none prose-headings:text-slate-50 prose-a:text-emerald-400 prose-strong:text-slate-200">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Agreement to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing or using PetGuard ("the Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Description of Service</h2>
              <p className="text-slate-300 leading-relaxed">
                PetGuard is a pet management platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Register and manage pet profiles</li>
                <li>Track vaccination and medical records</li>
                <li>Access pet health information and announcements</li>
                <li>Communicate with veterinary services</li>
                <li>Receive notifications about pet health and platform updates</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">User Accounts</h2>
              <p className="text-slate-300 leading-relaxed">
                To use the Service, you must:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information to keep it accurate and current</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">User Responsibilities</h2>
              <p className="text-slate-300 leading-relaxed">
                As a user of PetGuard, you agree to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Provide accurate and truthful information about yourself and your pets</li>
                <li>Keep pet records up to date, especially vaccination and medical information</li>
                <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                <li>Not use the Service to harass, abuse, or harm others</li>
                <li>Not upload malicious code, viruses, or harmful content</li>
                <li>Not attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Respect the privacy and rights of other users</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Pet Information Accuracy</h2>
              <p className="text-slate-300 leading-relaxed">
                You are responsible for ensuring that all information about your pets is accurate and up to date. 
                This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Pet identification details (name, species, breed, color)</li>
                <li>Vaccination records and dates</li>
                <li>Medical history and treatments</li>
                <li>Contact information for emergencies</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                PetGuard is not responsible for any consequences resulting from inaccurate or incomplete pet information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Intellectual Property</h2>
              <p className="text-slate-300 leading-relaxed">
                The Service and its original content, features, and functionality are owned by PetGuard and are 
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-300 leading-relaxed">
                You may not modify, reproduce, distribute, or create derivative works based on our Service without 
                our express written permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">User-Generated Content</h2>
              <p className="text-slate-300 leading-relaxed">
                By using the Service, you grant PetGuard a non-exclusive, royalty-free, worldwide license to use, 
                store, and display any content you upload or provide through the Service for the purpose of providing 
                the Service to you.
              </p>
              <p className="text-slate-300 leading-relaxed">
                You represent and warrant that you own or have the necessary rights to any content you upload and 
                that such content does not violate any third-party rights or applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Privacy and Data Protection</h2>
              <p className="text-slate-300 leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy, which explains how we collect, 
                use, and protect your personal data in accordance with the Data Privacy Act of 2012. By using the 
                Service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Termination</h2>
              <p className="text-slate-300 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for any reason, including but 
                not limited to:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Violation of these Terms</li>
                <li>Violation of applicable laws or regulations</li>
                <li>Fraudulent or suspicious activity</li>
                <li>Inactivity for an extended period</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                You may also terminate your account at any time by contacting us or using the account deletion feature 
                in the Service. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Disclaimers</h2>
              <p className="text-slate-300 leading-relaxed">
                The Service is provided on an "as is" and "as available" basis without warranties of any kind, either 
                express or implied. We do not warrant that:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results that may be obtained from the use of the Service will be accurate or reliable</li>
                <li>The quality of any products, services, information, or other material purchased or obtained 
                through the Service will meet your expectations</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                PetGuard is not a veterinary service and does not provide medical advice. Always consult with a 
                qualified veterinarian for your pet's health needs.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Limitation of Liability</h2>
              <p className="text-slate-300 leading-relaxed">
                To the fullest extent permitted by law, PetGuard shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including without limitation, loss of profits, data, 
                use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Governing Law</h2>
              <p className="text-slate-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of the 
                Philippines, without regard to its conflict of law provisions. Any disputes arising from these Terms 
                shall be subject to the exclusive jurisdiction of the courts of the Philippines.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Changes to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes 
                by posting the new Terms on the Service and updating the "Last updated" date. Your continued use 
                of the Service after such modifications constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-50">Contact Information</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <ul className="list-disc pl-6 text-slate-300 space-y-2">
                <li>Email: petguard.admin@gmail.com</li>
                <li>Address: Mamburao, Occidental Mindoro, Philippines</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
