import { cn, initials } from "@/lib/utils";

const GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-blue-500",
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const SIZES = { xs: "size-7 text-[10px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-xl", xl: "size-24 text-3xl" } as const;

interface AvatarProps {
  first: string;
  last: string;
  size?: keyof typeof SIZES;
  online?: boolean;
  className?: string;
}

export function Avatar({ first, last, size = "md", online, className }: AvatarProps) {
  const gradient = GRADIENTS[hash(`${first}${last}`) % GRADIENTS.length];
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm", gradient, SIZES[size], className)} aria-hidden>
      {initials(first, last)}
      {online ? <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-sky-500" /> : null}
    </span>
  );
}
