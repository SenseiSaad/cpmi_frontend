"use client";

import { useState } from "react";
import { BookOpen, Edit, Plus, Video, FileText, CheckCircle, Search, HelpCircle } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { AdminSidebar } from "@/components/layout/SidebarNav";
import { modules as initialModules, ModuleData } from "@/lib/data";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<ModuleData[]>(initialModules);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);

  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      headerContent={
        <div>
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
            Curriculum & Content Authoring
          </h1>
          <p className="text-xs text-gray-500">
            Author text, update video lectures (Vimeo OTT), and configure module questions
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">11 Official Certification Modules</span>
            <span className="text-[10px] bg-secondary-100 text-secondary-800 font-bold px-2 py-0.5 rounded-full">
              Rolling Content Loading (Milestone 2)
            </span>
          </div>
          <button
            onClick={() => alert("New Module Authoring Modal")}
            className="inline-flex items-center gap-1.5 bg-[#152A13] hover:bg-primary-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Plus size={14} className="text-secondary-400" />
            <span>Add Module</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-lg">
                    {m.code}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {m.duration}
                  </span>
                </div>
                <h3 className="text-sm font-black text-gray-900 line-clamp-1 mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{m.shortDesc}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Video size={13} className="text-primary-700" /> {m.lessonsCount} Lessons
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HelpCircle size={13} className="text-secondary-600" /> Question Bank Active
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400">{m.regulatoryRef}</span>
                <button
                  onClick={() => alert(`Opening authoring UI for ${m.code}: ${m.title}`)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Edit size={12} /> Edit Content
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
