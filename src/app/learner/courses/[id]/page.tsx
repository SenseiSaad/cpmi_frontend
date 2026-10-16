"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  FileText,
  Download,
  BookOpen,
  Edit3,
  Check,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { modules, Lesson } from "@/lib/data";

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = Number(params.id) || 4;
  const currentModule = modules.find((m) => m.id === moduleId) || modules[3];

  const defaultLesson =
    currentModule.lessons && currentModule.lessons.length > 1
      ? currentModule.lessons[1] // Lesson 4.2 by default as shown in Screen 4!
      : currentModule.lessons?.[0] || {
          id: "m4-l2",
          lessonNumber: "4.2",
          title: "DBE Program Requirements",
          duration: "20 min",
          completed: true,
          type: "video" as const,
          summary: "The DBE program ensures that federally funded transportation projects include eligible, small and disadvantaged businesses.",
          content:
            "The DBE program ensures that federally funded transportation projects include eligible, small and disadvantaged businesses. This program helps create a level playing field for all qualified businesses across infrastructure and procurement.",
        };

  const [activeLesson, setActiveLesson] = useState<Lesson>(defaultLesson);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(18.8); // 04:43 of 25:00
  const [learnerNotes, setLearnerNotes] = useState(
    "Key Takeaway: DBE programs under 49 CFR Part 26 require triennial goal submissions to the relevant operating administration (FHWA, FTA, or FAA). Commercially Useful Function (CUF) reviews must be verified by field inspections."
  );
  const [notesSaved, setNotesSaved] = useState(false);

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const currentLessonIndex =
    currentModule.lessons?.findIndex((l) => l.id === activeLesson.id) ?? 1;

  const handleNextLesson = () => {
    if (
      currentModule.lessons &&
      currentLessonIndex < currentModule.lessons.length - 1
    ) {
      setActiveLesson(currentModule.lessons[currentLessonIndex + 1]);
      setVideoProgress(0);
      setIsPlaying(true);
    } else {
      // Route to assessment
      router.push(`/learner/assessments/m${moduleId}-quiz`);
    }
  };

  const handlePrevLesson = () => {
    if (currentModule.lessons && currentLessonIndex > 0) {
      setActiveLesson(currentModule.lessons[currentLessonIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row text-gray-900 selection:bg-secondary-500 selection:text-primary-950">
      {/* LEFT SIDEBAR: Modules & Lessons Navigation (Screen 4 Direct Reference) */}
      <aside className="w-full lg:w-72 bg-[#152A13] text-white flex flex-col flex-shrink-0 border-r border-[#1e3b1c]">
        {/* Top Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/learner">
            <Logo variant="light" size="sm" />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400 bg-white/5 px-2 py-0.5 rounded">
            LMS Player
          </span>
        </div>

        {/* Module Selector Dropdown */}
        <div className="p-4 border-b border-white/10">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
            Current Module
          </label>
          <div className="relative">
            <select
              value={currentModule.id}
              onChange={(e) => router.push(`/learner/courses/${e.target.value}`)}
              className="w-full bg-[#1b3519] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-secondary-500 appearance-none pr-8 cursor-pointer"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#152A13] text-white">
                  {m.code}: {m.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>
        </div>

        {/* Lessons List (Matching Screen 4) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-3 py-1">
            Module Lessons
          </p>

          {currentModule.lessons && currentModule.lessons.length > 0 ? (
            currentModule.lessons.map((lesson, idx) => {
              const isActive = lesson.id === activeLesson.id;
              const isPast = idx < currentLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center justify-between focus:outline-none ${
                    isActive
                      ? "bg-highlight-500/20 text-white border border-highlight-500/50 shadow-sm font-bold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isPast
                          ? "bg-highlight-500 text-primary-950"
                          : isActive
                          ? "bg-highlight-500 text-primary-950"
                          : "border border-white/20 text-white/60"
                      }`}
                    >
                      {isPast ? <Check size={11} /> : lesson.lessonNumber.split(".")[1]}
                    </div>
                    <span className="truncate">{lesson.lessonNumber} {lesson.title}</span>
                  </div>
                  <span className="text-[10px] text-white/50 ml-2 whitespace-nowrap">
                    {lesson.duration}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-xs text-white/50 text-center">
              No lessons loaded for this module preview.
            </div>
          )}
        </div>

        {/* Bottom Accreditation Heartbeat Indicator */}
        <div className="p-4 border-t border-white/10 text-[10px] text-white/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-highlight-500 animate-pulse" />
          <span>Server-side position verified for audit</span>
        </div>
      </aside>

      {/* MAIN PLAYER CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar (Screen 4 Reference) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/learner/courses"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} /> Back to My Courses
            </Link>
            <div className="hidden sm:block">
              <h2 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                {currentModule.title}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Lesson {currentLessonIndex + 1} of {currentModule.lessonsCount} • {activeLesson.duration}
              </p>
            </div>
          </div>

          {/* Progress Bar (60% Complete Reference) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-primary-700 whitespace-nowrap">
              {currentModule.progress}% Complete
            </span>
            <div className="w-32 sm:w-44 bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-highlight-500 h-full rounded-full transition-all"
                style={{ width: `${currentModule.progress}%` }}
              />
            </div>
          </div>
        </header>

        {/* Player Workspace: Video Player + Right Lesson Resources */}
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* VIDEO PLAYER COMPONENT (Screen 4 Reference) */}
            <div className="lg:col-span-8 bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-800 flex flex-col">
              {/* Video Screen Area */}
              <div className="relative aspect-video w-full bg-gray-950 flex items-center justify-center group overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&q=80')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                {/* Big Center Play/Pause Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="relative z-10 w-16 h-16 rounded-full bg-secondary-500/90 hover:bg-secondary-400 text-primary-950 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 focus:outline-none"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                </button>

                {/* Video Title Overlay */}
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-bold flex items-center gap-2">
                  <Shield size={13} className="text-secondary-400" />
                  <span>{activeLesson.lessonNumber} {activeLesson.title}</span>
                </div>
              </div>

              {/* Custom Player Controls Bar (Screen 4 Reference) */}
              <div className="bg-[#121c11] px-5 py-3.5 text-white flex flex-col gap-2 border-t border-white/10">
                {/* Timeline Scrubber */}
                <div className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden group">
                  <div
                    className="h-full bg-highlight-500 rounded-full"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-medium pt-1">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-secondary-400 transition-colors focus:outline-none"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-secondary-400 transition-colors focus:outline-none"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <span className="text-[11px] text-white/70 font-mono">
                      04:43 / 25:00
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-white/10 text-secondary-400 px-2 py-0.5 rounded font-bold">
                      1080p HD
                    </span>
                    <button className="hover:text-secondary-400 transition-colors focus:outline-none">
                      <Maximize size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LESSON RESOURCES PANEL (Screen 4 Right Column Reference) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-200/90 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-secondary-600" />
                  Lesson Resources
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Official regulatory references and practice guidelines for this module.
                </p>

                <div className="space-y-2.5">
                  {[
                    {
                      name: "Download PDF: 49 CFR Part 26 Guide",
                      size: "2.4 MB • PDF",
                      action: "Download PDF",
                    },
                    {
                      name: "Additional Reading: USDOT Goal Directives",
                      size: "Official Guidance",
                      action: "Read Online",
                    },
                    {
                      name: "Triennial Goal Worksheet Template",
                      size: "840 KB • XLSX",
                      action: "Download Sheet",
                    },
                  ].map((res) => (
                    <div
                      key={res.name}
                      className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-gray-900 truncate">{res.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{res.size}</p>
                      </div>
                      <button
                        onClick={() => alert(`Downloading resource: ${res.name}`)}
                        className="p-2 text-primary-700 hover:text-primary-900 hover:bg-white rounded-lg transition-colors focus:outline-none flex-shrink-0"
                        title={res.action}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Notes Scratchpad */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Edit3 size={13} className="text-secondary-600" /> Module Notes
                  </h4>
                  {notesSaved && (
                    <span className="text-[10px] font-bold text-highlight-600 flex items-center gap-1">
                      <Check size={11} /> Saved
                    </span>
                  )}
                </div>
                <textarea
                  value={learnerNotes}
                  onChange={(e) => setLearnerNotes(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Record key takeaways for your upcoming assessment..."
                />
                <button
                  onClick={handleSaveNotes}
                  className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1.5 rounded-lg text-xs transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>

          {/* LESSON SUMMARY & STEP NAVIGATION (Screen 4 Bottom Reference) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-600 bg-secondary-50 px-2.5 py-1 rounded-md border border-secondary-200">
                  {currentModule.regulatoryRef}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  {activeLesson.lessonNumber} {activeLesson.title}
                </h3>
              </div>

              {/* Prev / Next Gating Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevLesson}
                  disabled={currentLessonIndex === 0}
                  className="px-4 py-2.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  onClick={handleNextLesson}
                  className="px-6 py-2.5 bg-[#152A13] hover:bg-primary-800 text-white rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <span>
                    {currentLessonIndex === (currentModule.lessons?.length || 1) - 1
                      ? "Start Assessment"
                      : "Next Lesson"}
                  </span>
                  <ChevronRight size={15} className="text-secondary-400" />
                </button>
              </div>
            </div>

            {/* Comprehensive Lesson Body Text */}
            <div className="pt-6 max-w-4xl space-y-4 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-900 text-base">
                {activeLesson.summary}
              </p>
              <p>
                {activeLesson.content}
              </p>
              <p>
                Recipients of USDOT financial assistance must ensure that contractors do not discriminate in the award and administration of federally-assisted contracts. The regulations establish clear procedures for determining whether an applicant meets the social and economic disadvantage tests, small business size standards, and personal net worth limits.
              </p>

              <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-2xl text-xs text-primary-950 font-medium">
                <p className="font-bold text-primary-900 mb-1">Key Statutory Compliance Rule:</p>
                <p>
                  Recipients must establish overall goals for the participation of DBEs every three years. The goal calculation requires a two-step process: (1) calculating a relative availability base figure, and (2) making an adjustment based on demonstrative empirical evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
