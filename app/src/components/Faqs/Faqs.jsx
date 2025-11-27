import React, { useState } from 'react';
import './Faqs.css'


const faqData = [
  {
    question: "What exactly does Scrap-o do?",
    answer: "Scrap-o helps you find local business leads (from Google results), organize them, and send outreach emails — all in one place.",
    id: 1,
  },
  {
    question: "Where do the leads come from?",
    answer: "Scrap-o collects publicly available business information from Google Business listings (website, phone, address, rating, etc.).",
    id: 2,
  },
  {
    question: "Do I need to install anything?",
    answer: "No. Scrap-o is fully web-based. Open your browser → search → export/send emails.",
    id: 3,
  },
  {
    question: "Do I need a credit card to start?",
    answer: "No. You can explore the dashboard and scrape sample leads without entering payment details.",
    id: 4,
  },
  {
    question: "Can I connect my Gmail or Outlook to send emails?",
    answer: "Yes. Scrap-o uses the official Gmail & Outlook APIs — you authenticate once, and then you can send outreach directly from the app.",
    id: 5,
  },
];

const ChevronDown = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);


// Accordion Item Component
const AccordionItem = ({ faq, isOpen, onToggle }) => {
  // Determine if the answer content should be shown
  const contentHeightClass = isOpen ? 'max-h-96 pt-4' : 'max-h-0 pt-0';
  const iconRotationClass = isOpen ? 'rotate-180' : 'rotate-0';

  return (
    <div className="border-b border-gray-200">
      {/* Question Header - Always visible and clickable */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-base font-medium text-gray-800 hover:text-gray-900 transition-colors duration-200 focus:outline-none"
        aria-expanded={isOpen}
      >
        <span>{faq.question}</span>
        {/* Chevron Icon that rotates */}
        <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${iconRotationClass}`} />
      </button>

      {/* Answer Content - Collapsible section */}
      <div
        className={`overflow-hidden transition-[max-height,padding] duration-500 ease-in-out ${contentHeightClass}`}
      >
        <p className="pb-4 text-gray-600 text-sm leading-relaxed" style={{textAlign:'left'}}>
          {faq.answer}
        </p>
      </div>
    </div>
  );
};


// Main App Component
const Faqs = () => {
  // State to track which FAQ item is open. Null means none are open.
  const [openId, setOpenId] = useState(null);

  // Toggle function to open and close items
  const handleToggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen flex justify-center py-16 px-4 sm:px-6 lg:px-8 faq-parent">
      {/* Content Container - Mimics the centered, light gray card in the image */}
      <div className="w-full max-w-4xl p-8 sm:p-12">

        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="faq-h1 text-5xl text-gray-800 mb-4">
            FAQs
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto faq-p">
            Get answers to the most common questions about SCRAP-O.
          </p>
        </div>

        {/* Accordion List */}
        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {faqData.map((faq) => (
            <AccordionItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faqs;
