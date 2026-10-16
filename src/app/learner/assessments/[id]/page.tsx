"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { sampleQuizQuestions, QuizQuestion } from "@/lib/data";

export default function AssessmentRunnerPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [currentQIndex, setCurrentQIndex] = useState(2); // Question 3 (index 2) by default as shown in Screen 5!
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({
    1: "B",
    2: "B",
    3: "B", // Option B selected by default matching Screen 5!
  });
  const [secondsRemaining, setSecondsRemaining] = useState(1112); // 18m 32s (1112 seconds) matching Screen 5!
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Live countdown timer
  useEffect(() => {
    if (isSubmitted || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, secondsRemaining]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = sampleQuizQuestions[currentQIndex] || sampleQuizQuestions[0];
  const totalQuestions = 10; // 10 questions as shown in Screen 5
  const progressPercent = Math.round(((currentQIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQIndex < sampleQuizQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // Calculate score & submit
      setIsSubmitted(true);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  // Score calculation
  let correctCount = 0;
  sampleQuizQuestions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctOption) {
      correctCount += 1;
    }
  });
  const finalScore = Math.round((correctCount / sampleQuizQuestions.length) * 100);
  const isPassed = finalScore >= 80;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-gray-900 selection:bg-secondary-500 selection:text-primary-950">
      {/* HEADER BAR (Screen 5 Reference) */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/learner/assessments" className="focus:outline-none">
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-xs sm:text-sm font-black text-gray-900">
            Module 4 Assessment
          </h1>
        </div>

        {/* Live Timer Countdown (Screen 5 Reference: 00:18:32) */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-2xs">
          <Clock size={15} className="animate-pulse" />
          <span>{formatTimer(secondsRemaining)}</span>
        </div>
      </header>

      {/* QUIZ WORKSPACE */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {!isSubmitted ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10">
            {/* Question Progress Header (Question 3 of 10 Reference) */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
              <span className="text-primary-900 text-sm">
                Question {currentQIndex + 1} of {totalQuestions}
              </span>
              <span>{progressPercent}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-8">
              <div
                className="bg-highlight-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
                {currentQuestion.question}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Select the single best answer under 49 CFR Part 26 regulations.
              </p>
            </div>

            {/* Options List (Radio options matching Screen 5) */}
            <div className="space-y-3.5 mb-10">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center gap-4 focus:outline-none ${
                      isSelected
                        ? "bg-emerald-50/70 border-highlight-500 text-primary-950 shadow-xs ring-1 ring-highlight-500"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-800"
                    }`}
                  >
                    {/* Custom Radio Button */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                        isSelected
                          ? "bg-highlight-500 text-white shadow-xs"
                          : "border border-gray-300 text-gray-500 bg-white"
                      }`}
                    >
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : option.label}
                    </div>

                    <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Question Navigation (Screen 5 Reference) */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="px-5 py-2.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              <button
                onClick={handleNext}
                className="px-7 py-2.5 bg-[#152A13] hover:bg-primary-800 text-white rounded-xl text-xs font-black transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span>
                  {currentQIndex === sampleQuizQuestions.length - 1
                    ? "Submit Assessment"
                    : "Next"}
                </span>
                <ChevronRight size={15} className="text-secondary-400" />
              </button>
            </div>
          </div>
        ) : (
          /* RESULT MODAL UPON COMPLETION */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 text-center"
          >
            <div
              className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-5 ${
                isPassed
                  ? "bg-emerald-50 text-highlight-600 border border-highlight-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {isPassed ? <Award size={36} /> : <AlertTriangle size={36} />}
            </div>

            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isPassed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isPassed ? "Assessment Passed" : "Retake Required"}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3">
              {isPassed ? "Congratulations, Sarah!" : "Passing Threshold Not Met"}
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto">
              {isPassed
                ? "You have satisfied all statutory comprehension requirements for Module 4: DBE Program Requirements."
                : "A minimum score of 80% is required for compliance certification. Review the curriculum lessons and attempt again."}
            </p>

            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 max-w-xs mx-auto">
              <p className="text-xs text-gray-400 font-bold uppercase">Your Score</p>
              <p className="text-4xl font-black text-primary-900 mt-1">{finalScore}%</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Passing Score: 80%</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-100">
              {isPassed ? (
                <>
                  <Link
                    href="/learner/certificates"
                    className="bg-[#152A13] hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Award size={15} className="text-secondary-400" />
                    <span>View Official Certificate</span>
                  </Link>
                  <Link
                    href="/learner/courses"
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-5 py-3 rounded-xl text-xs transition-colors"
                  >
                    Return to My Courses
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setCurrentQIndex(0);
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-3 rounded-xl text-xs transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Retake Assessment
                  </button>
                  <Link
                    href="/learner/courses/4"
                    className="border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-5 py-3 rounded-xl text-xs transition-colors"
                  >
                    Review Module Lessons
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* FOOTER AUDIT NOTE */}
      <footer className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-200 bg-white">
        CPMI Assessment Engine • Version 2026.4 • Session ID: #sess_88291f • Immutable Audit Trail Active
      </footer>
    </div>
  );
}
