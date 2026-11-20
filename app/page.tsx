'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  HardHat,
  ShieldCheck,
  Award,
  PhoneCall,
  Mail,
  MapPin,
  ArrowRight,
  Lock,
  CheckCircle2,
  Layers,
  Home,
  Landmark,
  Send,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function UniversalEngiconCorporateWebsite() {
  const [enquiryForm, setEnquiryForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    enquiry_type: 'Residential / Commercial Booking',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('website_enquiries').insert([enquiryForm]);
    setSubmitting(false);

    if (error) {
      alert('Unable to submit enquiry: ' + error.message);
    } else {
      setSubmitted(true);
      setEnquiryForm({
        full_name: '',
        phone: '',
        email: '',
        enquiry_type: 'Residential / Commercial Booking',
        message: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Top Corporate Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Company Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-md border border-blue-950">
              UE
            </div>
            <div>
              <span className="block font-black text-lg sm:text-xl tracking-tight text-slate-900 leading-none">
                UNIVERSAL ENGICON
              </span>
              <span className="block text-[11px] font-bold tracking-widest text-blue-800 uppercase mt-1">
                PRIVATE LIMITED
              </span>
            </div>
          </Link>

          {/* Embossed Button-Style Navigation Links */}
          <nav className="hidden md:flex items-center gap-2.5">
            <a
              href="#about"
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition-all"
            >
              About Us
            </a>
            <a
              href="#services"
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition-all"
            >
              Core Expertise
            </a>
            <a
              href="#projects"
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition-all"
            >
              Projects
            </a>
            <a
              href="#contact"
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition-all"
            >
              Contact
            </a>
          </nav>

          {/* Direct Employee / MD ERP Portal Login Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold text-white bg-blue-900 border border-blue-950 shadow-md hover:bg-slate-900 transition-all active:scale-95"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Employee ERP Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner Section */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-800" />
              Civil Engineering • Infrastructure • Real Estate
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Engineering Landmarks with <span className="text-blue-900">Precision & Trust.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              <strong>Universal Engicon Pvt. Ltd.</strong> delivers turnkey civil construction, modern residential townships, commercial complexes, and public infrastructure projects with uncompromising structural integrity and digital transparency.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-900 text-white font-bold text-sm shadow-lg hover:bg-slate-900 transition-all"
              >
                Explore Our Projects
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 font-bold text-sm border-2 border-slate-200 shadow-sm hover:border-blue-800 hover:text-blue-900 transition-all"
              >
                Request Project Consultation
              </a>
            </div>
          </div>

          {/* Corporate Highlights Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-blue-800">Corporate Leadership</p>
                  <p className="text-lg font-black text-slate-900">Mohammad Khalid Ahmad</p>
                  <p className="text-xs font-semibold text-slate-500">Managing Director, Universal Engicon Pvt. Ltd.</p>
                </div>
                <div className="p-3 bg-blue-900 text-white rounded-xl shadow">
                  <Award className="w-7 h-7" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-2xl font-black text-blue-900">100%</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">IS-Code Quality Compliance</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-2xl font-black text-emerald-700">ERP</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Digitally Monitored Sites</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-2xl font-black text-slate-900">Turnkey</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Design-to-Handover Execution</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-2xl font-black text-amber-600">Zero</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Safety Compromise Policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About & Core Expertise */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div id="about" className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-800">What We Build</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
            Core Engineering & Development Divisions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3">
            Combining seasoned civil engineering leadership with real-time digital project controls across every construction milestone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-5 border border-blue-200">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Residential & Commercial Real Estate</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Multi-storey residential apartments, luxury duplexes, and commercial retail hubs engineered with earthquake-resistant RCC structures and modern amenities.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 border border-amber-200">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Civil & Public Infrastructure</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Institutional campuses, roads, drainage networks, industrial sheds, and heavy foundation works executed on strict BOQ schedules.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 border border-emerald-200">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Turnkey EPC Contracting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              End-to-end architectural planning, structural engineering, material procurement, MEP integration, and quality-certified project delivery.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Featured Projects Showcase */}
      <section id="projects" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-800">Portfolio</span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">Flagship & Ongoing Developments</h2>
            </div>
            <a href="#contact" className="text-sm font-bold text-blue-800 hover:underline">
              Enquire for Unit Availability & Tenders →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
              <div className="h-44 bg-gradient-to-br from-blue-900 to-slate-800 p-6 flex flex-col justify-between text-white">
                <span className="self-start px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-bold">
                  Ongoing • Residential
                </span>
                <h3 className="text-xl font-black">Premium Residential Enclave</h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                <p className="font-bold text-slate-800">2 & 3 BHK Modern Apartments & Commercial Shops</p>
                <p className="text-slate-600 text-xs">
                  RERA-compliant earthquake-resistant frame structure, 24x7 power backup, and landscaped community zones.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
              <div className="h-44 bg-gradient-to-br from-slate-800 to-blue-950 p-6 flex flex-col justify-between text-white">
                <span className="self-start px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold">
                  Institutional & Civil
                </span>
                <h3 className="text-xl font-black">Educational & Institutional Campus</h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                <p className="font-bold text-slate-800">Academic Blocks, Administrative Wing & Sports Complex</p>
                <p className="text-slate-600 text-xs">
                  Executed with lab-tested concrete grades, modern fire-safety norms, and rapid slab-cycle engineering.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
              <div className="h-44 bg-gradient-to-br from-blue-800 to-slate-900 p-6 flex flex-col justify-between text-white">
                <span className="self-start px-3 py-1 rounded-full bg-blue-400/20 border border-blue-300 text-blue-100 text-xs font-bold">
                  Commercial & Infra
                </span>
                <h3 className="text-xl font-black">Corporate & Retail Plaza</h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                <p className="font-bold text-slate-800">High-Street Showrooms & Corporate Office Spaces</p>
                <p className="text-slate-600 text-xs">
                  Contemporary glass-facade elevation, basement parking, and high-efficiency MEP infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Contact & Project Enquiry Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Corporate Contact Info */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Get In Touch</span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">
                Start a Conversation with Universal Engicon
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Whether you are looking to book a residential/commercial unit, discuss a turnkey construction contract, or register as an approved vendor—reach out to our corporate desk.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Registered & Corporate Office</p>
                  <p className="text-slate-300 text-xs mt-0.5">Patna, Bihar, India</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Official Email</p>
                  <p className="text-slate-300 text-xs mt-0.5">info@universalengicon.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Business Hours</p>
                  <p className="text-slate-300 text-xs mt-0.5">Mon – Sat: 10:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className="lg:col-span-7 p-8 sm:p-10">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Send an Official Enquiry</h3>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-extrabold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                  Enquiry Received Successfully!
                </div>
                <p className="text-sm">
                  Thank you for contacting <strong>Universal Engicon Pvt. Ltd.</strong> Our project & sales team has logged your request and will connect with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={enquiryForm.full_name}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, full_name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98350 XXXXX"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enquiry Category</label>
                    <select
                      value={enquiryForm.enquiry_type}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, enquiry_type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 font-semibold"
                    >
                      <option value="Residential / Commercial Booking">Residential / Commercial Flat Booking</option>
                      <option value="Turnkey Civil Construction">Turnkey Civil Construction Contract</option>
                      <option value="Vendor / Material Supplier Registration">Vendor / Material Supplier Registration</option>
                      <option value="Sub-Contractor Empanelment">Sub-Contractor Empanelment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Details / Message</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your requirement..."
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white font-bold rounded-xl shadow hover:bg-slate-900 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Submit Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Corporate Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-bold text-white">
              © {new Date().getFullYear()} UNIVERSAL ENGICON PRIVATE LIMITED. All Rights Reserved.
            </p>
            <p className="mt-1">Civil Construction • Infrastructure • Real Estate Developers</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white font-semibold">
              Staff & MD ERP Login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}