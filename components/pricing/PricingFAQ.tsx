'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function PricingFAQ() {
  const faqs = [
    {
      question: 'Do credits expire?',
      answer: 'No! All credits you purchase never expire. Use them at your own pace without any time pressure.',
    },
    {
      question: 'What counts as a credit?',
      answer: 'Only successful email verifications consume credits. Unknown results are completely free, and duplicate emails in the same batch are only charged once.',
    },
    {
      question: 'Can I upgrade or purchase more credits later?',
      answer: 'Absolutely! You can purchase additional credits at any time. Your new credits will be added to your existing balance.',
    },
    {
      question: 'What is your refund policy?',
      answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied with our service, contact us within 30 days of purchase for a full refund.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards through our secure payment processor, Stripe.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All new accounts start with 100 free credits so you can test our service before making a purchase.',
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left font-semibold">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
