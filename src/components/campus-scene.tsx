/**
 * Hand-drawn campus scene for the sign-in pages and the home hero:
 * a club notice board with event posters, two students and festival bunting.
 * The wall and floor extend past the viewBox so the scene fills any aspect ratio.
 */
const SKIN_A = "#C98B62";
const SKIN_B = "#D9A07A";
const INK = "#111714";

function bunting() {
  // Quadratic curve from (-60,36) via (350,150) to (760,36); flags hang at even steps.
  const p0 = [-60, 36], p1 = [350, 150], p2 = [760, 36];
  const at = (t: number) => [0, 1].map((k) => (1 - t) ** 2 * p0[k]! + 2 * (1 - t) * t * p1[k]! + t ** 2 * p2[k]!) as [number, number];
  const colors = ["#F5B942", "#FFFFFF", "#176B50", "#E8836B", "#7FC2A0"];
  const flags = [];
  for (let i = 0; i < 17; i++) {
    const t = 0.04 + i * 0.057;
    const [x, y] = at(t);
    const [x2, y2] = at(t + 0.034);
    flags.push(<path key={i} d={`M${x},${y} L${x2},${y2} L${(x + x2) / 2 + 1},${(y + y2) / 2 + 30} Z`} fill={colors[i % colors.length]} />);
  }
  return (
    <g>
      <path d={`M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill="none" stroke="#5E7A6C" strokeWidth="2" />
      {flags}
    </g>
  );
}

export function CampusScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 700 640" preserveAspectRatio="xMidYMax meet" className={className} role="img" aria-label="Students in front of a club notice board with event posters">
      <defs>
        <linearGradient id="cs-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C6B4F" />
          <stop offset="1" stopColor="#1B4F3B" />
        </linearGradient>
        <linearGradient id="cs-pot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9ECEF" />
          <stop offset="1" stopColor="#B9C1C8" />
        </linearGradient>
        <linearGradient id="cs-sweater" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F7C55C" />
          <stop offset="1" stopColor="#E3A12E" />
        </linearGradient>
        <linearGradient id="cs-kameez" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A5CA8" />
          <stop offset="1" stopColor="#5A4290" />
        </linearGradient>
      </defs>

      {/* floor, extended sideways so wide panels stay filled */}
      <rect x="-1400" y="468" width="3500" height="900" fill="url(#cs-floor)" />
      <rect x="-1400" y="468" width="3500" height="6" fill="#ffffff" opacity="0.12" />

      {bunting()}

      {/* wall clock */}
      <g transform="translate(606 150)">
        <circle r="30" fill="#ffffff" stroke="#2A332F" strokeWidth="5" />
        <circle r="2.5" fill={INK} />
        <path d="M0 0 L0 -17 M0 0 L11 6" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* notice board */}
      <g>
        <rect x="76" y="164" width="372" height="240" rx="16" fill="#1B4F3B" opacity="0.18" transform="translate(6 10)" />
        <rect x="76" y="164" width="372" height="240" rx="16" fill="#ffffff" />
        <rect x="90" y="178" width="344" height="212" rx="10" fill="#F4EEDF" />
        <rect x="96" y="150" width="120" height="26" rx="13" fill={INK} />
        <text x="156" y="168" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff" fontFamily="inherit" letterSpacing="1.5">CLUB BOARD</text>

        {/* poster: tech fest */}
        <g transform="rotate(-2 160 285)">
          <rect x="104" y="196" width="118" height="168" rx="6" fill="#176B50" />
          <circle cx="188" cy="232" r="20" fill="#F5B942" />
          <path d="M116 262 h60" stroke="#ffffff" strokeWidth="2" opacity="0.4" />
          <text x="116" y="292" fontSize="19" fontWeight="800" fill="#ffffff" fontFamily="inherit">TECH</text>
          <text x="116" y="314" fontSize="19" fontWeight="800" fill="#F5B942" fontFamily="inherit">FEST</text>
          <rect x="116" y="328" width="70" height="5" rx="2.5" fill="#ffffff" opacity="0.55" />
          <rect x="116" y="339" width="48" height="5" rx="2.5" fill="#ffffff" opacity="0.35" />
          <circle cx="163" cy="200" r="5" fill="#E8836B" />
        </g>

        {/* poster: debate night */}
        <g transform="rotate(3 284 226)">
          <rect x="238" y="192" width="96" height="72" rx="6" fill="#F5B942" />
          <text x="248" y="218" fontSize="13" fontWeight="800" fill={INK} fontFamily="inherit">DEBATE</text>
          <text x="248" y="234" fontSize="10" fontWeight="600" fill={INK} opacity="0.7" fontFamily="inherit">Friday · 4 pm</text>
          <rect x="248" y="244" width="58" height="4" rx="2" fill={INK} opacity="0.3" />
          <circle cx="286" cy="196" r="5" fill="#176B50" />
        </g>

        {/* calendar */}
        <g>
          <rect x="238" y="276" width="98" height="96" rx="8" fill="#ffffff" />
          <rect x="238" y="276" width="98" height="22" rx="8" fill="#E8836B" />
          <rect x="238" y="290" width="98" height="8" fill="#E8836B" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={248 + (i % 4) * 20} y={306 + Math.floor(i / 4) * 20} width="14" height="14" rx="3" fill={i === 6 ? "#176B50" : "#E6ECE8"} />
          ))}
          <circle cx="287" cy="280" r="5" fill="#F5B942" />
        </g>

        {/* sticky notes */}
        <g transform="rotate(5 384 222)">
          <rect x="350" y="192" width="70" height="64" rx="4" fill="#FDE6A6" />
          <rect x="360" y="208" width="46" height="4" rx="2" fill={INK} opacity="0.35" />
          <rect x="360" y="218" width="36" height="4" rx="2" fill={INK} opacity="0.25" />
          <rect x="360" y="228" width="42" height="4" rx="2" fill={INK} opacity="0.25" />
        </g>
        <g transform="rotate(-4 386 312)">
          <rect x="350" y="276" width="74" height="74" rx="4" fill="#CDEBD8" />
          <path d="M366 312 l10 10 l20 -22" fill="none" stroke="#176B50" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="387" cy="280" r="5" fill="#E8836B" />
        </g>
      </g>

      {/* plant */}
      <g transform="translate(612 596)">
        <ellipse cx="0" cy="2" rx="52" ry="9" fill="#000000" opacity="0.18" />
        <path d="M-6 -86 C -40 -150 -54 -210 -30 -268 C -14 -210 -4 -150 -6 -86 Z" fill="#3E8E66" />
        <path d="M2 -86 C 20 -160 46 -200 70 -238 C 60 -170 36 -120 2 -86 Z" fill="#2F7A55" />
        <path d="M-4 -86 C -60 -110 -86 -150 -96 -196 C -54 -160 -28 -130 -4 -86 Z" fill="#4AA37B" />
        <path d="M0 -86 C 6 -170 2 -240 14 -300 C 30 -230 22 -160 0 -86 Z" fill="#23865F" />
        <path d="M-40 -92 L40 -92 L32 0 L-32 0 Z" fill="url(#cs-pot)" />
        <rect x="-44" y="-100" width="88" height="12" rx="4" fill="#DDE2E6" />
      </g>

      {/* student with books (hijab) */}
      <g transform="translate(300 600)">
        <ellipse cx="0" cy="0" rx="46" ry="8" fill="#000000" opacity="0.2" />
        <rect x="-26" y="-16" width="22" height="14" rx="6" fill={INK} />
        <rect x="4" y="-16" width="22" height="14" rx="6" fill={INK} />
        <rect x="-20" y="-30" width="15" height="18" fill="#2A332F" />
        <rect x="5" y="-30" width="15" height="18" fill="#2A332F" />
        <path d="M-34 -196 Q-36 -212 -20 -218 L20 -218 Q36 -212 34 -196 L46 -36 Q46 -26 36 -26 L-36 -26 Q-46 -26 -46 -36 Z" fill="url(#cs-kameez)" />
        <path d="M-2 -200 L0 -40" stroke="#3F2E6B" strokeWidth="2" opacity="0.5" />
        {/* hijab */}
        <path d="M-31 -238 Q-36 -296 0 -298 Q36 -296 31 -238 Q36 -206 22 -196 L-22 -196 Q-36 -206 -31 -238 Z" fill="#E8836B" />
        <ellipse cx="0" cy="-250" rx="17" ry="21" fill={SKIN_B} />
        <path d="M-19 -262 Q0 -280 19 -262" fill="none" stroke="#D66F57" strokeWidth="5" strokeLinecap="round" />
        <circle cx="-6.5" cy="-251" r="2.3" fill={INK} />
        <circle cx="6.5" cy="-251" r="2.3" fill={INK} />
        <path d="M-5 -239 Q0 -235 5 -239" fill="none" stroke="#8A4A34" strokeWidth="2" strokeLinecap="round" />
        {/* books + arms */}
        <rect x="-24" y="-176" width="48" height="12" rx="2" fill="#F5B942" />
        <rect x="-21" y="-188" width="42" height="13" rx="2" fill="#ffffff" />
        <rect x="-23" y="-164" width="46" height="10" rx="2" fill="#7FC2A0" />
        <path d="M-32 -204 L-36 -168 L-16 -166" fill="none" stroke="#523C86" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 -204 L36 -168 L16 -166" fill="none" stroke="#523C86" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-15" cy="-166" r="7" fill={SKIN_B} />
        <circle cx="15" cy="-166" r="7" fill={SKIN_B} />
      </g>

      {/* student with phone */}
      <g transform="translate(482 612)">
        <ellipse cx="0" cy="0" rx="48" ry="8" fill="#000000" opacity="0.2" />
        <rect x="-32" y="-15" width="28" height="15" rx="7" fill="#ffffff" />
        <rect x="4" y="-15" width="28" height="15" rx="7" fill="#ffffff" />
        <rect x="-32" y="-6" width="28" height="4" fill="#F5B942" />
        <rect x="4" y="-6" width="28" height="4" fill="#F5B942" />
        <rect x="-25" y="-118" width="21" height="106" rx="9" fill="#2D4A7A" />
        <rect x="4" y="-118" width="21" height="106" rx="9" fill="#27426D" />
        {/* backpack peeking out */}
        <rect x="-44" y="-204" width="88" height="92" rx="20" fill="#176B50" />
        <path d="M-38 -200 Q-42 -216 -24 -220 L24 -220 Q42 -216 38 -200 L35 -106 Q35 -100 29 -100 L-29 -100 Q-35 -100 -35 -106 Z" fill="url(#cs-sweater)" />
        <path d="M-12 -220 L0 -204 L12 -220 Z" fill="#ffffff" />
        <rect x="-30" y="-216" width="7" height="66" rx="3" fill="#125841" />
        <rect x="23" y="-216" width="7" height="66" rx="3" fill="#125841" />
        <path d="M-40 -206 L-46 -126" stroke="#E3A12E" strokeWidth="16" strokeLinecap="round" />
        <circle cx="-46" cy="-120" r="8" fill={SKIN_A} />
        <path d="M40 -206 L44 -156 L18 -162" fill="none" stroke="#E3A12E" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="4" y="-192" width="18" height="30" rx="4" fill={INK} />
        <rect x="6.5" y="-188" width="13" height="21" rx="2" fill="#7FC2A0" />
        <circle cx="16" cy="-163" r="8" fill={SKIN_A} />
        <rect x="-8" y="-234" width="16" height="18" fill={SKIN_A} />
        <circle cx="-24" cy="-254" r="5" fill={SKIN_A} />
        <circle cx="24" cy="-254" r="5" fill={SKIN_A} />
        <ellipse cx="0" cy="-256" rx="24" ry="27" fill={SKIN_A} />
        <path d="M-26 -258 Q-30 -292 0 -292 Q30 -292 26 -258 Q22 -276 8 -274 Q-8 -282 -26 -258 Z" fill="#1E1A18" />
        <circle cx="-8" cy="-252" r="2.4" fill={INK} />
        <circle cx="8" cy="-252" r="2.4" fill={INK} />
        <path d="M-6 -241 Q0 -236 6 -241" fill="none" stroke="#7A3E2A" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
