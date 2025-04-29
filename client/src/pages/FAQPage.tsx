
/**
 * FAQPage.tsx
 * 
 * Enhanced with cosmic sacred geometry theme.
 */
import { useEffect, useRef } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";
import { HelpCircle, MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Dale's Cosmic Experience about?",
    answer: "Dale's Cosmic Experience is a unique blend of music, meditation, and cosmic consciousness. We combine sound healing frequencies, sacred geometry, and whale-inspired harmonies to create transformative experiences."
  },
  {
    question: "How can I participate in live sound healing sessions?",
    answer: "Live sound healing sessions are available through our Immersive Experience page. You can join scheduled events or book private sessions through our Community portal."
  },
  {
    question: "What are the benefits of frequency-based meditation?",
    answer: "Frequency-based meditation can help enhance focus, reduce stress, promote relaxation, and facilitate deeper states of consciousness. Each frequency is carefully chosen for specific therapeutic benefits."
  },
  {
    question: "How do I access the cosmic music collection?",
    answer: "Our cosmic music collection is available through the Music Release page. You can stream directly from our platform or connect with your preferred music service."
  },
  {
    question: "Can I collaborate on cosmic projects?",
    answer: "Yes! We welcome collaborations through our Community page. You can join existing projects or propose new ones through our Collaborative Shopping feature."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, digital wallets, and cryptocurrency for our merchandise and experiences. All transactions are secured with industry-standard encryption."
  },
  {
    question: "How are the sacred geometry patterns used in your products?",
    answer: "Our products incorporate sacred geometry patterns that enhance energetic coherence and cosmic alignment. Each pattern is carefully selected for its specific vibrational qualities that complement our sound healing frequencies."
  },
  {
    question: "Do you offer private sound healing sessions?",
    answer: "Yes, we offer personalized private sound healing sessions that can be customized to your specific needs and intentions. Contact us through our booking page to schedule a consultation."
  }
];

export default function FAQPage() {
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = "FAQ - Dale Loves Whales";
    // Scroll to top of page when component mounts
    pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#e8e6e3] relative" ref={pageTopRef}>
      {/* Cosmic Background */}
      <CosmicBackground opacity={0.5} color="indigo" nebulaEffect={true} />
      
      {/* Sacred geometry elements in page margins */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="fibonacci-spiral" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry type="dodecahedron" size={120} animate={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="icosahedron" size={120} animate={true} />
        </div>
        <div className="absolute bottom-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry type="tetrahedron" size={120} animate={true} />
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
        {/* Header with cosmic styling */}
        <div className="relative mb-12">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-14 -right-14 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center cosmic-slide-up">
            <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/20">
              <HelpCircle className="h-10 w-10 text-indigo-400 cosmic-rotate" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-300">
              Frequently Asked Questions
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto mb-6"></div>
            <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto">
              Explore our most common questions about Dale's cosmic journey, sound healing, and community experiences.
            </p>
          </div>
        </div>
        
        <Card className="cosmic-glow-box bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-500/20 shadow-lg mb-6 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
            
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-indigo-500/20 rounded-lg overflow-hidden">
                  <AccordionTrigger className="text-left py-4 px-6 hover:bg-indigo-900/30 rounded-t-lg transition-colors">
                    <span className="text-indigo-300 font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="bg-indigo-900/20 px-6 py-4 rounded-b-lg border-t border-indigo-500/20">
                    <p className="text-indigo-100/90">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
        
        <div className="text-center p-6 bg-gradient-to-br from-indigo-900/20 to-violet-900/20 rounded-xl border border-indigo-500/20 backdrop-blur-sm mb-10 relative cosmic-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl"></div>
          
          <p className="flex items-center justify-center gap-3 text-lg max-w-2xl mx-auto relative z-10">
            <MessageCircle className="h-5 w-5 text-indigo-400" />
            <span>
              Still have questions? Visit our{' '}
              <a href="/contact" className="text-indigo-300 hover:text-violet-300 transition-colors underline">
                contact page
              </a>{' '}
              to get in touch with our team.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
