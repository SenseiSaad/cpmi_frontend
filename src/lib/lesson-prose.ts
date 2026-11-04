/**
 * How lesson HTML looks. Used by the studio editor, the studio preview and the learner page, so what the
 * author sees while writing is what learners get. The `cb-*` class names are the ONLY styling a lesson can
 * carry (the server strips every other class and all inline styles), see LESSON_CLASSES in the backend.
 */
export const LESSON_PROSE = [
  "space-y-3 text-[15px] leading-relaxed text-ink-700",
  "[&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-2",
  "[&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-line [&_h2]:pb-1.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink-900",
  "[&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink-900",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-brand-200 [&_blockquote]:bg-canvas-soft [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:pr-3 [&_blockquote]:italic",
  "[&_hr]:my-6 [&_hr]:border-line",
  "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-canvas-soft [&_th]:p-2 [&_th]:text-left",
  "[&_.cb-callout]:my-4 [&_.cb-callout]:rounded-xl [&_.cb-callout]:border-l-4 [&_.cb-callout]:p-4",
  "[&_.cb-info]:border-info [&_.cb-info]:bg-info-bg",
  "[&_.cb-tip]:border-ok [&_.cb-tip]:bg-ok-bg",
  "[&_.cb-warn]:border-warn [&_.cb-warn]:bg-warn-bg",
  "[&_.cb-key]:border-brand-700 [&_.cb-key]:bg-brand-50",
  "[&_.cb-lead]:text-lg [&_.cb-lead]:font-medium [&_.cb-lead]:text-ink-900",
  "[&_.cb-center]:text-center [&_.cb-right]:text-right",
  "[&_.cb-c-red]:font-semibold [&_.cb-c-red]:text-bad [&_.cb-c-green]:font-semibold [&_.cb-c-green]:text-ok [&_.cb-c-blue]:font-semibold [&_.cb-c-blue]:text-info [&_.cb-c-orange]:font-semibold [&_.cb-c-orange]:text-brand-700 [&_.cb-c-gray]:text-ink-500",
  "[&_.cb-hl-yellow]:rounded [&_.cb-hl-yellow]:bg-yellow-200/70 [&_.cb-hl-yellow]:px-1 [&_.cb-hl-green]:rounded [&_.cb-hl-green]:bg-green-200/70 [&_.cb-hl-green]:px-1 [&_.cb-hl-blue]:rounded [&_.cb-hl-blue]:bg-blue-200/70 [&_.cb-hl-blue]:px-1",
].join(" ");

/** The embeddable Vimeo player address for a numeric video id. */
export const vimeoEmbedUrl = (id: string): string => `https://player.vimeo.com/video/${encodeURIComponent(id)}?dnt=1`;
