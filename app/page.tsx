'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
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
  Compass,
  FileCheck2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type ProjectCategory = 'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'INFRASTRUCTURE';

const PROJECTS = [
  {
    id: 1,
    title: 'Godrej Zen Estate Phase-2',
    category: 'RESIDENTIAL' as ProjectCategory,
    badge: 'Flagship • Ongoing',
    badgeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
    location: 'Prime Residential Corridor',
    specs: '2 & 3 BHK Luxury Residences • Retail Shops • Corporate Offices',
    description:
      'Earthquake-resistant RCC framed structure with modern clubhouse amenities, landscaped podiums, and 24x7 power & security infrastructure.',
  },
  {
    id: 2,
    title: 'Universal Corporate & Retail Plaza',
    category: 'COMMERCIAL' as ProjectCategory,
    badge: 'Commercial Hub',
    badgeColor: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    location: 'Central Business District, Patna',
    specs: 'High-Street Showrooms • Grade-A Office Suites • Basement Parking',
    description:
      'Contemporary architectural glass facade engineered for maximum visibility, high-efficiency HVAC/MEP systems, and seamless vertical mobility.',
  },
  {
    id: 3,
    title: 'Institutional & Academic Campus',
    category: 'INFRASTRUCTURE' as ProjectCategory,
    badge: 'Turnkey EPC',
    badgeColor: 'bg-blue-400/20 text-blue-100 border-blue-300/50',
    location: 'Bihar Infrastructure Zone',
    specs: 'Academic Blocks • Administrative Wing • Auditoriums & Roads',
    description:
      'Executed under strict IS-code lab testing, rapid slab-cycle engineering, and real-time digital ERP progress tracking.',
  },
];

export default function UniversalEngiconCorporateWebsite() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('ALL');
  const [enquiryForm, setEnquiryForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    enquiry_type: 'Residential / Commercial Booking',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const filteredProjects =
    selectedCategory === 'ALL'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === selectedCategory);

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

  const handleQuickEnquiry = (projectName: string) => {
    setEnquiryForm((prev) => ({
      ...prev,
      message: `I would like to receive floor plans, pricing, and availability details for ${projectName}.`,
    }));
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-900 selection:text-white">
      {/* 1. Top Corporate Navigation Bar (Light Theme + Embossed Buttons) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-900 to-slate-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-md border border-blue-950 group-hover:scale-105 transition-transform">
              UE
            </div>
            <div>
              <span className="block font-black text-lg sm:text-xl tracking-tight text-slate-900 leading-none">
                UNIVERSAL ENGICON
              </span>
              <span className="block text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] text-blue-800 uppercase mt-1">
                PRIVATE LIMITED
              </span>
            </div>
          </Link>

          {/* Embossed Button-Style Navigation */}
          <nav className="hidden md:flex items-center gap-2.5">
            {[
              { label: 'About Us', href: '#about' },
              { label: 'Core Divisions', href: '#services' },
              { label: 'Projects', href: '#projects' },
              { label: 'Engineering Edge', href: '#quality' },
              { label: 'Contact', href: '#contact' },
            ].map((nav) => (
              <a
                key={nav.label}
                href={nav.href}
                className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide text-slate-700 bg-gradient-to-b from-white to-slate-50 border border-slate-300/90 shadow-[0_2px_0_0_rgba(148,163,184,0.4)] hover:from-blue-50 hover:to-blue-100/70 hover:text-blue-900 hover:border-blue-400 active:translate-y-0.5 transition-all"
              >
                {nav.label}
              </a>
            ))}
          </nav>

          {/* Employee / MD ERP Portal Login CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-b from-blue-800 to-blue-950 border border-blue-950 shadow-[0_3px_0_0_rgba(15,23,42,0.5)] hover:from-slate-800 hover:to-slate-950 transition-all active:translate-y-0.5"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Employee ERP Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Architectural Hero Banner */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        {/* Subtle Architectural Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold uppercase tracking-wider shadow-xs">
              <Compass className="w-4 h-4 text-blue-800" />
              Civil Engineering • Infrastructure • Real Estate
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-slate-900 tracking-tight leading-[1.08]">
              Building Modern Landmarks with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-slate-900">
                Structural Precision.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              <strong>Universal Engicon Pvt. Ltd.</strong> combines visionary real estate development with heavy civil engineering discipline—backed by end-to-end digital ERP execution, lab-tested materials, and on-schedule delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#projects"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-900 text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-slate-900 hover:-translate-y-0.5 transition-all"
              >
                Explore Developments
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 font-bold text-sm border-2 border-slate-300 shadow-sm hover:border-blue-800 hover:text-blue-900 hover:bg-blue-50/40 transition-all"
              >
                Book Site Visit / Consultation
              </a>
            </div>
          </div>

          {/* Executive Profile & Operational Benchmarks Card */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    Managing Director
                  </span>
                  <p className="text-xl font-black text-slate-900">Mohammad Khalid Ahmad</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Universal Engicon Private Limited
                  </p>
                </div>
                <div className="p-3.5 bg-blue-900 text-white rounded-xl shadow-md">
                  <Building2 className="w-7 h-7" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                  <p className="text-2xl font-black text-blue-900">IS-456</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Certified Concrete & Steel QA</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                  <p className="text-2xl font-black text-emerald-700">100%</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">ERP-Monitored Site Execution</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                  <p className="text-2xl font-black text-slate-900">Turnkey</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Concept-to-Handover EPC</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                  <p className="text-2xl font-black text-amber-600">Zero</p>
                  <p className="text-xs font-bold text-slate-600 mt-1">Safety Compromise Standard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Engineering & Development Divisions */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div id="about" className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-800">
            Our Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
            Core Engineering & Real Estate Divisions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Delivering durable infrastructure and high-value residential & commercial spaces through disciplined engineering and modern construction technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-13 h-13 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-6 border border-blue-200 group-hover:bg-blue-900 group-hover:text-white transition-colors">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3">
              Residential & Commercial Real Estate
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Thoughtfully planned multi-storey apartments, gated communities, and high-street retail plazas built with earthquake-resistant RCC frames and premium finishes.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-800">
              RERA & Structural Compliance <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-13 h-13 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-6 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3">
              Civil & Public Infrastructure
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Institutional buildings, reinforced concrete roads, storm-water drainage networks, industrial warehouses, and heavy foundation works executed to exact BOQ specs.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700">
              Precision BOQ Execution <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-13 h-13 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-6 border border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3">
              Turnkey EPC Contracting
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Single-point responsibility covering architectural coordination, structural engineering, verified vendor procurement, MEP services, and quality-certified handover.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800">
              End-to-End Project Delivery <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </section>

      {/* 4. Interactive Projects Showcase with Embossed Filter Tabs */}
      <section id="projects" className="bg-white border-y border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-800">
                Project Portfolio
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                Flagship & Ongoing Developments
              </h2>
            </div>

            {/* Embossed Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'ALL', label: 'All Projects' },
                  { id: 'RESIDENTIAL', label: 'Residential' },
                  { id: 'COMMERCIAL', label: 'Commercial' },
                  { id: 'INFRASTRUCTURE', label: 'Infrastructure' },
                ] as { id: ProjectCategory; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wide border transition-all ${
                    selectedCategory === tab.id
                      ? 'bg-blue-900 text-white border-blue-950 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wide ${project.badgeColor}`}
                      >
                        {project.badge}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300">
                        {project.location}
                      </span>
                    </div>
                    <h3 className="text-xl font-black leading-snug group-hover:text-amber-300 transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <div className="p-6 space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-blue-800">
                      {project.specs}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickEnquiry(project.title)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-extrabold uppercase tracking-wide shadow-xs hover:bg-blue-900 hover:text-white hover:border-blue-950 transition-all flex items-center justify-center gap-2"
                  >
                    Request Details & Pricing
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Engineering & Execution Edge (Trust Strip) */}
      <section id="quality" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-400">
              The Universal Engicon Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">
              Why Clients & Institutions Trust Our Execution
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <FileCheck2 className="w-6 h-6 text-amber-400" />
              <h3 className="font-bold text-base">Lab-Tested Materials</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every batch of concrete, reinforcement steel, and aggregate undergoes strict cube & tensile quality verification.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-base">Digital ERP Transparency</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Daily Progress Reports (DPR), BOQ tracking, and milestone billing monitored live via our proprietary ERP.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <Clock className="w-6 h-6 text-blue-300" />
              <h3 className="font-bold text-base">Milestone Discipline</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dedicated site engineers and resource planning ensure timely completion without cost overruns.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h3 className="font-bold text-base">Statutory & Safety Rigor</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Full GST, RERA, labor welfare, and on-site PPE safety compliance across every active project site.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact & Project Enquiry Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Corporate Contact Info */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-400">
                Corporate Desk
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">
                Connect with Universal Engicon Pvt. Ltd.
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Whether you are looking to book a residential/commercial unit, discuss a turnkey construction contract, or register as an approved vendor—submit your enquiry here.
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-white/10 text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Registered & Corporate Office</p>
                  <p className="text-slate-300 text-xs mt-0.5">Patna, Bihar, India</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-white/10 text-amber-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Official Email</p>
                  <p className="text-slate-300 text-xs mt-0.5">info@universalengicon.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-white/10 text-amber-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold">Office Hours</p>
                  <p className="text-slate-300 text-xs mt-0.5">Mon – Sat: 10:00 AM – 7:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enquiry Form */}
          <div className="lg:col-span-7 p-8 sm:p-10">
            <h3 className="text-xl font-black text-slate-900 mb-1">Send an Official Enquiry</h3>
            <p className="text-xs text-slate-500 mb-6">
              Your message is logged directly into our corporate CRM for priority response.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                <div className="flex items-center gap-2 font-black text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                  Enquiry Logged Successfully!
                </div>
                <p className="text-sm text-emerald-900">
                  Thank you for contacting <strong>Universal Engicon Pvt. Ltd.</strong> Our project & sales desk has received your details and will reach out shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-lg hover:bg-emerald-900"
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
                      placeholder="Enter your full name"
                      value={enquiryForm.full_name}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, full_name: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-800"
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
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-800"
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
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Enquiry Category</label>
                    <select
                      value={enquiryForm.enquiry_type}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, enquiry_type: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold bg-white focus:outline-none focus:border-blue-800"
                    >
                      <option value="Residential / Commercial Booking">
                        Residential / Commercial Unit Booking
                      </option>
                      <option value="Turnkey Civil Construction">
                        Turnkey Civil Construction Contract
                      </option>
                      <option value="Vendor / Material Supplier Registration">
                        Vendor / Material Supplier Registration
                      </option>
                      <option value="Sub-Contractor Empanelment">
                        Sub-Contractor Empanelment
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Details / Message</label>
                  <textarea
                    rows={3}
                    placeholder="Share your project location, unit preference, or scope of work..."
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-900 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-slate-900 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting Enquiry...' : 'Submit Official Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. Corporate Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-extrabold text-white tracking-wide">
              © {new Date().getFullYear()} UNIVERSAL ENGICON PRIVATE LIMITED. All Rights Reserved.
            </p>
            <p className="mt-1 text-slate-400">
              Civil Construction • Infrastructure • Real Estate Developers
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact
            </a>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white font-bold hover:bg-blue-800 transition-colors"
            >
              Staff & MD ERP Login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}