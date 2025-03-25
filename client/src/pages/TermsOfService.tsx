import React from 'react';

const TermsEffectiveDate: React.FC = () => {
  return (
    <p>Terms Effective: Not In Effect Draft Only </p>
  );
};

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-of-service-container container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
      <TermsEffectiveDate />

      <section className="preamble mb-6">
        <h2 className="text-xl font-semibold">Preamble</h2>
        <p>
          Welcome to Dale Loves Whales, a digital sanctuary where the art of music
          and the science of sound healing converge to create a unique experience for our users. 
          We are committed to delivering a platform that fosters creativity, well-being, 
          and community engagement. 
          Before you begin your journey with us, we ask you to familiarize yourself 
          with our Terms of Service.
        </p>
      </section>

      <section className="introduction mb-6">
        <h2 className="text-xl font-semibold">Introduction</h2>
        <p>
          Welcome to the Dale Loves Whales Web App, your gateway to immersive music 
          and sound healing experiences. These Terms of Service are designed to ensure 
          a harmonious and legally compliant environment for all users.
        </p>
      </section>

      <section className="acceptance mb-6">
        <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
        <p>
          By using the Dale Loves Whales Web App, you acknowledge and accept these 
          Terms of Service. Continued use of the platform implies consent to these terms.
        </p>
      </section>

      <section className="overview mb-6">
        <h2 className="text-xl font-semibold">Overview of Services</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Music Streaming and Sound Healing:</strong> Our platform offers a variety of music streaming and sound healing sessions.</li>
          <li><strong>Community Features:</strong> Engage in a vibrant community dedicated to wellness and creativity.</li>
          <li><strong>Global Accessibility:</strong> Our services are available worldwide, reflecting our commitment to global inclusivity and wellness.</li>
        </ul>
      </section>

      <section className="intellectual-property mb-6">
        <h2 className="text-xl font-semibold">Intellectual Property</h2>
        <p>
          All content, including text, graphics, and music, is protected under intellectual property rights. 
          Unauthorized use of our content is prohibited without express permission.
        </p>
      </section>

      <section className="user-conduct mb-6">
        <h2 className="text-xl font-semibold">User Conduct</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Spamming</li>
          <li>Hacking</li>
          <li>Any form of misconduct that disrupts the service's integrity.</li>
        </ul>
      </section>

      <section className="user-content mb-6">
        <h2 className="text-xl font-semibold">User-Generated Content</h2>
        <p>
          Users may submit content such as reviews and comments, which must comply with our community guidelines.
          By submitting content, you grant Dale Loves Whales a license to use, modify, and publish it.
        </p>
      </section>

      <section className="privacy mb-6">
        <h2 className="text-xl font-semibold">Privacy</h2>
        <p>
          Our Privacy Policy outlines how we collect, use, and protect your data. 
          By using our services, you consent to these practices.
        </p>
      </section>

      <section className="liability mb-6">
        <h2 className="text-xl font-semibold">Limitation of Liability</h2>
        <p>
          Dale Loves Whales is not liable for any indirect or consequential damages 
          arising from the use of our services.
        </p>
      </section>

      <section className="termination mb-6">
        <h2 className="text-xl font-semibold">Termination</h2>
        <p>
          We reserve the right to terminate or restrict access to users who violate 
          these Terms of Service.
        </p>
      </section>

      <section className="contact-info mb-6">
        <h2 className="text-xl font-semibold">Contact Information</h2>
        <p>
          For further inquiries or support, please reach out via:
          <br />
          Email: support@daleloveswhales.com
          <br />
          Phone: (XXX) XXX-XXXX
        </p>
      </section>
    </div>
  );
};

export default TermsOfService;