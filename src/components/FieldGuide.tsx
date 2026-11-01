/**
 * How people of the desert actually find truffles, drawn as a cross-section of the ground.
 * Sign 1 (Wasm rain) is what the model scores; the rest is what you look for on the trip.
 */
const SIGNS = [
  { title: "بعد مطر الوسم بشهرين", body: "أول مطر قوي (10 ملم أو أكثر) من 16 أكتوبر، وأحسن إذا معه رعد. الفقع يطلع بعده بـ 60 إلى 75 يوم." },
  { title: "دور عند الرقروق", body: "نبتة صغيرة زهرها أصفر. الفقع يعيش على عروقها، فإذا شفتها ركز حولها." },
  { title: "الأرض المفطورة", body: "انتفاخ صغير وشقوق في التراب. يبان أوضح الصبح بدري لأن الظل يكشفه." },
  { title: "على عمق 5 إلى 15 سم", body: "احفر حوله بعود أو بيدك بهدوء، ورد التراب مكانه عشان يطلع السنة الجاية." },
];

export function FieldGuide() {
  return (
    <section id="guide" aria-labelledby="guide-title" className="relative mt-24 scroll-mt-20 bg-sand text-ink md:mt-32">
      {/* Dune ridges instead of straight cuts where the sand meets the night sections. */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-full h-8 w-full text-sand md:h-14" aria-hidden>
        <path d="M0 80V56C130 44 230 20 370 22c150 2 240 36 400 34 150-2 220-40 370-44 140-4 220 22 300 30v38z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full text-ink md:h-14" aria-hidden>
        <path d="M0 80V40c160 18 300 34 470 28 170-6 250-42 420-40 170 2 300 30 550 18v34z" fill="currentColor" />
      </svg>
      <div className="mx-auto max-w-7xl px-5 pt-14 md:pt-20">
        <h2 id="guide-title" className="font-display text-4xl font-bold md:text-5xl">كيف تلقى الفقع؟</h2>
        <p className="mt-3 max-w-xl leading-8 text-ink/70">أربع علامات يعرفها أهل البر. الأولى نحسبها لك من المطر، والباقي عليك.</p>
      </div>

      <div className="mx-auto mt-8 max-w-6xl">
        <GroundSection />
      </div>

      <ol className="mx-auto grid max-w-7xl gap-x-8 gap-y-6 px-5 pb-24 pt-8 sm:grid-cols-2 md:pb-32 lg:grid-cols-4">
        {SIGNS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-cream" aria-hidden>{i + 1}</span>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-[15px] leading-7 text-ink/75">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={22} fill="#0f1729" />
      <text x={x} y={y + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill="#efe7d6" fontFamily="var(--font-readex), sans-serif">{n}</text>
    </g>
  );
}

function GroundSection() {
  const ground = "M0 232 C120 226 220 236 330 230 S455 229 472 230 C492 230 500 204 520 202 C540 202 550 230 572 231 S760 236 900 228 L900 460 L0 460 Z";
  return (
    <svg viewBox="0 0 900 430" className="h-auto w-full" role="img" aria-label="مقطع في الأرض: سحابة رعد ومطر، نبتة الرقروق وعروقها، انتفاخ مفطور في التراب، وتحته الفقعة">
      <defs>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#c99a6b" />
          <stop offset="1" stopColor="#8a5636" />
        </linearGradient>
        <radialGradient id="truffle" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f1e3c6" />
          <stop offset="1" stopColor="#cdb084" />
        </radialGradient>
        {/* Fade only the ground at the sides so it melts into the page; the cloud and plant stay crisp. */}
        <linearGradient id="fadeX" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" />
          <stop offset="0.86" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="soilFade" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="460">
          <rect width="900" height="460" fill="url(#fadeX)" />
        </mask>
      </defs>

      {/* 1. Wasm cloud, thunder and rain */}
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={700 + i * 26} y1={96} x2={672 + i * 26} y2={214} stroke="#5d86a0" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="10 14" opacity={0.75} />
        ))}
        <g fill="#4a5876">
          <circle cx={720} cy={72} r={30} />
          <circle cx={762} cy={56} r={38} />
          <circle cx={808} cy={74} r={28} />
          <rect x={692} y={72} width={140} height={30} rx={15} />
        </g>
        <path d="M770 98 L752 136 H772 L756 178 L798 124 H776 L790 98 Z" fill="#f4e7a1" stroke="#0f1729" strokeWidth={2} strokeLinejoin="round" />
        <Marker x={650} y={56} n={1} />
      </g>

      <g mask="url(#soilFade)">
      {/* Soil */}
      <path d={ground} fill="url(#soil)" />
      <path d="M0 232 C120 226 220 236 330 230 S455 229 472 230 C492 230 500 204 520 202 C540 202 550 230 572 231 S760 236 900 228" fill="none" stroke="#a8754b" strokeWidth={3} />
      {[[90, 300], [160, 390], [400, 410], [640, 380], [760, 300], [840, 400], [60, 420], [700, 420]].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={7} ry={4} fill="#7a4a2c" opacity={0.35} />
      ))}

      </g>

      {/* 2. Rogrog shrub and roots */}
      <g stroke="#7a4a2c" strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M260 232 C250 285 222 310 214 345" />
        <path d="M260 232 C266 290 276 330 272 372" />
        <path d="M262 236 C290 270 312 296 322 330" />
      </g>
      <g stroke="#f3e6cc" strokeWidth={1.6} fill="none" strokeDasharray="3 6" opacity={0.85}>
        <path d="M322 330 C380 330 430 300 476 292" />
        <path d="M272 372 C340 380 420 352 480 318" />
        <path d="M214 345 C260 410 400 400 490 334" />
      </g>
      <g stroke="#5b6b3a" strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M260 232 C255 200 236 178 220 160" />
        <path d="M260 232 C262 196 262 170 266 146" />
        <path d="M260 232 C272 204 292 186 306 168" />
        <path d="M258 232 C240 220 222 214 204 208" />
        <path d="M262 232 C284 222 302 218 318 214" />
      </g>
      <g fill="#7d8c4a">
        {[[220, 160, -40], [234, 176, -30], [266, 146, 0], [262, 172, 10], [306, 168, 40], [292, 186, 30], [204, 208, -70], [318, 214, 70], [248, 196, -20], [280, 200, 25]].map(([x, y, r]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={11} ry={5} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
      {[[218, 154], [268, 140], [308, 162]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={8} fill="#f2c94c" />
          <circle cx={x} cy={y} r={3} fill="#c98a1c" />
        </g>
      ))}
      <Marker x={180} y={130} n={2} />

      {/* 3. Cracked mound */}
      <g stroke="#6b4226" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M512 205 l6 9 l-5 8" />
        <path d="M528 204 l-4 8 l6 9" />
        <path d="M520 203 v7" />
        <path d="M500 214 l7 4" />
        <path d="M540 214 l-7 5" />
      </g>
      <Marker x={590} y={176} n={3} />

      {/* 4. Truffle */}
      <path d="M478 302 C474 276 500 262 522 264 C548 266 568 282 564 306 C561 330 538 344 514 340 C492 337 481 322 478 302 Z" fill="url(#truffle)" stroke="#6b4226" strokeWidth={2.5} />
      {[[500, 290], [530, 282], [546, 306], [512, 318], [526, 330]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.2} fill="#9b7348" />
      ))}
      <g stroke="#0f1729" strokeWidth={1.5} opacity={0.55}>
        <line x1={600} y1={236} x2={600} y2={340} strokeDasharray="4 4" />
        <line x1={592} y1={236} x2={608} y2={236} />
        <line x1={592} y1={340} x2={608} y2={340} />
      </g>
      <Marker x={640} y={290} n={4} />
    </svg>
  );
}
