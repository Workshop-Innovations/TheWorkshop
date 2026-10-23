import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
  const lastUpdated = 'October 23, 2026';

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 bg-white border-b border-slate-100">
        <div className="w-full max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm font-medium">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 flex-grow">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-slate max-w-none space-y-10 text-slate-700 text-[15px] leading-relaxed">

            <div>
              <p>
                Workshop Innovations Ltd. (<strong>"WorkShop"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, <strong>"our"</strong>) operates the WorkShop platform at <strong>workshop.com.ng</strong> and its subdomains. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use our Platform.
              </p>
              <p>
                We are committed to protecting your privacy and handling your data in compliance with the <strong>Nigeria Data Protection Regulation (NDPR)</strong> and the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>. By using the Platform, you consent to the data practices described in this policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">1. Information We Collect</h2>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.1. Information You Provide Directly</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account Information:</strong> When you register, we collect your email address, username, and password (stored as a one-way hash; we never store your plaintext password). If you register via Google Sign-In, we receive your email address, name, and profile picture from Google.</li>
                <li><strong>Profile Information:</strong> Your profile picture, display name, and any other information you choose to add to your profile.</li>
                <li><strong>Payment Information:</strong> When you subscribe to a paid plan, payment processing is handled entirely by Paystack. We receive transaction confirmations (amount, status, reference ID, subscription plan) but <strong>we do not store your card number, bank account details, or other financial credentials</strong>. Paystack's handling of your payment information is governed by <a href="https://paystack.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Paystack's Privacy Policy</a>.</li>
                <li><strong>User Content:</strong> Messages you send in community channels or direct messages, shared notes, peer review submissions and feedback, flashcard sets, and any files you upload (such as documents or profile images).</li>
                <li><strong>AI Tutor Interactions:</strong> Questions and prompts you send to the AI tutor, and the AI-generated responses. These are stored to maintain your conversation history and improve the tutoring experience.</li>
                <li><strong>Feedback and Support:</strong> Any information you provide when contacting us for support or submitting feedback through the Platform.</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.2. Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Usage Data:</strong> We log session activity including pages visited, features used, study session durations (Pomodoro timer), task completions, and examination paper views. This data is associated with your account for progress tracking.</li>
                <li><strong>Device and Connection Data:</strong> Your IP address, browser type and version, operating system, device type, screen resolution, and referring URL. This information is collected through standard server logs and is used for security monitoring and platform improvement.</li>
                <li><strong>Real-Time Connection Data:</strong> When you use community features, we track your online/offline status via WebSocket connections to display presence information to other community members.</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">1.3. Information from Third Parties</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Google Sign-In:</strong> If you authenticate with Google, we receive your Google account email, name, and profile picture. We do not receive or store your Google password.</li>
                <li><strong>Paystack:</strong> We receive payment confirmation data (transaction status, amount, reference) when you make a purchase. We do not receive your card or bank details from Paystack.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">2.1. To Provide and Operate the Platform</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create and manage your account</li>
                <li>Authenticate your identity and maintain session security</li>
                <li>Process subscriptions and payments</li>
                <li>Deliver AI tutoring, flashcard generation, and other AI-powered features</li>
                <li>Facilitate community messaging, direct messages, and study group collaboration</li>
                <li>Track your study progress, session history, and task completions</li>
                <li>Display your profile, reputation, and badges to other community members</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">2.2. To Improve and Personalise the Platform</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Analyse usage patterns to improve features, performance, and user experience</li>
                <li>Identify and fix bugs, errors, and technical issues</li>
                <li>Develop new features based on aggregate usage trends</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">2.3. To Communicate With You</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Send essential service communications (account verification, password resets, payment confirmations, security alerts)</li>
                <li>Notify you of changes to our Terms or Privacy Policy</li>
                <li>Respond to support requests and feedback</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">2.4. To Ensure Safety and Security</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Detect and prevent fraud, abuse, and violations of our Terms of Service</li>
                <li>Monitor for unauthorised access or suspicious activity</li>
                <li>Enforce community guidelines and content policies</li>
                <li>Comply with legal obligations and respond to lawful requests from authorities</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">3. Legal Basis for Processing</h2>
              <p>Under the Nigeria Data Protection Regulation (NDPR) and Nigeria Data Protection Act (NDPA), we process your personal data based on the following legal grounds:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Consent:</strong> You provide consent when creating an account and agreeing to this Privacy Policy. You may withdraw consent at any time by deleting your account, though this will end your access to the Platform.</li>
                <li><strong>Contract Performance:</strong> Processing necessary to provide you with the services you have subscribed to or requested.</li>
                <li><strong>Legitimate Interest:</strong> Processing necessary for our legitimate interests in operating, improving, and securing the Platform, provided these interests do not override your fundamental rights.</li>
                <li><strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws and regulations.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">4. How We Share Your Information</h2>
              <p>We do not sell, rent, or trade your personal information. We share your data only in the following circumstances:</p>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.1. With Other Users</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your username, profile picture, and online status are visible to other community members</li>
                <li>Messages you post in community channels are visible to members of that community</li>
                <li>Your reputation score, badges, and leaderboard ranking are visible to other users</li>
                <li>Shared notes and peer review submissions are visible to members of the respective channel or group</li>
              </ul>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.2. With Third-Party Service Providers</h3>
              <p>We share data with the following service providers who process data on our behalf:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-slate-200 rounded-md">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left px-4 py-2 font-bold text-slate-800 border-b border-slate-200">Provider</th>
                      <th className="text-left px-4 py-2 font-bold text-slate-800 border-b border-slate-200">Purpose</th>
                      <th className="text-left px-4 py-2 font-bold text-slate-800 border-b border-slate-200">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium">Google (Gemini AI)</td>
                      <td className="px-4 py-2">AI tutoring, quiz and flashcard generation</td>
                      <td className="px-4 py-2">Your prompts and questions (no personal identifiers are included in AI requests)</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium">Google (Sign-In)</td>
                      <td className="px-4 py-2">Authentication</td>
                      <td className="px-4 py-2">OAuth tokens (your Google password is never shared with us)</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium">Paystack</td>
                      <td className="px-4 py-2">Payment processing</td>
                      <td className="px-4 py-2">Transaction amount, email, and payment reference</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium">Supabase</td>
                      <td className="px-4 py-2">Database hosting and file storage</td>
                      <td className="px-4 py-2">All account and content data (stored in our managed database)</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2 font-medium">Cloudflare</td>
                      <td className="px-4 py-2">Frontend hosting and CDN</td>
                      <td className="px-4 py-2">Standard web request data (IP, headers) for content delivery</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Render</td>
                      <td className="px-4 py-2">Backend hosting</td>
                      <td className="px-4 py-2">All API request data processed on our backend servers</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.3. For Legal Reasons</h3>
              <p>We may disclose your information if required by law, regulation, legal process, or governmental request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</p>

              <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">4.4. In a Business Transfer</h3>
              <p>If Workshop Innovations Ltd. is involved in a merger, acquisition, or sale of assets, your personal data may be transferred as part of that transaction. We will notify you before your data becomes subject to a different privacy policy.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">5. Data Storage and Security</h2>
              <p>5.1. Your data is stored on servers provided by Supabase (database and file storage) and Render (backend application). These providers maintain their own security certifications and compliance standards.</p>
              <p>5.2. We implement the following security measures to protect your data:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Encryption in transit:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
                <li><strong>Password hashing:</strong> Passwords are hashed using bcrypt with salt before storage; we never store plaintext passwords</li>
                <li><strong>Token-based authentication:</strong> API access is protected by JWT (JSON Web Tokens) with expiry</li>
                <li><strong>Payment security:</strong> Payment processing is handled entirely by Paystack, a PCI-DSS compliant processor; we never handle or store card details</li>
                <li><strong>Webhook verification:</strong> Payment webhooks from Paystack are verified using HMAC signatures to prevent tampering</li>
                <li><strong>WebSocket authentication:</strong> Real-time connections require valid authentication tokens</li>
              </ul>
              <p className="mt-3">5.3. While we take reasonable steps to protect your data, no method of transmission or storage is 100% secure. We cannot guarantee absolute security, and you use the Platform at your own risk.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">6. Data Retention</h2>
              <p>6.1. <strong>Account Data:</strong> We retain your account information for as long as your account is active. If you request account deletion, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it.</p>
              <p>6.2. <strong>Community Messages:</strong> Messages posted in public channels remain visible to community members even after your account is deleted. Your username and profile picture will be replaced with a placeholder on deleted accounts.</p>
              <p>6.3. <strong>Direct Messages:</strong> Direct messages are retained until one or both parties delete their accounts, at which point they will be deleted.</p>
              <p>6.4. <strong>Payment Records:</strong> Transaction records are retained for a minimum of 6 years as required by Nigerian tax and financial regulations.</p>
              <p>6.5. <strong>Usage Logs:</strong> Session logs, study progress data, and task history are retained for as long as your account is active and deleted upon account deletion.</p>
              <p>6.6. <strong>AI Tutor Conversations:</strong> AI tutor interaction history is retained for your reference and deleted upon account deletion.</p>
              <p>6.7. <strong>Server Logs:</strong> Automated server logs containing IP addresses and request metadata are retained for up to 90 days for security and debugging purposes.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">7. Cookies and Local Storage</h2>
              <p>7.1. The Platform uses <strong>localStorage</strong> in your browser to store:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Your authentication token (to keep you logged in)</li>
                <li>User preferences and settings</li>
                <li>Pomodoro timer state (so it persists across page reloads)</li>
              </ul>
              <p className="mt-3">7.2. We do not use tracking cookies or advertising cookies. We do not use any third-party analytics services that track individual users across websites.</p>
              <p>7.3. Third-party services we integrate with (Cloudflare, Google) may set their own cookies according to their privacy policies when you interact with their features.</p>
              <p>7.4. You can clear localStorage and cookies through your browser settings at any time. Doing so will log you out and reset local preferences.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">8. Children's Privacy</h2>
              <p>8.1. WorkShop is designed for students, and we understand that some of our users may be minors (under 18 years of age). We require users to be at least <strong>13 years old</strong> to create an account.</p>
              <p>8.2. We do not knowingly collect personal information from children under 13. If we learn that we have collected data from a child under 13 without parental consent, we will promptly delete that information.</p>
              <p>8.3. For users between 13 and 18, we take the following additional precautions:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>We minimise the data we collect to what is necessary for the educational services</li>
                <li>We do not display minors' email addresses publicly (only usernames are shown)</li>
                <li>Community features include reporting mechanisms for inappropriate content</li>
                <li>We do not use personal data of minors for marketing purposes</li>
              </ul>
              <p className="mt-3">8.4. Parents or guardians of minors may contact us at <strong>support@workshop.com.ng</strong> to review, modify, or request deletion of their child's personal information.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">9. Your Rights</h2>
              <p>Under the Nigeria Data Protection Regulation (NDPR) and Nigeria Data Protection Act (NDPA), you have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you.</li>
                <li><strong>Right to Rectification:</strong> You may request that we correct inaccurate or incomplete personal data. You can also update most of your information directly through your profile settings.</li>
                <li><strong>Right to Erasure:</strong> You may request that we delete your personal data. We will comply unless we have a legal obligation to retain it.</li>
                <li><strong>Right to Restrict Processing:</strong> You may request that we limit the processing of your personal data in certain circumstances.</li>
                <li><strong>Right to Data Portability:</strong> You may request your personal data in a structured, commonly used, machine-readable format.</li>
                <li><strong>Right to Object:</strong> You may object to the processing of your personal data for purposes based on our legitimate interests.</li>
                <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, contact us at <strong>support@workshop.com.ng</strong>. We will respond to your request within 30 days. We may ask you to verify your identity before processing your request.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">10. International Data Transfers</h2>
              <p>10.1. Our third-party service providers (Supabase, Render, Google, Cloudflare) may store or process your data in jurisdictions outside Nigeria, including the United States and European Union.</p>
              <p>10.2. Where personal data is transferred outside Nigeria, we ensure that adequate safeguards are in place as required by the NDPR and NDPA. Our service providers maintain appropriate security standards and data protection commitments.</p>
              <p>10.3. By using the Platform, you consent to the transfer of your data to jurisdictions outside Nigeria as described in this policy.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">11. Data Breach Notification</h2>
              <p>11.1. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Notify the Nigeria Data Protection Commission (NDPC) within 72 hours of becoming aware of the breach, as required by law</li>
                <li>Notify affected users without undue delay through email and/or a prominent notice on the Platform</li>
                <li>Describe the nature of the breach, the data affected, and the steps we are taking to address it</li>
                <li>Provide recommendations for steps you can take to protect yourself</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">12. Changes to This Privacy Policy</h2>
              <p>12.1. We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be communicated through the Platform or by email at least 14 days before they take effect.</p>
              <p>12.2. The "Last updated" date at the top of this policy indicates when it was most recently revised. Your continued use of the Platform after the effective date of any changes constitutes acceptance of the updated policy.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">13. Complaints</h2>
              <p>If you believe that we have not handled your personal data properly or have concerns about our data practices, you may:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Contact us directly at <strong>support@workshop.com.ng</strong> and we will work to resolve your concern</li>
                <li>Lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ndpc.gov.ng</a></li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">14. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-white rounded-md border border-slate-200 p-5 mt-3">
                <p className="font-bold text-slate-900">Workshop Innovations Ltd.</p>
                <p><strong>Data Protection Contact:</strong> support@workshop.com.ng</p>
                <p>Website: <strong>workshop.com.ng</strong></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
