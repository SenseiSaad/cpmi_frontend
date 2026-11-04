"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Highlighter,
  ImageIcon,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Table2,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LESSON_PROSE } from "@/lib/lesson-prose";
import { cn } from "@/lib/utils";

export { LESSON_PROSE };

const exec = (command: string, value?: string) => document.execCommand(command, false, value);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TEXT_COLOURS = [
  { cls: "cb-c-red", label: "Red", swatch: "bg-bad" },
  { cls: "cb-c-orange", label: "Orange", swatch: "bg-brand-700" },
  { cls: "cb-c-green", label: "Green", swatch: "bg-ok" },
  { cls: "cb-c-blue", label: "Blue", swatch: "bg-info" },
  { cls: "cb-c-gray", label: "Grey", swatch: "bg-ink-500" },
];
const HIGHLIGHTS = [
  { cls: "cb-hl-yellow", label: "Yellow", swatch: "bg-yellow-200" },
  { cls: "cb-hl-green", label: "Green", swatch: "bg-green-200" },
  { cls: "cb-hl-blue", label: "Blue", swatch: "bg-blue-200" },
];
const CALLOUTS = [
  { cls: "cb-info", label: "Information", hint: "Background a learner should know", dot: "bg-info" },
  { cls: "cb-tip", label: "Tip", hint: "A helpful suggestion", dot: "bg-ok" },
  { cls: "cb-warn", label: "Warning", hint: "Something to be careful about", dot: "bg-warn" },
  { cls: "cb-key", label: "Key point", hint: "The thing to remember", dot: "bg-brand-700" },
];
const BLOCK_CLASSES = ["cb-center", "cb-right", "cb-lead"];

function Btn({ label, onClick, children, wide }: { label: string; onClick: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // mouseDown (not click) so the editor keeps its text selection while a button is pressed.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn("grid h-9 place-items-center rounded-lg px-2 text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-800", wide ? "min-w-9 text-xs font-bold" : "w-9")}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden />;

/** A button that opens a small panel under it. */
function Pop({ label, icon, open, setOpen, children }: { label: string; icon: React.ReactNode; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Btn label={label} onClick={() => setOpen(!open)}>{icon}</Btn>
      {open ? (
        <div className="absolute left-0 top-10 z-20 min-w-[13rem] rounded-xl bg-white p-2 shadow-lift ring-1 ring-line" onMouseDown={(e) => e.preventDefault()}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

type Panel = null | "color" | "highlight" | "callout" | "link" | "image";

/**
 * Rich-text editor with no dependency. The server sanitises whatever is saved (only the fixed `cb-*` classes
 * survive), so this only has to be pleasant: styles, colours, callouts, alignment, links, images and tables.
 */
export function RichText({ value, onChange, placeholder, minHeight = 260 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [href, setHref] = useState("https://");
  const [imgUrl, setImgUrl] = useState("https://");
  const [imgAlt, setImgAlt] = useState("");
  const [empty, setEmpty] = useState(!value);
  const [stats, setStats] = useState({ words: 0 });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value;
      recount();
    }
    // Load once per mounted editor (the parent re-keys it per lesson); typing never resets the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  function recount() {
    const text = (ref.current?.textContent ?? "").trim();
    setStats({ words: text ? text.split(/\s+/).length : 0 });
  }

  function emit() {
    const html = ref.current?.innerHTML ?? "";
    const text = (ref.current?.textContent ?? "").trim();
    const hasMedia = /<(img|table|hr)/i.test(html);
    setEmpty(!text && !hasMedia);
    recount();
    onChange(text || hasMedia ? html : "");
  }

  const rangeInEditor = (): Range | null => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0);
    return ref.current?.contains(r.commonAncestorContainer) ? r : null;
  };
  const remember = () => { const r = rangeInEditor(); saved.current = r ? r.cloneRange() : null; };
  const restore = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && saved.current) { sel.removeAllRanges(); sel.addRange(saved.current); }
  };
  const run = (fn: () => void) => { ref.current?.focus(); fn(); emit(); };

  function styleSelection(cls: string | null, family: "cb-c-" | "cb-hl-") {
    const r = rangeInEditor();
    if (!r || r.collapsed) { setNotice("Select some text first."); return; }
    const frag = r.extractContents();
    frag.querySelectorAll(`span[class*="${family}"]`).forEach((s) => s.replaceWith(...Array.from(s.childNodes)));
    let node: Node = frag;
    if (cls) {
      const span = document.createElement("span");
      span.className = cls;
      span.appendChild(frag);
      node = span;
    }
    r.insertNode(node);
    window.getSelection()?.removeAllRanges();
    emit();
  }

  function currentBlock(): HTMLElement | null {
    const r = rangeInEditor();
    let n: Node | null = r ? r.startContainer : null;
    while (n && n !== ref.current) {
      if (n instanceof HTMLElement && /^(P|H2|H3|LI|BLOCKQUOTE|DIV)$/.test(n.tagName) && n.parentElement) return n;
      n = n.parentNode;
    }
    return null;
  }
  function setBlockClass(cls: string | null) {
    ref.current?.focus();
    if (!currentBlock()) exec("formatBlock", "p");
    const b = currentBlock();
    if (!b) return;
    BLOCK_CLASSES.forEach((c) => b.classList.remove(c));
    if (cls) b.classList.add(cls);
    emit();
  }

  function insertCallout(cls: string) {
    restore();
    const selected = window.getSelection()?.toString().trim();
    exec("insertHTML", `<div class="cb-callout ${cls}"><p>${selected ? esc(selected) : "Type your note here"}</p></div><p><br></p>`);
    setPanel(null);
    emit();
  }
  function applyLink() {
    const url = href.trim();
    restore();
    if (/^(https?:\/\/|mailto:)\S{3,}/i.test(url)) {
      if (window.getSelection()?.isCollapsed) exec("insertHTML", `<a href="${esc(url)}">${esc(url)}</a>`);
      else exec("createLink", url);
    } else setNotice("Links must start with https:// or mailto:");
    setPanel(null);
    emit();
  }
  function applyImage() {
    const url = imgUrl.trim();
    restore();
    if (/^https:\/\/\S{4,}/i.test(url)) exec("insertHTML", `<img src="${esc(url)}" alt="${esc(imgAlt.trim())}">`);
    else setNotice("Pictures need an https:// address.");
    setPanel(null);
    emit();
  }
  function insertTable() {
    const cell = (tag: string) => `<${tag}>${tag === "th" ? "Heading" : "Text"}</${tag}>`;
    const row = (tag: string) => `<tr>${cell(tag)}${cell(tag)}${cell(tag)}</tr>`;
    run(() => exec("insertHTML", `<table><thead>${row("th")}</thead><tbody>${row("td")}${row("td")}</tbody></table><p><br></p>`));
  }

  const open = (p: Panel) => { remember(); setPanel(panel === p ? null : p); };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-700">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-line bg-canvas-soft/90 px-2 py-1.5 backdrop-blur" role="toolbar" aria-label="Text formatting">
        <Btn label="Undo" onClick={() => run(() => exec("undo"))}><Undo2 className="size-4" aria-hidden /></Btn>
        <Btn label="Redo" onClick={() => run(() => exec("redo"))}><Redo2 className="size-4" aria-hidden /></Btn>
        <Sep />
        <Btn label="Big heading" wide onClick={() => run(() => exec("formatBlock", "h2"))}>H1</Btn>
        <Btn label="Sub-heading" wide onClick={() => run(() => exec("formatBlock", "h3"))}>H2</Btn>
        <Btn label="Normal text" wide onClick={() => { run(() => exec("formatBlock", "p")); setBlockClass(null); }}>Aa</Btn>
        <Btn label="Large intro text" wide onClick={() => setBlockClass("cb-lead")}>Lead</Btn>
        <Sep />
        <Btn label="Bold (Ctrl+B)" onClick={() => run(() => exec("bold"))}><Bold className="size-4" aria-hidden /></Btn>
        <Btn label="Italic (Ctrl+I)" onClick={() => run(() => exec("italic"))}><Italic className="size-4" aria-hidden /></Btn>
        <Btn label="Underline (Ctrl+U)" onClick={() => run(() => exec("underline"))}><Underline className="size-4" aria-hidden /></Btn>
        <Pop label="Text colour" icon={<Palette className="size-4" aria-hidden />} open={panel === "color"} setOpen={() => open("color")}>
          <p className="px-1 pb-1 text-xs font-semibold text-ink-600">Text colour (select text first)</p>
          <div className="flex flex-wrap gap-1.5 p-1">
            {TEXT_COLOURS.map((c) => (
              <button key={c.cls} type="button" aria-label={c.label} title={c.label} onMouseDown={(e) => { e.preventDefault(); restore(); styleSelection(c.cls, "cb-c-"); setPanel(null); }} className={cn("size-7 rounded-full ring-2 ring-white hover:scale-110", c.swatch)} />
            ))}
            <button type="button" onMouseDown={(e) => { e.preventDefault(); restore(); styleSelection(null, "cb-c-"); setPanel(null); }} className="rounded-lg px-2 text-xs font-semibold text-ink-700 ring-1 ring-line hover:bg-canvas-soft">None</button>
          </div>
        </Pop>
        <Pop label="Highlight" icon={<Highlighter className="size-4" aria-hidden />} open={panel === "highlight"} setOpen={() => open("highlight")}>
          <p className="px-1 pb-1 text-xs font-semibold text-ink-600">Highlight (select text first)</p>
          <div className="flex flex-wrap gap-1.5 p-1">
            {HIGHLIGHTS.map((c) => (
              <button key={c.cls} type="button" aria-label={c.label} title={c.label} onMouseDown={(e) => { e.preventDefault(); restore(); styleSelection(c.cls, "cb-hl-"); setPanel(null); }} className={cn("size-7 rounded-md ring-2 ring-white hover:scale-110", c.swatch)} />
            ))}
            <button type="button" onMouseDown={(e) => { e.preventDefault(); restore(); styleSelection(null, "cb-hl-"); setPanel(null); }} className="rounded-lg px-2 text-xs font-semibold text-ink-700 ring-1 ring-line hover:bg-canvas-soft">None</button>
          </div>
        </Pop>
        <Sep />
        <Btn label="Bulleted list" onClick={() => run(() => exec("insertUnorderedList"))}><List className="size-4" aria-hidden /></Btn>
        <Btn label="Numbered list" onClick={() => run(() => exec("insertOrderedList"))}><ListOrdered className="size-4" aria-hidden /></Btn>
        <Btn label="Align left" onClick={() => setBlockClass(null)}><AlignLeft className="size-4" aria-hidden /></Btn>
        <Btn label="Centre" onClick={() => setBlockClass("cb-center")}><AlignCenter className="size-4" aria-hidden /></Btn>
        <Btn label="Align right" onClick={() => setBlockClass("cb-right")}><AlignRight className="size-4" aria-hidden /></Btn>
        <Sep />
        <Pop label="Highlighted box (callout)" icon={<Info className="size-4" aria-hidden />} open={panel === "callout"} setOpen={() => open("callout")}>
          <p className="px-1 pb-1 text-xs font-semibold text-ink-600">Add a highlighted box</p>
          {CALLOUTS.map((c) => (
            <button key={c.cls} type="button" onMouseDown={(e) => { e.preventDefault(); insertCallout(c.cls); }} className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-canvas-soft">
              <span className={cn("mt-1 size-3 shrink-0 rounded-full", c.dot)} />
              <span><span className="block text-sm font-semibold text-ink-900">{c.label}</span><span className="block text-xs text-ink-600">{c.hint}</span></span>
            </button>
          ))}
        </Pop>
        <Btn label="Quote" onClick={() => run(() => exec("formatBlock", "blockquote"))}><Quote className="size-4" aria-hidden /></Btn>
        <Btn label="Divider line" onClick={() => run(() => exec("insertHorizontalRule"))}><Minus className="size-4" aria-hidden /></Btn>
        <Btn label="Table" onClick={insertTable}><Table2 className="size-4" aria-hidden /></Btn>
        <Pop label="Picture" icon={<ImageIcon className="size-4" aria-hidden />} open={panel === "image"} setOpen={() => open("image")}>
          <form className="w-64 space-y-2 p-1" onSubmit={(e) => { e.preventDefault(); applyImage(); }}>
            <label className="block text-xs font-semibold text-ink-700">Picture address (https://)
              <input autoFocus value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="mt-1 h-9 w-full rounded-lg px-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-700" />
            </label>
            <label className="block text-xs font-semibold text-ink-700">Describe it (for screen readers)
              <input value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} className="mt-1 h-9 w-full rounded-lg px-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-700" />
            </label>
            <button type="submit" className="h-9 w-full rounded-lg bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">Add picture</button>
          </form>
        </Pop>
        <Pop label="Link" icon={<Link2 className="size-4" aria-hidden />} open={panel === "link"} setOpen={() => open("link")}>
          <form className="w-64 space-y-2 p-1" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
            <label className="block text-xs font-semibold text-ink-700">Link address
              <input autoFocus value={href} onChange={(e) => setHref(e.target.value)} className="mt-1 h-9 w-full rounded-lg px-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-700" />
            </label>
            <p className="text-xs text-ink-600">Select some text first to turn it into the link.</p>
            <button type="submit" className="h-9 w-full rounded-lg bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">Add link</button>
          </form>
        </Pop>
        <Btn label="Clear formatting" onClick={() => run(() => { exec("removeFormat"); setBlockClass(null); })}><Eraser className="size-4" aria-hidden /></Btn>
      </div>

      {notice ? (
        <p role="status" className="flex items-center justify-between gap-2 border-b border-line bg-warn-bg px-3 py-1.5 text-xs font-semibold text-warn">
          {notice}
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}><X className="size-3.5" aria-hidden /></button>
        </p>
      ) : null}

      <div className="relative">
        {empty && placeholder ? <p className="pointer-events-none absolute left-4 top-4 text-sm text-ink-500">{placeholder}</p> : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Lesson content"
          onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
          onInput={emit}
          onBlur={emit}
          onPaste={(e) => {
            // Pasting from Word/web brings styles we would only strip later; paste as plain text instead.
            e.preventDefault();
            exec("insertText", e.clipboardData.getData("text/plain"));
          }}
          style={{ minHeight }}
          className={cn("max-w-none px-5 py-4 focus:outline-none", LESSON_PROSE)}
        />
      </div>
      <div className="flex items-center justify-between rounded-b-2xl border-t border-line bg-canvas-soft/60 px-4 py-1.5 text-xs text-ink-600">
        <span>{stats.words} words · about {Math.max(1, Math.round(stats.words / 200))} min to read</span>
        <span>Pasted text keeps no outside formatting</span>
      </div>
    </div>
  );
}
