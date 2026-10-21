"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The backend has no list endpoints for modules, assessments or questions — authoring calls
 * return ids that the author must keep. This keeps those ids per course in localStorage so a
 * reload does not lose the module / assessment handles created in this browser.
 */

export interface WorkspaceModule {
  publicId: string;
  code: string;
}

export interface WorkspaceQuestion {
  questionVersionId: string;
  code: string;
  type: string;
  prompt: string;
  published: boolean;
  attached: boolean;
}

export interface WorkspaceAssessmentVersion {
  id: string;
  versionNo: number;
  title: string;
  questionCount: number;
  published: boolean;
  questions: WorkspaceQuestion[];
}

export interface WorkspaceAssessment {
  publicId: string;
  code: string;
  assessmentType: "module" | "final";
  /** Module public id for module assessments. */
  modulePublicId?: string;
  versions: WorkspaceAssessmentVersion[];
}

export interface Workspace {
  modules: WorkspaceModule[];
  assessments: WorkspaceAssessment[];
}

const EMPTY: Workspace = { modules: [], assessments: [] };

function key(coursePublicId: string) {
  return `cpmi.authoring.${coursePublicId}`;
}

function load(coursePublicId: string): Workspace {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(key(coursePublicId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    return { modules: parsed.modules ?? [], assessments: parsed.assessments ?? [] };
  } catch {
    return EMPTY;
  }
}

export function useWorkspace(coursePublicId: string) {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY);

  useEffect(() => {
    setWorkspace(load(coursePublicId));
  }, [coursePublicId]);

  const update = useCallback(
    (fn: (current: Workspace) => Workspace) => {
      setWorkspace((current) => {
        const next = fn(current);
        try {
          window.localStorage.setItem(key(coursePublicId), JSON.stringify(next));
        } catch {
          /* storage full or disabled: keep in memory only */
        }
        return next;
      });
    },
    [coursePublicId]
  );

  return { workspace, update };
}
