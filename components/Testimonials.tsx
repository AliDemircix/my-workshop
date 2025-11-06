"use client";

import { useState, useEffect } from 'react';

const testimonials = [
  {
    id: 1,
    name: "Sarah van der Berg",
    rating: 5,
    comment: "Absolutely loved the epoxy workshop! The instructor was so patient and helpful. I created a beautiful coaster set that I'm so proud of.",
    workshop: "Epoxy Coasters Workshop",
    date: "2 weeks ago"
  },
  {
    id: 2,
    name: "Michael Jensen",
    rating: 5,
    comment: "Great experience! Very well organized and all materials were provided. I had no experience with epoxy before but felt confident throughout the process.",
    workshop: "Beginner's Epoxy Art",
    date: "1 month ago"
  },
  {
    id: 3,
    name: "Lisa Bakker",
    rating: 5,
    comment: "The workshop exceeded my expectations. Small group size meant lots of personal attention. Can't wait to book another one!",
    workshop: "Advanced Resin Art",
    date: "3 weeks ago"
  },
  {
    id: 4,
    name: "Tom de Vries",
    rating: 5,
    comment: "Perfect for a creative afternoon! The studio has a wonderful atmosphere and the end results are amazing. Highly recommend!",
    workshop: "Epoxy Jewelry Making",
    date: "1 week ago"
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change testimonial every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
  };

  const prevTestimonial = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
  };

  return (
    <section className="bg-gray-50 -mx-4 px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">What Our Students Say</h2>
          <p className="text-lg text-gray-600">
            Don't just take our word for it - hear from our happy workshop participants!
          </p>
        </div>
        
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center min-h-[300px] flex flex-col justify-center">
            <div className="mb-6">
              {/* Star Rating */}
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-6 h-6 ${i < testimonials[currentIndex].rating ? 'text-[#c99706]' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              {/* Quote */}
              <blockquote className="text-lg md:text-xl text-gray-700 italic mb-6 leading-relaxed">
                "{testimonials[currentIndex].comment}"
              </blockquote>
            </div>
            
            <div className="space-y-2">
              <div className="font-semibold text-gray-900 text-lg">
                {testimonials[currentIndex].name}
              </div>
              <div className="text-[#c99706] font-medium">
                {testimonials[currentIndex].workshop}
              </div>
              <div className="text-sm text-gray-500">
                {testimonials[currentIndex].date}
              </div>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all duration-300"
            aria-label="Previous testimonial"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all duration-300"
            aria-label="Next testimonial"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-[#c99706]' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}