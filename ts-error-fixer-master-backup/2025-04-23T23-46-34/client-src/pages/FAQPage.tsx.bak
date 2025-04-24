
// Old version has been removed - using the enhanced version below
import React, { useState, useEffect } from 'react';
import { CosmicHeading } from '@/components/features/cosmic/CosmicHeading';
import { CosmicText } from '@/components/features/cosmic/CosmicText';
import { CosmicSection } from '@/components/features/cosmic/CosmicSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  }
];

export default function FAQPage() {
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = "FAQ - Dale Loves Whales";
  }, []);

  return (
    <CosmicSection className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <CosmicHeading className="text-center mb-12">
          Frequently Asked Questions
        </CosmicHeading>
        
        <CosmicText className="text-center mb-12 text-lg">
          Explore our most common questions about Dale's cosmic journey, sound healing, and community experiences.
        </CosmicText>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left py-4 px-6 hover:bg-[#303436]/10 rounded-lg transition-colors">
                <span className="text-[#00ebd6]">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4">
                <CosmicText>{faq.answer}</CosmicText>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <CosmicText className="text-lg">
            Still have questions? Contact us through our {' '}
            <a href="/contact" className="text-[#00ebd6] hover:text-[#fe0064] transition-colors">
              support page
            </a>
          </CosmicText>
        </div>
      </div>
    </CosmicSection>
  );
}
