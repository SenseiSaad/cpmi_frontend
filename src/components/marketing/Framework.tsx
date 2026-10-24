const ITEMS = [
  { code: "49 CFR Part 26", name: "DBE program", note: "Highway and transit" },
  { code: "49 CFR Part 23", name: "ACDBE program", note: "Airport concessions" },
  { code: "FHWA", name: "Federal Highway Administration", note: "Oversight" },
  { code: "FTA", name: "Federal Transit Administration", note: "Oversight" },
  { code: "FAA", name: "Federal Aviation Administration", note: "Oversight" },
];

/** A factual strip in place of a client-logo wall: the rules and oversight bodies the curriculum is built around. */
export default function Framework() {
  return (
    <section aria-labelledby="framework-title" className="border-b border-line bg-white">
      <div className="wrap py-10">
        <h2 id="framework-title" className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
          The regulatory framework this course covers
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-line">
          {ITEMS.map((item) => (
            <li key={item.code} className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <p className="font-serif text-[1.25rem] font-medium leading-tight text-primary-900">{item.code}</p>
              <p className="mt-1 text-sm text-ink-500">{item.name}</p>
              <p className="text-sm text-ink-400">{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
