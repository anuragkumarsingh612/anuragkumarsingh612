import type { Product } from "../app/demo";
export function GroceryArt() {
  return (
    <svg
      className="grocery-art"
      viewBox="0 0 230 230"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="bag"
          x1="74"
          y1="137"
          x2="165"
          y2="222"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B79A77" />
          <stop offset="1" stopColor="#806447" />
        </linearGradient>
        <linearGradient
          id="bottle"
          x1="48"
          y1="75"
          x2="91"
          y2="176"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D6B460" />
          <stop offset="1" stopColor="#9D772C" />
        </linearGradient>
        <linearGradient
          id="carton"
          x1="90"
          y1="87"
          x2="140"
          y2="155"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E6E5DD" />
          <stop offset="1" stopColor="#B8C9D7" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <ellipse
        cx="131"
        cy="215"
        rx="77"
        ry="8"
        fill="#000"
        opacity=".28"
        filter="url(#shadow)"
      />
      <circle cx="130" cy="128" r="87" fill="#97BAE1" fillOpacity=".045" />
      <circle cx="130" cy="128" r="66" stroke="#A4C2E5" strokeOpacity=".07" />
      <g transform="rotate(-12 73 140)">
        <rect x="55" y="79" width="29" height="19" rx="4" fill="#799076" />
        <path d="M57 96h25l8 24v59H49v-59z" fill="url(#bottle)" />
        <rect x="52" y="124" width="35" height="33" rx="2" fill="#E4D9B8" />
        <path d="M68 134c9 0 11 10 2 15-7-7-9-10-2-15Z" fill="#647C55" />
      </g>
      <g transform="rotate(5 121 121)">
        <path d="m97 77 13-18h24l10 18v97H97z" fill="url(#carton)" />
        <path d="m110 59 1 18H97zm1 18h33l-10-18h-24" fill="#A5BBD3" />
        <path d="M97 91h47v50H97z" fill="#6E96C6" />
        <path
          d="M115 103c-2 6-7 10-7 15a10 10 0 0 0 20 0c0-5-6-9-10-15z"
          fill="#E5EBED"
        />
        <path d="M106 152h29m-26 6h23" stroke="#748BA0" strokeWidth="2" />
      </g>
      <path d="M156 156c4-45-7-50 8-88" stroke="#729664" strokeWidth="7" />
      <path d="M163 105c-29-4-30-19-26-33 16 2 29 10 26 33Z" fill="#759866" />
      <path d="M162 93c-4-29 7-47 23-50 10 21-1 38-23 50Z" fill="#8CAA75" />
      <path d="M167 127c0-29 10-40 27-41 2 20-10 33-27 41Z" fill="#5C8054" />
      <path d="M159 139c-19-6-27-20-24-36 18 1 29 14 24 36Z" fill="#88A76E" />
      <path d="m148 163 25-33c8-8 27-5 27 8 0 10-28 43-36 48Z" fill="#CA8053" />
      <path
        d="m187 129 5-16m-5 16 14-8"
        stroke="#73915B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="m54 144 143-3-16 73H71Z" fill="url(#bag)" />
      <path d="m54 144 20 15 110-3 13-15" fill="#CEB594" />
      <path d="m74 159-3 55m113-58-3 58" stroke="#6C533D" strokeOpacity=".3" />
      <path
        d="M105 159v9c0 28 47 28 47-2v-9"
        stroke="#614D39"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M106 159v8c0 27 44 27 44-2v-8"
        stroke="#DDC4A4"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="m37 67 3-8 3 8 8 3-8 3-3 8-3-8-8-3z"
        fill="#A6BBDA"
        opacity=".8"
      />
      <path
        d="m198 178 2-5 2 5 5 2-5 2-2 5-2-5-5-2z"
        fill="#A6BBDA"
        opacity=".6"
      />
    </svg>
  );
}
const colors = {
  rice: ["#682f24", "#d3b785"],
  oil: ["#ba902d", "#f4d366"],
  milk: ["#32679e", "#d9e6eb"],
  salt: ["#476b98", "#eee9d9"],
  soap: ["#c4c6c1", "#faf2d8"],
  tea: ["#93803d", "#cebb64"],
  coffee: ["#563428", "#a86a46"],
  detergent: ["#b85130", "#e4964f"],
  lentils: ["#966c35", "#dfb771"],
};
export function ProductArt({ kind }: { kind: Product["art"] }) {
  const [dark, light] = colors[kind];
  return (
    <div className={`product-art art-${kind}`}>
      <svg viewBox="0 0 56 64" aria-hidden="true">
        <ellipse cx="28" cy="58" rx="17" ry="3" fill="#000" opacity=".18" />
        {kind === "oil" ? (
          <>
            <rect x="22" y="3" width="12" height="8" rx="2" fill="#be4641" />
            <path d="M22 11h12l5 12v31q-11 6-22 0V23z" fill={light} />
            <rect x="17" y="26" width="22" height="19" rx="1" fill="#fff3d0" />
            <path d="m22 35 6-6 6 6-6 6z" fill={dark} />
          </>
        ) : kind === "milk" ? (
          <>
            <path d="m15 15 8-11h15l5 11v41H15z" fill={light} />
            <path d="m15 15 8-11 1 11h19l-5-11H23" fill="#7193b9" />
            <path d="M15 22h28v23H15z" fill={dark} />
            <path
              d="M29 27c-1 4-6 7-6 10a6 6 0 0 0 12 0c0-3-5-6-6-10z"
              fill="#e8ebec"
            />
          </>
        ) : kind === "soap" ? (
          <>
            <rect x="8" y="18" width="40" height="29" rx="5" fill={light} />
            <path d="M12 42c14-11 21 6 32-7v8H12z" fill="#738fa9" />
            <path d="M22 29q7-7 14 0-7 11-14 0" fill="#b7a368" />
            <path d="M15 20h27" stroke="#fff" />
          </>
        ) : (
          <>
            <path d="m13 9 30 0-2 7 4 38q-17 6-34 0l4-38z" fill={dark} />
            <path d="M13 9h30M11 54h34" stroke={light} strokeWidth="2" />
            <path d="M14 22h28v21H14z" fill={light} />
            <circle cx="28" cy="32" r="7" fill={dark} opacity=".85" />
            <path
              d="m25 34 3-8 3 8m-9 12h12"
              stroke={light}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}
