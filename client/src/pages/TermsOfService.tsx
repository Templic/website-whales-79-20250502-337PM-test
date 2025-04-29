/**
 * TermsOfService.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Enhanced with cosmic sacred geometry theme.
 */
import { useEffect, useRef } from 'react';
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText, FileText } from "lucide-react";

const TermsEffectiveDate = () => {
  return (
    <div className="flex items-center justify-center gap-2 text-blue-300/80 my-4 text-sm">
      <FileText className="h-4 w-4" />
      <p>Terms Effective: Not In Effect - Draft Only</p>
    </div>
  );
};

const TermsOfService = () => {
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = "Terms of Service - Dale Loves Whales";
    // Scroll to top of page when component mounts
    pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);
  
  return (
    <div className="min-h-screen bg-[#050f28] text-[#e8e6e3] relative" ref={pageTopRef}>
      {/* Cosmic Background */}
      <CosmicBackground opacity={0.5} color="blue" nebulaEffect={true} />
      
      {/* Sacred geometry elements in page margins */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="seed-of-life" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="golden-spiral" size={120} animate={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="tree-of-life" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="sri-yantra" size={120} animate={true} />
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
        {/* Header with cosmic styling */}
        <div className="relative mb-8">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-14 -right-14 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center cosmic-slide-up">
            <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20">
              <ScrollText className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              Terms of Service
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mb-4"></div>
            <TermsEffectiveDate />
          </div>
        </div>
        
        <Card className="cosmic-glow-box bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/20 shadow-lg mb-6 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
            
            <section className="preamble mb-8 cosmic-fade-in">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Preamble</h2>
              <p className="text-blue-100/90">
                Welcome to Dale Loves Whales, a digital sanctuary where the art of music
                and the science of sound healing converge to create a unique experience for our users. 
                We are committed to delivering a platform that fosters creativity, well-being, 
                and community engagement. 
                Before you begin your journey with us, we ask you to familiarize yourself 
                with our Terms of Service.
              </p>
            </section>

            <section className="introduction mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Introduction</h2>
              <p className="text-blue-100/90">
                Welcome to the Dale Loves Whales Web App, your gateway to immersive music 
                and sound healing experiences. These Terms of Service are designed to ensure 
                a harmonious and legally compliant environment for all users.
              </p>
            </section>

            <section className="acceptance mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Acceptance of Terms</h2>
              <p className="text-blue-100/90">
                By using the Dale Loves Whales Web App, you acknowledge and accept these 
                Terms of Service. Continued use of the platform implies consent to these terms.
              </p>
            </section>

            <section className="overview mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Overview of Services</h2>
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                <ul className="list-disc pl-6 space-y-3 text-blue-100/90">
                  <li><strong className="text-blue-200">Music Streaming and Sound Healing:</strong> Our platform offers a variety of music streaming and sound healing sessions.</li>
                  <li><strong className="text-blue-200">Community Features:</strong> Engage in a vibrant community dedicated to wellness and creativity.</li>
                  <li><strong className="text-blue-200">Global Accessibility:</strong> Our services are available worldwide, reflecting our commitment to global inclusivity and wellness.</li>
                </ul>
              </div>
            </section>

            <section className="intellectual-property mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Intellectual Property</h2>
              <p className="text-blue-100/90">
                All content, including text, graphics, and music, is protected under intellectual property rights. 
                Unauthorized use of our content is prohibited without express permission.
              </p>
            </section>

            <section className="user-conduct mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">User Conduct</h2>
              <p className="text-blue-100/90 mb-2">The following behaviors are prohibited:</p>
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                <ul className="list-disc pl-6 space-y-2 text-blue-100/90">
                  <li>Spamming</li>
                  <li>Hacking</li>
                  <li>Any form of misconduct that disrupts the service's integrity</li>
                </ul>
              </div>
            </section>

            <section className="user-content mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">User-Generated Content</h2>
              <p className="text-blue-100/90">
                Users may submit content such as reviews and comments, which must comply with our community guidelines.
                By submitting content, you grant Dale Loves Whales a license to use, modify, and publish it.
              </p>
            </section>

            <section className="privacy mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Privacy</h2>
              <p className="text-blue-100/90">
                Our <a href="/privacy-policy" className="text-blue-300 underline hover:text-indigo-300 transition-colors">Privacy Policy</a> outlines how we collect, use, and protect your data. 
                By using our services, you consent to these practices.
              </p>
            </section>

            <section className="liability mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Limitation of Liability</h2>
              <p className="text-blue-100/90">
                Dale Loves Whales is not liable for any indirect or consequential damages 
                arising from the use of our services.
              </p>
            </section>

            <section className="termination mb-8">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Termination</h2>
              <p className="text-blue-100/90">
                We reserve the right to terminate or restrict access to users who violate 
                these Terms of Service.
              </p>
            </section>

            <section className="contact-info mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-300">Contact Information</h2>
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20 text-blue-100/90">
                <p>
                  For further inquiries or support, please reach out via:
                </p>
                <div className="mt-2 space-y-1">
                  <p><strong className="text-blue-200">Email:</strong> support@daleloveswhales.com</p>
                  <p><strong className="text-blue-200">Phone:</strong> (XXX) XXX-XXXX</p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
        
        <div className="text-center p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl border border-blue-500/20 backdrop-blur-sm mb-10 relative cosmic-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <p className="text-md max-w-2xl mx-auto relative z-10 text-blue-100/90">
            These Terms of Service constitute the entire agreement between you and Dale Loves Whales regarding your use of the platform.
            By continuing to access or use our Services after any revisions become effective, you agree to be bound by the revised terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;