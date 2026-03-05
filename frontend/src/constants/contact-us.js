'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import FloatingBackButton from '../components/FloatingBackButton';
import { validateEmail, validatePhone, validateName, validateSubject, validateMessage } from '../utils/fieldValidation';
import { FaCheck, FaTimes } from 'react-icons/fa';

const FORMSPREE_ENDPOINT = `https://formspree.io/${process.env.NEXT_PUBLIC_FORMSPREE_API_KEY}`;

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Real-time validation state
  const [emailValid, setEmailValid] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else {
      const r = validateName(formData.name); if (!r.isValid) newErrors.name = r.error;
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const r = validateEmail(formData.email); if (!r.isValid) newErrors.email = r.error;
    }
    if (formData.phone.trim()) {
      const r = validatePhone(formData.phone); if (!r.isValid) newErrors.phone = r.error;
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else {
      const r = validateSubject(formData.subject); if (!r.isValid) newErrors.subject = r.error;
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else {
      const r = validateMessage(formData.message); if (!r.isValid) newErrors.message = r.error;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time icon logic for email and phone
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    const result = validateEmail(value);
    setEmailValid(result.isValid);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, phone: value }));
    if (!value.trim()) setPhoneValid(true);
    else setPhoneValid(validatePhone(value).isValid);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Synchronous field error validation
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} is required` }));
      return;
    }

    if (name === 'email') {
      const r = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: r.isValid ? '' : r.error }));
    }
    if (name === 'phone' && value.trim()) {
      const r = validatePhone(value);
      setErrors((prev) => ({ ...prev, phone: r.isValid ? '' : r.error }));
    }
    if (name === 'name') {
      const r = validateName(value);
      setErrors((prev) => ({ ...prev, name: r.isValid ? '' : r.error }));
    }
    if (name === 'subject') {
      const r = validateSubject(value);
      setErrors((prev) => ({ ...prev, subject: r.isValid ? '' : r.error }));
    }
    if (name === 'message') {
      const r = validateMessage(value);
      setErrors((prev) => ({ ...prev, message: r.isValid ? '' : r.error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setErrors({});
        setEmailValid(false);
        setPhoneValid(true);
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600">
{/*      <section id="overview" className="fixed top-0 left-0 w-full z-40 pt-10 pb-8 bg-gradient-to-r from-teal-500 to-indigo-600 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2"> */}
            {/* Clickable Logo - Links to Homepage */}
 {/*}     <Link href="/" className="flex-shrink-0 transition-transform hover:scale-110 duration-200">
        <img
          src="/Globe_Only_WHITE.png"
          alt="A Blocks Nexus Logo"
          className="h-16 md:h-20 w-16 md:w-20 object-contain cursor-pointer"
        />
      </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white flex-1">Contact us</h1>
          </div>
        </div>
      </section> */}

      <div className="h-[60px] md:h-[80px]"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-6">We'd love to hear from you. Get in touch with our team today.</h2>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div>
              <label className="block text-white font-medium mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                onBlur={handleBlur}
                placeholder="Your Full Name"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-white/40 transition-colors"
              />
              {errors.name && <p className="text-red-300 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-medium mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="your@email.com"
                autoComplete="email"
                onChange={e => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  const result = validateEmail(e.target.value);
                  setEmailValid(result.isValid);

                  // Show error immediately as user types
                  setErrors(prev => ({
                    ...prev,
                    email: (!e.target.value || result.isValid) ? '' : result.error
                  }));
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-white/40 pr-10 transition-colors"
              />
              <div className="flex items-center mt-1 gap-2">
                {formData.email && emailValid && <FaCheck className="text-lg text-green-500" />}
                {formData.email && !emailValid && (
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, email: '' }));
                      setEmailValid(false);
                      setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors focus:outline-none"
                    aria-label="Clear email input"
                  >
                    <FaTimes className="text-lg" />
                  </button>
                )}
                {/* Show error live, not just on blur */}
                {formData.email && errors.email && (
                  <p className="text-red-300 text-sm">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white font-medium mb-2">Phone (Optional)</label>
              <input
  type="tel"
  name="phone"
  value={formData.phone}
  onChange={e => {
    setFormData(prev => ({ ...prev, phone: e.target.value }));
    const result = validatePhone(e.target.value);
    // Live validation show icons and error as you type
    setPhoneValid(result.isValid || !e.target.value.trim());
    setErrors(prev => ({
      ...prev,
      phone: (!e.target.value || result.isValid) ? '' : result.error
    }));
  }}
  onBlur={handleBlur}
  placeholder="+91 XXXXX XXXXX"
  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-white/40 pr-10 transition-colors"
  autoComplete="tel"
/>
<div className="flex items-center mt-1 gap-2">
  {/* Show green check if non-empty AND valid (ok to leave empty since it's optional) */}
  {formData.phone && phoneValid && <FaCheck className="text-lg text-green-500" />}
  {/* Show red X if non-empty AND invalid */}
  {formData.phone && !phoneValid && (
    <button
      type="button"
      onMouseDown={e => {
        e.preventDefault();
        setFormData(prev => ({ ...prev, phone: '' }));
        setPhoneValid(true);
        setErrors(prev => ({ ...prev, phone: '' }));
      }}
      className="text-red-500 hover:text-red-700 transition-colors focus:outline-none"
      aria-label="Clear phone input"
    >
      <FaTimes className="text-lg" />
    </button>
  )}
  {/* Live error message as you type */}
  {formData.phone && errors.phone && (
    <p className="text-red-300 text-sm">{errors.phone}</p>
  )}
</div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-white font-medium mb-2">Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                maxLength={80}
                onChange={handleFieldChange}
                onBlur={handleBlur}
                placeholder="What is this about?"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:outline-none focus:border-white/40 transition-colors"
              />

              <span className="text-xs text-white-500">
                {formData.subject.length}/{80} characters
              </span>

              {errors.subject && <p className="text-red-300 text-sm mt-1">{errors.subject}</p>}
            </div> 

            {/* Message */}
            <div>
              <label className="block text-white font-medium mb-2">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                maxLength={500}
                onChange={handleFieldChange}
                onBlur={handleBlur}
                placeholder="Tell us more about your inquiry..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white resize-none placeholder:text-blue-200 focus:outline-none focus:border-white/40 transition-colors"
              />

              <span className="text-xs text-white-500">
                {formData.message.length}/{500} characters
              </span>
              {errors.message && <p className="text-red-300 text-sm mt-1">{errors.message}</p>}
            </div>

            {submitted && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-200">
                Thank you! Your message has been sent successfully. We'll get back to you soon.
              </p>
            </div>
          )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold transition hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            <p className="text-white/60 text-sm mt-4 text-center">
              Required fields. We respect your privacy and will respond within 24 hours.
            </p>
          </form>
        </div>
      </div>
      <FloatingBackButton />
    </div>
  );
}
