
import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="privacy-policy-container container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
            <p>Terms Effective: Not In Effect Draft Only </p>
            
            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Preamble</h2>
                <p className="mb-4">
                    Welcome to Dale the Whale's Privacy Policy. Your privacy is of utmost importance to us, and we are committed to safeguarding your personal information. This policy outlines how we collect, use, and protect your data across our digital platforms. As you engage with our music, tour schedules, and content, we aim to ensure a secure and personalized experience. By using our services, you agree to the practices outlined in this policy, designed to enhance your interaction while respecting your privacy. We encourage you to read this policy carefully and reach out with any questions or concerns.
                </p>
            </section>

            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
                <p className="mb-4">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Account information (name, email, preferences)</li>
                    <li>Usage data and interaction with our services</li>
                    <li>Technical data (IP address, browser type)</li>
                    <li>Communication preferences</li>
                </ul>
            </section>

            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Use of Information</h2>
                <p className="mb-4">Your information helps us:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Provide and improve our services</li>
                    <li>Personalize your experience</li>
                    <li>Send relevant updates and newsletters</li>
                    <li>Process transactions and maintain security</li>
                </ul>
            </section>

            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Data Protection</h2>
                <p className="mb-4">
                    We implement appropriate security measures to protect your personal information. 
                    This includes encryption, secure servers, and regular security audits.
                </p>
            </section>

            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your data</li>
                    <li>Opt-out of marketing communications</li>
                </ul>
            </section>

            <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                <p className="mb-4">
                    For privacy-related questions or concerns, please contact us at:
                    <br />
                    Email: privacy@daleloveswhales.com
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
