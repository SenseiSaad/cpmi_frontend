"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PICTURE_INPUT_ACCEPT, preparePicture } from "@/lib/api/pictures";

interface PictureEditorProps {
  /** The current picture (an Avatar or AgencyMark) so the person sees exactly what others will see. */
  preview: ReactNode;
  title: string;
  hint: string;
  hasPicture: boolean;
  onUpload: (picture: Blob) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  /** Plain-English reason the user cannot change it, if any. */
  disabledReason?: string;
}

/** Choose a file, shrink it in the browser, upload it; or remove the current one. */
export function PictureEditor({ preview, title, hint, hasPicture, onUpload, onRemove, disabledReason }: PictureEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy("upload");
    try {
      await onUpload(await preparePicture(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The picture could not be saved. Please try again.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    setBusy("remove");
    try {
      await onRemove();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The picture could not be removed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {preview}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink-900">{title}</p>
        <p className="text-xs text-ink-600">{hint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input ref={input} type="file" accept={PICTURE_INPUT_ACCEPT} className="sr-only" aria-label={title} onChange={(e) => void choose(e.target.files?.[0])} />
          <Button size="sm" variant="secondary" icon={<Camera className="size-4" aria-hidden />} loading={busy === "upload"} disabled={!!disabledReason || busy !== null} onClick={() => input.current?.click()}>
            {hasPicture ? "Change picture" : "Upload picture"}
          </Button>
          {hasPicture ? (
            <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" aria-hidden />} loading={busy === "remove"} disabled={!!disabledReason || busy !== null} onClick={() => void remove()}>
              Remove
            </Button>
          ) : null}
        </div>
        {disabledReason ? <p className="mt-2 text-xs text-ink-600">{disabledReason}</p> : null}
        {error ? <p role="alert" className="mt-2 rounded-lg bg-bad-bg px-3 py-2 text-xs text-bad">{error}</p> : null}
      </div>
    </div>
  );
}
