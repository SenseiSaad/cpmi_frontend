"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Award,
  Building2,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Shield,
  ChevronRight,
  ChevronDown,
  Clock,
  FileCheck,
  Search,
  ExternalLink,
  Lock,
  Layers,
  HelpCircle,
  FileText,
  CreditCard,
  UserCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { modules } from "@/features/public/marketing";
import { extractToken, formatDate, isPlausibleToken, publicApi, type CertificateVerification } from "@/features/public/api";
import { ApiError } from "@/lib/api/error";

const fadeUp = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

const stagger = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.08,
    },
  },
  viewport: { once: true, margin: "-50px" },
};

export default function HomePage() {
  const [activeModuleIndex, setActiveModuleIndex] = useState(3); // Module 4 by default
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<CertificateVerification | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyResult(null);
    const token = extractToken(verifyInput);
    if (!isPlausibleToken(token)) {
      setVerifyError("Please enter the full verification token or link printed on the certificate.");
      return;
    }
    setVerifying(true);
    try {
      const result = await publicApi.verifyCertificate(token);
      if (result.found && result.certificate) {
        setVerifyResult(result);
      } else {
        setVerifyError("No certificate found matching this verification token. Please check it and try again.");
      }
    } catch (err) {
      setVerifyError(err instanceof ApiError ? err.message : "Verification is unavailable right now. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const selectedModule = modules[activeModuleIndex] || modules[3];

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-secondary-500 selection:text-primary-900">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* TOP COMPLIANCE NOTIFICATION BAR */}
      <div className="bg-primary-900 text-white/90 text-xs py-2 px-4 border-b border-primary-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-highlight-500 animate-pulse" />
            <span className="font-semibold text-secondary-400">Official Standards:</span>
            <span className="hidden sm:inline text-white/80">
              Compliant with 49 CFR Part 26 (DBE) & 49 CFR Part 23 (ACDBE) • WCAG 2.1 AA / Section 508
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <Link href="#verify" className="hover:text-secondary-400 transition-colors">
              Verify Credential
            </Link>
            <span className="hidden md:inline">|</span>
            <Link href="/auth/login" className="hover:text-secondary-400 transition-colors hidden md:inline">
              Agency Support
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1">
            <Logo size="md" />
          </Link>

          <div className="hidden lg:flex items-center gap-7">
            <Link href="/" className="text-sm font-semibold text-primary-500">
              Home
            </Link>
            <Link href="#overview" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
              About CPMI
            </Link>
            <Link href="#curriculum" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
              11-Module Curriculum
            </Link>
            <Link href="#solutions" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
              For Agencies
            </Link>
            <Link href="#assessments" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
              Accreditation
            </Link>
            <Link href="#procurement" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
              Procurement & PO
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              className="bg-secondary-500 hover:bg-secondary-400 text-primary-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* HERO SECTION (Screen 1 Reference) */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-primary-900 py-16 lg:py-24">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1800&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-900/95 to-primary-900/80" />

          {/* Decorative subtle grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#CFB112_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* LEFT: Headline & Value Prop */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:col-span-7 text-left"
              >
                <div className="inline-flex items-center gap-2 bg-secondary-500/15 border border-secondary-500/40 text-secondary-400 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
                  <Shield size={14} className="text-secondary-400" />
                  Official DBE / ACDBE Compliance Training
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
                  Build a Stronger Tomorrow
                  <span className="block text-secondary-400 mt-2">with CPMI Certification</span>
                </h1>

                <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl font-normal">
                  Government agencies trust CPMI for comprehensive DBE / ACDBE compliance training.
                  Equip your team with the knowledge, skills and certification they need to make a
                  bigger impact across federally funded transportation projects.
                </p>

                <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-white/90 mb-10">
                  {[
                    "11 Comprehensive Modules",
                    "Self-Paced & Responsive",
                    "Official Verifiable Certificate",
                    "Section 508 / WCAG 2.1 AA",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-secondary-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2.5 bg-secondary-500 hover:bg-secondary-400 text-primary-950 font-black px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-base focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
                  >
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="#curriculum"
                    className="flex items-center gap-2 border-2 border-white/40 text-white hover:border-white hover:bg-white/10 font-bold px-7 py-4 rounded-xl transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                  >
                    <Play size={16} className="text-secondary-400" />
                    Explore Curriculum
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT: Visual Trust Badge Box (Direct from Reference Screen 1) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="lg:col-span-5"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

                  <p className="text-xs font-bold uppercase tracking-widest text-secondary-400 mb-6">
                    Enterprise Standards
                  </p>

                  <div className="space-y-6">
                    {[
                      {
                        icon: Shield,
                        label: "Trusted by Government Agencies",
                        desc: "State DOTs, regional transit authorities & airport sponsors nationwide.",
                      },
                      {
                        icon: Star,
                        label: "Expert-Led Content",
                        desc: "Authored by former USDOT, FHWA, and civil rights compliance directors.",
                      },
                      {
                        icon: Award,
                        label: "Recognized Certification",
                        desc: "Immutable audit trail with unauthenticated public verification engine.",
                      },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-4">
                        <div className="w-13 h-13 w-12 h-12 bg-secondary-500/20 border border-secondary-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-secondary-400">
                          <Icon size={22} />
                        </div>
                        <div>
                          <p className="text-white font-bold text-base">{label}</p>
                          <p className="text-white/70 text-xs sm:text-sm mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-white/75">
                    <span>Target Delivery: Q4 2026</span>
                    <span className="text-secondary-400 font-semibold">Accreditation Target Q2 2027</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* AGENCY TRUST TICKER / PARTNERS */}
        <section className="py-8 bg-gray-50 border-b border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-5">
              Designed for Federal, State & Local Transportation Authorities
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Texas DOT (TxDOT)</span>
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Caltrans</span>
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Florida DOT (FDOT)</span>
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Federal Transit Admin (FTA)</span>
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Federal Aviation (FAA)</span>
              <span className="font-black text-gray-700 tracking-wider text-sm sm:text-base">Michigan DOT (MDOT)</span>
            </div>
          </div>
        </section>

        {/* KEY PLATFORM METRICS */}
        <section className="py-14 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { value: "11", label: "Training Modules", sub: "Complete DBE & ACDBE Scope", icon: BookOpen },
                { value: "1,248+", label: "Certified Learners", sub: "Across 12+ State Agencies", icon: Users },
                { value: "98.4%", label: "Pass Rate", sub: "With Rigorous Retake Control", icon: Award },
                { value: "50+", label: "Agency Partners", sub: "DOTs & Transit Authorities", icon: Building2 },
              ].map(({ value, label, sub, icon: Icon }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="bg-gray-50/70 border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-500">
                    <Icon size={22} />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-primary-500">{value}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* WHAT IS THIS PROJECT & WHY IT MATTERS (Educational Section) */}
        <section id="overview" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="max-w-3xl mx-auto text-center mb-16">
              <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                Statutory Mandate
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-900 mt-4 leading-tight">
                What is CPMI Certification & Why Does Your Agency Need It?
              </h2>
              <p className="text-gray-600 mt-4 text-base sm:text-lg leading-relaxed">
                Under federal law (<strong>49 CFR Part 26</strong> for highway/transit and <strong>49 CFR Part 23</strong> for airport concessions),
                any government agency receiving federal transportation grants must establish and maintain an active DBE program.
                Non-compliance can jeopardize hundreds of millions of dollars in federal infrastructure grant funding.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Federal Mandate & Funding Protection",
                  desc: "State DOTs and transit recipients must submit triennial DBE goals and enforce Commercially Useful Function (CUF) reviews. Certified staff ensure full audit-readiness for FHWA and FTA oversight audits.",
                  badge: "49 CFR Part 26",
                  icon: Shield,
                },
                {
                  title: "Staff Turnover & Onboarding Readiness",
                  desc: "Turnover among civil rights and contract officers leaves agencies vulnerable. CPMI allows agencies to purchase flexible seat pools, reassign seats when staff change, and onboard new officers in days.",
                  badge: "Flexible Seat Licenses",
                  icon: UserCheck,
                },
                {
                  title: "Rigorous Verifiable Credentials",
                  desc: "Unlike generic video libraries, CPMI provides server-side verified playback tracking, randomized question banks, anti-cheating mechanisms, and verifiable tamper-evident certificates.",
                  badge: "Accreditation Target Q2 2027",
                  icon: FileCheck,
                },
              ].map(({ title, desc, badge, icon: Icon }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 text-primary-500">
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-secondary-600 uppercase tracking-wider bg-secondary-50 px-2.5 py-0.5 rounded-full border border-secondary-100">
                    {badge}
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-3 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 11-MODULE INTERACTIVE CURRICULUM EXPLORER */}
        <section id="curriculum" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                11-Module Master Syllabus
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-900 mt-4">
                Comprehensive DBE / ACDBE Curriculum
              </h2>
              <p className="text-gray-600 mt-3 text-base">
                11 expertly developed modules covering the entire regulatory lifecycle from certification to jobsite enforcement.
              </p>
            </motion.div>

            {/* Modules Grid / Selector */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Module List (Left 5 Cols) */}
              <div className="lg:col-span-5 space-y-2 max-h-[620px] overflow-y-auto pr-2">
                {modules.map((m, idx) => {
                  const isSelected = idx === activeModuleIndex;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        isSelected
                          ? "bg-primary-900 text-white border-primary-900 shadow-md"
                          : "bg-white text-gray-800 border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                            isSelected ? "bg-secondary-500 text-primary-950" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {m.code}
                        </span>
                        <div>
                          <p className={`text-sm font-bold line-clamp-1 ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {m.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${isSelected ? "text-white/70" : "text-gray-500"}`}>
                            {m.lessonsCount} Lessons • {m.duration}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className={isSelected ? "text-secondary-400" : "text-gray-400"} />
                    </button>
                  );
                })}
              </div>

              {/* Module Detail Card (Right 7 Cols) */}
              <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-500 text-white font-black text-xs px-3 py-1 rounded-md">
                      {selectedModule.code}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {selectedModule.regulatoryRef}
                    </span>
                  </div>
                  <span className="text-xs bg-secondary-100 text-secondary-800 font-bold px-3 py-1 rounded-full">
                    {selectedModule.duration} Total Duration
                  </span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-3">{selectedModule.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedModule.fullDesc}</p>

                {/* Lesson breakdown */}
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                  Module Lessons & Practical Units
                </h4>

                <div className="space-y-2.5 mb-6">
                  {selectedModule.lessons && selectedModule.lessons.length > 0 ? (
                    selectedModule.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center justify-between hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">
                            {lesson.lessonNumber}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900">{lesson.title}</p>
                            <p className="text-[11px] text-gray-500 line-clamp-1">{lesson.summary}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium ml-2">{lesson.duration}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
                      Detailed syllabus and video lectures provided via client content repository.
                      Includes {selectedModule.lessonsCount} interactive lessons, reading briefs, and end-of-module assessment.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <FileText size={14} className="text-secondary-600" /> Downloadable Guide Included
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award size={14} className="text-highlight-500" /> End-of-Module Quiz
                    </span>
                  </div>
                  <Link
                    href="/auth/login"
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Enroll in Module <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR & WHAT IT OFFERS (Detailed Solutions by Role) */}
        <section id="solutions" className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-secondary-400 font-bold text-xs uppercase tracking-widest bg-secondary-500/10 px-3.5 py-1 rounded-full border border-secondary-500/30">
                Tailored for Every Stakeholder
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-4">
                What CPMI Delivers & To Whom
              </h2>
              <p className="text-white/70 mt-3 text-base">
                A purpose-built ecosystem for agency directors, compliance staff, and program administrators.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <motion.div
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-secondary-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center mb-6">
                    <Building2 size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-1">For Government Agencies</p>
                  <h3 className="text-xl font-black text-white mb-3">Purchasing Contacts & DOTs</h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Built to satisfy strict state and federal procurement requirements with complete tenant isolation.
                  </p>
                  <ul className="space-y-3 text-xs text-white/80">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>PO-based invoicing & card payments via Stripe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Seat pool licenses with instant employee turnover reassignment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Bulk onboarding with 15+ staff CSV upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Exportable CSV/PDF compliance reports for FHWA/FTA audits</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link href="/auth/login" className="text-xs text-secondary-400 font-bold hover:underline flex items-center gap-1">
                    Agency Admin Login <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                className="bg-primary-800/80 border border-secondary-500/40 rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-secondary-500 text-primary-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  Most Popular
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary-500 text-primary-950 flex items-center justify-center mb-6">
                    <GraduationCap size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary-300 mb-1">For Enrolled Staff</p>
                  <h3 className="text-xl font-black text-white mb-3">Compliance Officers & Learners</h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-6">
                    Intuitive, self-paced learning portal designed for desktop, tablet, and mobile browsers.
                  </p>
                  <ul className="space-y-3 text-xs text-white/90">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>11-module self-paced progression with resume-anywhere</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Server-side verified video player tracking (not client spoofable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Downloadable regulatory guides, templates & spreadsheets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Instant official PDF certificate issuance upon exam passing</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link href="/auth/login" className="text-xs text-secondary-400 font-bold hover:underline flex items-center gap-1">
                    Learner Portal Login <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-secondary-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary-500/20 text-secondary-400 flex items-center justify-center mb-6">
                    <Shield size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary-400 mb-1">For Program Leadership</p>
                  <h3 className="text-xl font-black text-white mb-3">Training Managers & Admins</h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Centralized platform governance, content authoring, analytics, and credential oversight.
                  </p>
                  <ul className="space-y-3 text-xs text-white/80">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Real-time cross-agency enrollment and completion telemetry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Assessment question bank management & score distribution curves</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Certificate issuance, revocation, and audit trail ledger</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={15} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                      <span>Automated email triggers (invites, completion, renewals)</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <Link href="/auth/login" className="text-xs text-secondary-400 font-bold hover:underline flex items-center gap-1">
                    Super Admin Console <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ASSESSMENT ENGINE & ACCREDITATION RIGOR */}
        <section id="assessments" className="py-20 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="lg:col-span-6">
                <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                  Accreditation Ready
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-primary-900 mt-4 leading-tight">
                  Engineered for Regulatory Accreditation & Zero Answer-Sharing
                </h2>
                <p className="text-gray-600 mt-4 text-base leading-relaxed">
                  To meet the client&apos;s upcoming <strong>Q2 2027 Accreditation</strong> requirements, CPMI implements
                  a custom-built testing engine designed to eliminate collusion and accurately verify regulatory comprehension.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    {
                      title: "Randomized Question Banks & Shuffling",
                      desc: "Questions and answers are algorithmically shuffled per candidate, preventing answer-sharing across agency cohorts.",
                    },
                    {
                      title: "Custom Matching & Scenario Types",
                      desc: "Includes multiple choice, true/false, and term-to-definition matching that test genuine regulatory application.",
                    },
                    {
                      title: "Immutable Audit Trail",
                      desc: "Every completion, score, attempt timestamp, and verification log is permanently recorded for state and federal compliance audits.",
                    },
                    {
                      title: "Configurable Passing & Retake Policy",
                      desc: "Standard 80% passing threshold with configurable retake intervals and governance.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Interactive Quiz Engine Preview (Screen 5 Reference) */}
              <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="lg:col-span-6">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-8">
                  {/* Quiz Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Logo size="sm" showSubtitle={false} />
                      <span className="text-xs font-bold text-gray-500">| Module 4 Assessment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                      <Clock size={13} />
                      <span>00:18:32</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="my-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Question 3 of 10</span>
                      <span>30% Complete</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-highlight-500 h-full w-[30%] rounded-full" />
                    </div>
                  </div>

                  {/* Question Box */}
                  <div className="py-3">
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      Which of the following is a key requirement for DBE certification under 49 CFR Part 26?
                    </p>

                    <div className="mt-4 space-y-2.5">
                      {[
                        { id: "A", text: "Minimum 10 years of continuous business operation" },
                        { id: "B", text: "Ownership and control by socially and economically disadvantaged individuals", selected: true },
                        { id: "C", text: "Annual business revenue exceeding $5 million" },
                        { id: "D", text: "Physical principal office located in a different state" },
                      ].map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors ${
                            opt.selected
                              ? "bg-primary-50/70 border-primary-500 text-primary-900"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              opt.selected ? "bg-primary-500 text-white" : "border border-gray-300 text-gray-500"
                            }`}
                          >
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Navigation */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
                      ← Previous
                    </button>
                    <button className="px-5 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                      Next →
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PUBLIC CERTIFICATE VERIFICATION PORTAL SECTION (Screen 6 Reference) */}
        <section id="verify" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                Public Verification Portal
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-900 mt-4">
                Instant Public Credential Verification
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base">
                Anyone can verify an officer&apos;s certification validity in real-time. Unauthenticated, rate-limited, and tamper-resistant.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    placeholder="Enter verification token or link from the certificate"
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {verifying ? "Verifying…" : "Verify Certificate"}
                </button>
              </form>

              {verifyError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm mb-6">
                  {verifyError}
                </div>
              )}

              {/* Certificate Card Render (Matching Screen 6) */}
              {verifyResult?.certificate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/20 border-4 border-double border-secondary-500/40 rounded-3xl p-8 sm:p-12 shadow-xl"
                >
                  {/* Watermark / Seal */}
                  <div className="flex flex-col items-center text-center">
                    <Logo size="md" />
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-bold mt-2">
                      Official Compliance Credential
                    </p>

                    <h3 className="text-2xl sm:text-3xl font-serif font-black text-primary-950 mt-6 tracking-wide">
                      CERTIFICATE OF COMPLETION
                    </h3>

                    <p className="text-xs text-gray-500 italic mt-3">This certifies that</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 border-b-2 border-secondary-500 pb-1 px-4">
                      {verifyResult.certificate.learnerName}
                    </p>

                    <p className="text-xs text-gray-600 mt-4 max-w-lg leading-relaxed">
                      has successfully satisfied all rigorous curriculum requirements, module assessments, and final examinations for the
                    </p>
                    <p className="text-base sm:text-lg font-bold text-primary-900 mt-1">
                      {verifyResult.certificate.courseTitle}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-8 pt-6 border-t border-gray-200 text-left">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Certificate ID</p>
                        <p className="text-xs font-black text-primary-900 mt-0.5">{verifyResult.certificate.certificateNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Issue Date</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(verifyResult.certificate.issuedAt)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Expiry Date</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(verifyResult.certificate.expiresAt)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                        {verifyResult.valid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-highlight-600 bg-highlight-50 px-2 py-0.5 rounded-full mt-0.5">
                            <CheckCircle size={11} /> Verified &amp; Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full mt-0.5">
                            Revoked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* GOVERNMENT PROCUREMENT & PRICING */}
        <section id="procurement" className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                Government Procurement
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-900 mt-4">
                Flexible Agency Purchasing & Purchase Order (PO) Invoicing
              </h2>
              <p className="text-gray-600 mt-3 text-base">
                We accommodate government procurement rules. In addition to credit cards, we provide direct Stripe Invoicing for state & federal purchase orders.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Card 1: Annual Program License */}
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    Complete 11-Module Program
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 mt-4">Annual Agency Seat License</h3>
                  <p className="text-gray-500 text-xs mt-1">Full 11-module certification program with 1-year access.</p>

                  <div className="my-6">
                    <span className="text-4xl font-black text-primary-500">$1,495</span>
                    <span className="text-xs text-gray-500 font-medium"> / seat / year</span>
                    <p className="text-xs text-gray-400 mt-1">Volume agency discounts available for 10+ seats.</p>
                  </div>

                  <ul className="space-y-3 text-xs text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>All 11 modules + comprehensive final exam</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Unlimited seat reassignment upon staff turnover</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Official PDF certificates + public verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Purchase Order (PO) invoice net-30 terms supported</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Link
                    href="/auth/login"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl text-center block text-xs transition-colors"
                  >
                    Request Agency PO Quote
                  </Link>
                </div>
              </div>

              {/* Card 2: Modular Payment Plan */}
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full">
                    Modular Flexibility
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 mt-4">Per-Module or Monthly Plan</h3>
                  <p className="text-gray-500 text-xs mt-1">Enroll staff in specific modules or choose monthly installments.</p>

                  <div className="my-6">
                    <span className="text-4xl font-black text-gray-900">$175</span>
                    <span className="text-xs text-gray-500 font-medium"> / module enrolled</span>
                    <p className="text-xs text-gray-400 mt-1">Ideal for refresher training or specialized compliance roles.</p>
                  </div>

                  <ul className="space-y-3 text-xs text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Choose specific modules (e.g. ACDBE Concessions or Goal Setting)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Individual module assessment and certificate badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Stripe automated monthly billing & receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-primary-500" />
                      <span>Bulk CSV invitation & roster integration</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <Link
                    href="/auth/login"
                    className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-50 font-bold py-3 rounded-xl text-center block text-xs transition-colors"
                  >
                    Explore Modular Options
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView" className="text-center mb-12">
              <span className="text-secondary-600 font-bold text-xs uppercase tracking-widest bg-secondary-50 px-3.5 py-1 rounded-full border border-secondary-200">
                Common Questions
              </span>
              <h2 className="text-3xl font-black text-primary-900 mt-3">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-3">
              {[
                {
                  q: "Can our agency pay via Purchase Order (PO) instead of a credit card?",
                  a: "Yes. Many government procurement departments cannot use credit cards for software licenses. We provide automated Stripe Invoicing with Net 30 payment terms, W-9 forms, and vendor registration assistance.",
                },
                {
                  q: "What happens if a trained employee leaves the agency?",
                  a: "Agency Admins can immediately reassign the seat to a new staff member at no additional cost. The previous employee's earned certificate remains historically documented in the immutable audit ledger.",
                },
                {
                  q: "Does this course satisfy USDOT and FHWA DBE program requirements?",
                  a: "Yes. The curriculum specifically trains staff in the statutory mandates of 49 CFR Part 26 and 49 CFR Part 23, including triennial goal setting, Commercially Useful Function (CUF) reviews, Good Faith Efforts (GFE), and Uniform Reporting.",
                },
                {
                  q: "How does server-side video tracking work?",
                  a: "To ensure legitimate accreditation compliance, the video player sends periodic server heartbeats. A lesson cannot be marked complete simply by skipping the video client-side; minimum verifiable watch time is enforced.",
                },
                {
                  q: "Is the platform Section 508 and WCAG 2.1 AA accessible?",
                  a: "Yes. As government suppliers, we adhere to strict WCAG 2.1 AA and Section 508 standards, including high contrast ratios, screen reader support, full keyboard navigability, and closed captions.",
                },
              ].map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="border border-gray-200 rounded-2xl overflow-hidden transition-colors">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full text-left p-5 flex items-center justify-between font-bold text-sm sm:text-base text-gray-900 hover:bg-gray-50 focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary-500" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL HIGH-IMPACT CALL TO ACTION */}
        <section className="py-20 bg-secondary-500 text-primary-950 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <motion.div variants={fadeUp} initial="initial" whileInView="whileInView">
              <span className="text-primary-950/80 font-black text-xs uppercase tracking-widest bg-primary-950/10 px-3.5 py-1 rounded-full">
                Compliance • Training • Impact
              </span>
              <h2 className="text-3xl sm:text-5xl font-black mt-4 leading-tight">
                Build a Stronger Tomorrow with CPMI Certification
              </h2>
              <p className="mt-4 text-primary-900/85 text-base sm:text-lg max-w-xl mx-auto font-medium">
                Equip your team with official DBE / ACDBE credentials today. Ensure federal transit compliance and audit readiness.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/login"
                  className="bg-primary-900 hover:bg-primary-950 text-white font-black px-9 py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-base inline-block focus:outline-none focus:ring-2 focus:ring-primary-900 focus:ring-offset-2"
                >
                  Start Training Now
                </Link>
                <Link
                  href="/auth/login"
                  className="border-2 border-primary-950 text-primary-950 hover:bg-primary-950 hover:text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 text-base inline-block"
                >
                  Contact Agency Procurement
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* RICH ENTERPRISE FOOTER */}
      <footer className="bg-primary-950 text-white/70 py-16 border-t border-primary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Logo variant="light" size="md" />
              <p className="text-xs text-white/60 mt-4 max-w-sm leading-relaxed">
                Certification Professionals Mastery Institute (CPMI) provides accredited DBE and ACDBE compliance training programs for state DOTs, federal transit agencies, and airport concession authorities nationwide.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-secondary-400 font-semibold">
                <Shield size={14} /> WCAG 2.1 AA / Section 508 Compliant
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Curriculum</p>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="#curriculum" className="hover:text-white transition-colors">Introduction to DBE</Link></li>
                <li><Link href="#curriculum" className="hover:text-white transition-colors">Eligibility & PNW</Link></li>
                <li><Link href="#curriculum" className="hover:text-white transition-colors">Goal Setting & Availability</Link></li>
                <li><Link href="#curriculum" className="hover:text-white transition-colors">CUF Monitoring</Link></li>
                <li><Link href="#curriculum" className="hover:text-white transition-colors">ACDBE Airport Rules</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">For Agencies</p>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Agency Coordinator Portal</Link></li>
                <li><Link href="#procurement" className="hover:text-white transition-colors">PO-Based Invoicing</Link></li>
                <li><Link href="#procurement" className="hover:text-white transition-colors">Seat Pool Management</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Bulk CSV Onboarding</Link></li>
                <li><Link href="#verify" className="hover:text-white transition-colors">Certificate Verification</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Access & Support</p>
              <ul className="space-y-2 text-xs text-white/60">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Learner Sign In</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Super Admin Access</Link></li>
                <li><Link href="/auth/forgot-password" className="hover:text-white transition-colors">Password Reset</Link></li>
                <li><Link href="/auth/invitation" className="hover:text-white transition-colors">Accept Invitation</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 Certification Professionals Mastery Institute (CPMI). All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/accessibility" className="hover:text-white transition-colors">Section 508 Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
