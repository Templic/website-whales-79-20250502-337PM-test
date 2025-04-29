/**
 * PrivacyPolicy.tsx
 * 
 * Comprehensive privacy policy page compliant with international privacy regulations
 * including GDPR, CCPA, CalOPPA, VCDPA, COPPA, PIPEDA, and PoPIA.
 * Enhanced with cosmic sacred geometry theme.
 */

import { useEffect, useRef } from 'react';
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { Shield, Lock } from "lucide-react";

const PrivacyPolicy = () => {
    // Get current date for the "Last Updated" timestamp
    const lastUpdated = new Date().toISOString().split('T')[0];
    const pageTopRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        document.title = "Privacy Policy - Dale Loves Whales";
        // Scroll to top of page when component mounts
        pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
    }, []);
    
    return (
        <div className="min-h-screen bg-[#0a192f] text-[#e8e6e3] relative" ref={pageTopRef}>
            {/* Cosmic Background */}
            <CosmicBackground opacity={0.5} color="purple" nebulaEffect={true} />
            
            {/* Sacred geometry elements in page margins */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Left margin sacred geometry - one at top, one at bottom */}
                <div className="absolute top-40 left-5 opacity-10 hidden md:block">
                    <SacredGeometry type="merkaba" size={120} animate={true} />
                </div>
                <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
                    <SacredGeometry type="platonic-solid" size={120} animate={true} />
                </div>
                
                {/* Right margin sacred geometry - one at top, one at bottom */}
                <div className="absolute top-40 right-5 opacity-10 hidden md:block">
                    <SacredGeometry type="metatron-cube" size={120} animate={true} />
                </div>
                <div className="absolute bottom-40 right-5 opacity-10 hidden md:block">
                    <SacredGeometry type="torus" size={120} animate={true} />
                </div>
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
                {/* Header with cosmic styling */}
                <div className="relative mb-12">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -top-14 -right-14 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="text-center cosmic-slide-up">
                        <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-purple-900/40 to-violet-900/40 border border-purple-500/20">
                            <Shield className="h-10 w-10 text-purple-400" />
                        </div>
                        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-300">
                            Privacy Policy
                        </h1>
                        <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-violet-500 mx-auto mb-6"></div>
                        <div className="flex items-center justify-center text-sm text-purple-300/90 mb-6">
                            <Lock className="h-4 w-4 mr-2" /> 
                            Last Updated: {lastUpdated}
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-purple-500/20 rounded-xl p-8 backdrop-blur-sm">
                
                <section className="mt-0">
                <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
                <p className="mb-4">
                    Cosmic Community Connect ("we," "our," or "us") is committed to protecting your privacy and ensuring you have a positive experience on our website and when using our services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
                <p className="mb-4">
                    This privacy policy applies to all information collected through our website, mobile applications, and/or any related services, sales, marketing, or events (collectively, the "Services").
                </p>
                <p className="mb-4">
                    Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Services.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium mt-4 mb-2">2.1 Personal Data</h3>
                <p className="mb-3">We may collect personal information that you voluntarily provide to us when you:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>Register for an account</li>
                    <li>Purchase products or services</li>
                    <li>Sign up for our newsletter</li>
                    <li>Participate in contests, surveys, or promotions</li>
                    <li>Contact us with inquiries or feedback</li>
                    <li>Post comments in our interactive features</li>
                </ul>
                
                <p className="mb-3">This personal information may include:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>Name and contact information (email address, phone number, mailing address)</li>
                    <li>Account credentials (username, password)</li>
                    <li>Payment and billing information</li>
                    <li>Demographic information (age, gender, location)</li>
                    <li>User preferences and interests</li>
                    <li>Audio and visual content you choose to share</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">2.2 Automatically Collected Information</h3>
                <p className="mb-3">When you access our Services, we may automatically collect certain information including:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>Device information (browser type, IP address, device type, operating system)</li>
                    <li>Usage data (pages visited, time spent, referring websites)</li>
                    <li>Location data (if permitted by your device settings)</li>
                    <li>Cookies and similar tracking technologies</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">2.3 Sensitive Personal Information</h3>
                <p className="mb-4">
                    We do not collect sensitive personal information (such as racial or ethnic origin, political opinions, religious beliefs, health data, biometric data, or sexual orientation) unless you explicitly provide it. If you choose to provide such information, we will only process it with your explicit consent or as permitted by applicable law.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
                <p className="mb-3">We may use the information we collect for various purposes, including:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>Providing, maintaining, and improving our Services</li>
                    <li>Processing transactions and managing your account</li>
                    <li>Personalizing your experience and delivering relevant content</li>
                    <li>Communicating with you about updates, promotions, and news</li>
                    <li>Responding to your inquiries and support requests</li>
                    <li>Conducting research and analytics to enhance our Services</li>
                    <li>Protecting our legal rights and preventing misuse</li>
                    <li>Complying with legal obligations</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">3.1 Legal Bases for Processing (GDPR)</h3>
                <p className="mb-3">If you are located in the European Economic Area (EEA), we process your personal information based on one or more of the following legal bases:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>Your consent</li>
                    <li>Performance of a contract with you</li>
                    <li>Compliance with our legal obligations</li>
                    <li>Protection of your vital interests</li>
                    <li>Performance of tasks carried out in the public interest</li>
                    <li>Our legitimate interests, provided they don't override your fundamental rights and freedoms</li>
                </ul>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">4. Sharing Your Information</h2>
                <p className="mb-4">
                    We may share your information with third parties in the following situations:
                </p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">4.1 Service Providers</h3>
                <p className="mb-4">
                    We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf, such as payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
                </p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">4.2 Business Transfers</h3>
                <p className="mb-4">
                    If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, receivership, dissolution, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
                </p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">4.3 Legal Requirements</h3>
                <p className="mb-4">
                    We may disclose your information where we are legally required to do so to comply with applicable law, governmental requests, judicial proceedings, court orders, or legal process, or to establish or protect our legal rights or defend against legal claims.
                </p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">4.4 With Your Consent</h3>
                <p className="mb-4">
                    We may share your information with third parties when you have given us your consent to do so.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">5. Cookies and Tracking Technologies</h2>
                <p className="mb-4">
                    We use cookies and similar tracking technologies to collect and track information about your browsing activities on our website. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Services.
                </p>
                <p className="mb-4">
                    We use the following types of cookies:
                </p>
                <ul className="list-disc pl-8 mb-4">
                    <li><strong>Essential Cookies:</strong> Required for the basic functionality of our website</li>
                    <li><strong>Functional Cookies:</strong> Enable personalized features and remember your preferences</li>
                    <li><strong>Analytical Cookies:</strong> Help us understand how visitors interact with our website</li>
                    <li><strong>Marketing Cookies:</strong> Track your browsing habits to deliver targeted advertising</li>
                </ul>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
                <p className="mb-4">
                    We implement appropriate technical and organizational security measures to protect the security of your personal information. These measures include encryption, secure servers, regular security audits, and access controls designed to prevent unauthorized access, alteration, disclosure, or destruction of your information.
                </p>
                <p className="mb-4">
                    However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">7. Data Retention</h2>
                <p className="mb-4">
                    We will retain your personal information only for as long as is necessary for the purposes set out in this privacy policy, or as needed to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
                </p>
                <p className="mb-4">
                    When we no longer need to process your personal information, we will either delete it or anonymize it so that it can no longer be associated with you. If deletion is not possible (for example, because your information has been stored in backup archives), we will securely store your information and isolate it from any further processing until deletion is possible.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">8. International Data Transfers</h2>
                <p className="mb-4">
                    Your information may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
                </p>
                <p className="mb-4">
                    If you are located outside the United States and choose to provide information to us, please note that we transfer the data, including personal data, to the United States and process it there. Your consent to this privacy policy followed by your submission of such information represents your agreement to that transfer.
                </p>
                <p className="mb-4">
                    For transfers from the EEA to countries not considered adequate by the European Commission, we have put in place appropriate safeguards, such as standard contractual clauses adopted by the European Commission, to protect your personal information.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">9. Your Rights</h2>
                <p className="mb-4">
                    Depending on your location, you may have certain rights regarding your personal information. These rights may include:
                </p>
                
                <h3 className="text-xl font-medium mt-4 mb-2">9.1 For EEA, UK, and Similar Jurisdictions (GDPR)</h3>
                <ul className="list-disc pl-8 mb-4">
                    <li><strong>Right to Access:</strong> Request access to your personal information</li>
                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate information</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your personal information</li>
                    <li><strong>Right to Restrict Processing:</strong> Request restriction of processing of your information</li>
                    <li><strong>Right to Data Portability:</strong> Receive your information in a structured, commonly used format</li>
                    <li><strong>Right to Object:</strong> Object to the processing of your information</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent at any time</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">9.2 For California Residents (CCPA/CPRA)</h3>
                <p className="mb-3">California residents have specific rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), including:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li><strong>Right to Know:</strong> Request disclosure of the personal information we have collected about you</li>
                    <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                    <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                    <li><strong>Right to Opt-Out:</strong> Opt-out of the sale or sharing of your personal information</li>
                    <li><strong>Right to Limit:</strong> Limit the use and disclosure of sensitive personal information</li>
                    <li><strong>Right to Non-Discrimination:</strong> Not be discriminated against for exercising your rights</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">9.3 For Virginia Residents (VCDPA)</h3>
                <p className="mb-3">Virginia residents have rights under the Virginia Consumer Data Protection Act (VCDPA), including:</p>
                <ul className="list-disc pl-8 mb-4">
                    <li>The right to confirm whether we are processing your personal data</li>
                    <li>The right to access your personal data</li>
                    <li>The right to correct inaccuracies in your personal data</li>
                    <li>The right to delete your personal data</li>
                    <li>The right to obtain a copy of your personal data</li>
                    <li>The right to opt out of targeted advertising, sale of personal data, and profiling</li>
                </ul>
                
                <h3 className="text-xl font-medium mt-4 mb-2">9.4 How to Exercise Your Rights</h3>
                <p className="mb-4">
                    To exercise your rights, please contact us using the contact information provided in the "Contact Us" section below. We may need to verify your identity before responding to your request. You may also authorize an agent to submit a request on your behalf, provided you give the agent written permission to do so and verify your identity with us.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">10. Children's Privacy</h2>
                <p className="mb-4">
                    Our Services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from children without verification of parental consent, we will take steps to remove that information from our servers.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">11. Changes to This Privacy Policy</h2>
                <p className="mb-4">
                    We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this policy. You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.
                </p>
                <p className="mb-4">
                    For material changes to this privacy policy, we will make reasonable efforts to provide notice, such as through a prominent notice on our website or by sending you an email notification.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">12. Consent Management</h2>
                <p className="mb-4">
                    You can manage your consent preferences at any time by adjusting your account settings or by contacting us directly. You can opt out of receiving promotional communications from us by following the unsubscribe instructions included in each promotional communication or by changing your notification settings in your account.
                </p>
                <p className="mb-4">
                    Please note that even if you opt out of receiving promotional communications, we may still send you non-promotional communications, such as those about your account, our ongoing business relations, or information about our Services.
                </p>
            </section>

            <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions, concerns, or requests regarding this privacy policy or our privacy practices, please contact us at:
                </p>
                <div className="pl-4 border-l-4 border-gray-300 mb-4">
                    <p className="mb-2"><strong>Email:</strong> privacy@cosmiccommunityconnect.com</p>
                    <p className="mb-2"><strong>Postal Address:</strong> 123 Cosmic Way, Suite 456, San Francisco, CA 94107, USA</p>
                    <p><strong>Phone:</strong> (555) 123-4567</p>
                </div>
                <p className="mb-4">
                    For data subjects in the European Union, we have appointed a Data Protection Officer who can be contacted at dpo@cosmiccommunityconnect.com for any inquiries related to data protection.
                </p>
                <p className="mb-4">
                    If you have a complaint about our privacy practices, we will do our best to address your concerns. If you feel your complaint has not been adequately resolved, you may have the right to lodge a complaint with your local data protection authority.
                </p>
            </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
