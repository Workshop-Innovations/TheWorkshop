import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
  const lastUpdated = 'October 23, 2026';

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 bg-white border-b border-slate-100">
        <div className="w-full max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-500 text-sm font-medium">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="py-16 flex-grow">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-slate max-w-none space-y-10 text-slate-700 text-[15px] leading-relaxed">

            <div>
              <p>
                Welcome to WorkShop (<strong>"we"</strong>, <strong>"us"</strong>, <strong>"our"</strong>), operated by Workshop Innovations Ltd., a company registered in Nigeria. These Terms of Service (<strong>"Terms"</strong>) govern your access to and use of the WorkShop platform available at <strong>workshop.com.ng</strong> and its subdomains (collectively, the <strong>"Platform"</strong>), including our website, web application, API, and all related services.
              </p>
              <p>
                By creating an account, accessing, or using the Platform in any way, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">1. Eligibility</h2>
              <p>1.1. You must be at least <strong>13 years old</strong> to create an account and use WorkShop. If you are between 13 and 18 years old, you represent that your parent or legal guardian has reviewed and consented to these Terms on your behalf.</p>
              <p>1.2. If you are a parent or guardian who has consented to a minor's use of the Platform, you agree to be responsible for that minor's activity on the Platform, including any charges incurred.</p>
              <p>1.3. By using the Platform, you represent and warrant that you have the legal capacity to enter into a binding agreement and that all registration information you submit is accurate, current, and complete.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">2. Account Registration and Security</h2>
              <p>2.1. To access most features of the Platform, you must create an account by providing a valid email address, username, and password, or by authenticating through a supported third-party service such as Google Sign-In.</p>
              <p>2.2. You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must notify us immediately at <strong>support@workshop.com.ng</strong> if you suspect any unauthorised use of your account.</p>
              <p>2.3. We reserve the right to suspend or terminate accounts that we reasonably believe have been compromised or are being used in violation of these Terms.</p>
              <p>2.4. You may not create multiple accounts for the purpose of circumventing restrictions, abusing free-tier limits, or manipulating gamification systems such as reputation points or badges.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">3. Description of Services</h2>
              <p>WorkShop provides an educational platform designed primarily for African students preparing for examinations including but not limited to WAEC, JAMB, and NECO. Our services include:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Past Paper Access:</strong> A repository of verified past examination papers and questions organised by subject and year.</li>
                <li><strong>AI Tutoring:</strong> An artificial intelligence-powered tutoring system that provides explanations, answers questions, and assists with study topics. The AI tutor is powered by third-party AI models and is provided as a study aid, not as a substitute for professional teaching or academic guidance.</li>
                <li><strong>Flashcards and Study Tools:</strong> Tools for creating and studying flashcard sets, including AI-generated flashcards.</li>
                <li><strong>Community Features:</strong> Real-time messaging, direct messages, channels, study groups, shared notes, peer reviews, and gamification features (badges, reputation, leaderboards).</li>
                <li><strong>Task Management and Productivity:</strong> A personal task manager, Pomodoro timer, progress tracking, and session logging.</li>
                <li><strong>Revision Notes:</strong> Curated revision notes and subject summaries.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">4. Subscriptions and Payments</h2>
              <p>4.1. WorkShop offers both free and paid subscription tiers. The free tier provides access to core features. Paid tiers (Basic, Pro, Premium, Max) unlock additional features and higher usage limits.</p>
              <p>4.2. All payments are processed in <strong>Nigerian Naira (NGN)</strong> through <strong>Paystack</strong>, a licensed payment processor. By subscribing to a paid plan, you authorise Paystack to charge your chosen payment method for the applicable subscription fee.</p>
              <p>4.3. Subscription fees are billed on a recurring basis as specified at the time of purchase (monthly or as otherwise indicated). Your subscription will automatically renew at the end of each billing cycle unless you cancel it before the renewal date.</p>
              <p>4.4. We reserve the right to change subscription pricing at any time. Price changes will take effect at the start of your next billing cycle, and we will notify you in advance of any price increase.</p>
              <p>4.5. <strong>Refund Policy:</strong> Subscription payments are generally non-refundable. However, if you believe you have been charged in error, please contact us at <strong>support@workshop.com.ng</strong> within 7 days of the charge, and we will review your request on a case-by-case basis.</p>
              <p>4.6. If a payment fails or your subscription lapses, your account will revert to the free tier. You will not lose your data, but access to paid features will be restricted until payment is restored.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">5. AI Tutoring Disclaimer</h2>
              <p>5.1. The AI tutor feature is provided <strong>"as is"</strong> as a supplementary study tool. While we strive for accuracy, AI-generated content may contain errors, inaccuracies, or incomplete information.</p>
              <p>5.2. The AI tutor is <strong>not a replacement</strong> for qualified teachers, tutors, or academic advisors. You should not rely solely on AI-generated answers for examination preparation, academic decisions, or any high-stakes purpose.</p>
              <p>5.3. We do not guarantee the correctness, completeness, or reliability of any AI-generated content, including but not limited to explanations, quiz answers, flashcard content, and study suggestions.</p>
              <p>5.4. AI tutoring features are subject to daily usage limits based on your subscription tier. These limits may change at our discretion.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">6. User Content and Conduct</h2>
              <p>6.1. <strong>"User Content"</strong> means any text, messages, images, files, notes, reviews, or other material that you post, upload, or share through the Platform, including community messages, shared notes, peer reviews, profile pictures, and study group content.</p>
              <p>6.2. You retain ownership of your User Content. By posting User Content on the Platform, you grant us a non-exclusive, worldwide, royalty-free licence to host, store, display, reproduce, and distribute your User Content solely for the purpose of operating and improving the Platform.</p>
              <p>6.3. You represent and warrant that your User Content does not:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Violate any applicable law, regulation, or third-party right, including intellectual property rights</li>
                <li>Contain any material that is defamatory, obscene, abusive, threatening, or harassing</li>
                <li>Contain malware, viruses, or any harmful code</li>
                <li>Constitute spam, unsolicited advertising, or promotional material</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Share examination answers or facilitate cheating during live examinations</li>
                <li>Contain personally identifiable information of others without their consent</li>
              </ul>
              <p className="mt-3">6.4. We reserve the right to remove any User Content that violates these Terms or that we deem inappropriate, without prior notice. Repeated violations may result in account suspension or termination.</p>
              <p>6.5. You must not use the Platform to engage in any form of academic dishonesty, including but not limited to sharing live examination questions or answers, impersonating other students, or submitting AI-generated work as your own in academic contexts.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">7. Community Guidelines</h2>
              <p>7.1. The community features (channels, direct messages, study groups) are provided for educational discussion and collaboration. You agree to interact with other users respectfully and constructively.</p>
              <p>7.2. The following conduct is prohibited in all community spaces:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Bullying, harassment, hate speech, or discrimination based on ethnicity, religion, gender, disability, or any other characteristic</li>
                <li>Sharing explicit, violent, or sexually suggestive content</li>
                <li>Soliciting personal information from minors</li>
                <li>Advertising, solicitation, or commercial activity unrelated to the Platform</li>
                <li>Manipulating voting, reputation, or gamification systems</li>
                <li>Flooding or spamming channels with repetitive or irrelevant content</li>
              </ul>
              <p className="mt-3">7.3. Community moderators and administrators may remove messages, mute users, or escalate issues to us. Decisions made by moderators in good faith are at their discretion.</p>
              <p>7.4. We are not responsible for monitoring all community content in real-time. If you encounter content that violates these guidelines, please report it through the Platform or by contacting us.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">8. Intellectual Property</h2>
              <p>8.1. The Platform, including its design, code, features, logos, trademarks, and all original content (excluding User Content and third-party examination materials), is the property of Workshop Innovations Ltd. and is protected by applicable intellectual property laws.</p>
              <p>8.2. Past examination papers and questions hosted on the Platform are the intellectual property of their respective examination bodies (WAEC, JAMB, NECO, etc.). These materials are provided for personal, non-commercial, educational use only. Redistribution, commercial use, or republication of examination materials is strictly prohibited.</p>
              <p>8.3. You may not copy, modify, reverse-engineer, decompile, or create derivative works based on any part of the Platform without our prior written consent.</p>
              <p>8.4. All trademarks, service marks, and trade names used on the Platform are the property of their respective owners.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">9. Third-Party Services</h2>
              <p>9.1. The Platform integrates with and relies upon third-party services, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Google:</strong> For authentication (Google Sign-In) and AI capabilities (Google Gemini)</li>
                <li><strong>Paystack:</strong> For payment processing</li>
                <li><strong>Supabase:</strong> For data storage and file hosting</li>
                <li><strong>Cloudflare:</strong> For content delivery and frontend hosting</li>
                <li><strong>Render:</strong> For backend hosting</li>
              </ul>
              <p className="mt-3">9.2. Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the practices, policies, or availability of third-party services.</p>
              <p>9.3. We do not guarantee uninterrupted availability of third-party services, and service disruptions caused by third parties are outside our control.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">10. Prohibited Uses</h2>
              <p>You agree not to use the Platform to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Violate any applicable local, state, national, or international law or regulation</li>
                <li>Attempt to gain unauthorised access to any part of the Platform, other accounts, or connected systems</li>
                <li>Interfere with or disrupt the Platform's servers, networks, or infrastructure</li>
                <li>Use automated tools (bots, scrapers, crawlers) to access or extract data from the Platform without prior written permission</li>
                <li>Circumvent or attempt to circumvent any rate limits, usage limits, access restrictions, or security measures</li>
                <li>Use the AI tutor or any Platform feature for purposes unrelated to education, including generating commercial content</li>
                <li>Resell, sublicence, or commercially exploit access to the Platform or its content</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">11. Limitation of Liability</h2>
              <p>11.1. To the maximum extent permitted by law, Workshop Innovations Ltd., its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Platform.</p>
              <p>11.2. We shall not be liable for any loss or damage arising from:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Errors, inaccuracies, or omissions in AI-generated content or examination materials</li>
                <li>Unauthorised access to your account due to your failure to protect your credentials</li>
                <li>Examination outcomes or academic results, regardless of your use of the Platform</li>
                <li>Service interruptions, data loss, or downtime caused by third-party providers or events beyond our reasonable control</li>
                <li>Actions or content of other users on the Platform</li>
              </ul>
              <p className="mt-3">11.3. Our total aggregate liability to you for all claims arising from or related to these Terms or your use of the Platform shall not exceed the total amount you have paid to us in the 12 months preceding the claim, or NGN 10,000, whichever is greater.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">12. Disclaimers</h2>
              <p>12.1. The Platform is provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis. We make no representations or warranties of any kind, express or implied, regarding the Platform's fitness for a particular purpose, accuracy, reliability, or availability.</p>
              <p>12.2. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
              <p>12.3. Educational content on the Platform, including past papers, revision notes, and AI-generated material, is provided for informational and study purposes only. We do not guarantee that using the Platform will result in any particular academic outcome.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">13. Indemnification</h2>
              <p>You agree to indemnify, defend, and hold harmless Workshop Innovations Ltd., its directors, officers, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to your violation of these Terms, your User Content, or your use of the Platform.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">14. Account Suspension and Termination</h2>
              <p>14.1. We may suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms or if your use of the Platform poses a risk to other users or our systems.</p>
              <p>14.2. You may delete your account at any time by contacting us at <strong>support@workshop.com.ng</strong>. Upon deletion, your personal data will be handled in accordance with our <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>.</p>
              <p>14.3. Upon termination, your right to access the Platform ceases immediately. We may, but are not obligated to, delete your User Content following account termination.</p>
              <p>14.4. Sections that by their nature should survive termination (including but not limited to Intellectual Property, Limitation of Liability, Indemnification, and Governing Law) shall survive any termination of these Terms.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">15. Modifications to the Terms</h2>
              <p>15.1. We reserve the right to modify these Terms at any time. Material changes will be communicated through the Platform (such as a banner or notification) or by email at least 14 days before they take effect.</p>
              <p>15.2. Your continued use of the Platform after the effective date of updated Terms constitutes acceptance of the revised Terms. If you do not agree with the changes, you must stop using the Platform and may request account deletion.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">16. Governing Law and Dispute Resolution</h2>
              <p>16.1. These Terms shall be governed by and construed in accordance with the laws of the <strong>Federal Republic of Nigeria</strong>.</p>
              <p>16.2. Any dispute arising out of or in connection with these Terms shall first be resolved through good-faith negotiation. If the dispute cannot be resolved through negotiation within 30 days, either party may submit the dispute to mediation under the rules of the Lagos Court of Arbitration.</p>
              <p>16.3. If mediation fails, the dispute shall be submitted to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</p>
              <p>16.4. Nothing in this section prevents either party from seeking injunctive or other equitable relief from a court of competent jurisdiction where necessary to protect its rights.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">17. Severability</h2>
              <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">18. Entire Agreement</h2>
              <p>These Terms, together with the <Link to="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>, constitute the entire agreement between you and Workshop Innovations Ltd. regarding your use of the Platform and supersede all prior agreements, understandings, and communications, whether written or oral.</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-3">19. Contact Us</h2>
              <p>If you have any questions, concerns, or complaints about these Terms, please contact us at:</p>
              <div className="bg-white rounded-md border border-slate-200 p-5 mt-3">
                <p className="font-bold text-slate-900">Workshop Innovations Ltd.</p>
                <p>Email: <strong>support@workshop.com.ng</strong></p>
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

export default TermsOfService;
