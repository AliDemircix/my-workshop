"use client";

import { useState } from 'react';

const faqs = [
  {
    id: 1,
    question: "Do I need any prior experience with epoxy resin?",
    answer: "Not at all! Our workshops are designed for all skill levels, from complete beginners to experienced crafters. Our expert instructors will guide you through every step of the process."
  },
  {
    id: 2,
    question: "What's included in the workshop price?",
    answer: "Everything you need is included: premium epoxy resins, molds, pigments, safety equipment, tools, and expert instruction. You'll also take home your finished creation!"
  },
  {
    id: 3,
    question: "How long do the workshops last?",
    answer: "Most workshops are 2-3 hours long, which gives you plenty of time to create your piece and allow for proper instruction. The exact duration varies by workshop type."
  },
  {
    id: 4,
    question: "What should I wear to the workshop?",
    answer: "We recommend wearing comfortable clothes that you don't mind getting a bit messy. We provide aprons and gloves, but it's best to avoid your favorite outfit just in case!"
  },
  {
    id: 5,
    question: "Can I bring my own materials or designs?",
    answer: "We provide all materials to ensure quality and safety. However, you're welcome to discuss custom design ideas with your instructor during the workshop."
  },
  {
    id: 6,
    question: "What's your cancellation policy?",
    answer: "You can cancel up to 24 hours before your workshop for a full refund. Cancellations with less than 24 hours notice are subject to our standard cancellation fee."
  },
  {
    id: 7,
    question: "Is there parking available?",
    answer: "Yes! We have convenient parking available near our studio. Detailed location and parking information will be provided in your booking confirmation email."
  },
  {
    id: 8,
    question: "Can I book a private workshop for a group?",
    answer: "Absolutely! We offer private workshops for groups of 4 or more. Contact us directly to discuss your requirements and we'll create a custom experience for your group."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Got questions? We've got answers! Here are the most common questions about our workshops.
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq) => (
          <div 
            key={faq.id} 
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
          >
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center transition-colors duration-200"
              aria-expanded={openItems.includes(faq.id)}
            >
              <span className="font-semibold text-gray-900 pr-4">
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 text-[#c99706] transform transition-transform duration-200 ${
                  openItems.includes(faq.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            
            {openItems.includes(faq.id) && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-gray-600 mb-4">
          We're here to help! Don't hesitate to reach out with any questions.
        </p>
        <a 
          href="https://giftoria.nl/contact-us"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#c99706] hover:bg-[#b8860b] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
        >
          Contact Us
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </section>
  );
}