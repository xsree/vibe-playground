import type { ShapeGlyphKind } from './registry';

interface ShapeGlyphProps {
  kind: ShapeGlyphKind;
}

export function ShapeGlyph({ kind }: ShapeGlyphProps) {
  return (
    <svg className="shape-glyph" viewBox="0 0 64 64" aria-hidden="true">
      {kind === 'source' ? (
        <>
          <circle cx="23" cy="32" r="13" />
          <path className="shape-glyph__accent" d="M23 32h27m-8-8 8 8-8 8" />
        </>
      ) : null}
      {kind === 'sink' ? (
        <>
          <circle cx="41" cy="32" r="13" />
          <path className="shape-glyph__accent" d="M6 32h27m-8-8 8 8-8 8" />
        </>
      ) : null}
      {kind === 'generic' ? (
        <>
          <rect x="12" y="17" width="40" height="30" rx="4" />
          <path className="shape-glyph__accent" d="M20 32h8l4-7 5 14 4-7h5" />
        </>
      ) : null}
      {kind === 'vessel-stirred' ? (
        <>
          <path d="M18 15h28v28c0 6-5 11-11 11h-6c-6 0-11-5-11-11V15Z" />
          <path className="shape-glyph__accent" d="M32 8v34m-9-7h18M25 49l-4 7m18-7 4 7" />
        </>
      ) : null}
      {kind === 'vessel-heated' ? (
        <>
          <path d="M19 13h26v31c0 6-5 10-10 10h-6c-5 0-10-4-10-10V13Z" />
          <path d="M14 20v25c0 8 6 14 14 14h8c8 0 14-6 14-14V20" />
          <path className="shape-glyph__accent" d="m26 42 4-8 4 8 4-8" />
        </>
      ) : null}
      {kind === 'vessel-vacuum' ? (
        <>
          <path d="M19 17h26v27c0 6-5 10-10 10h-6c-5 0-10-4-10-10V17Z" />
          <path d="M32 17V9h13" />
          <circle className="shape-glyph__accent" cx="49" cy="9" r="5" />
          <path className="shape-glyph__accent" d="M49 9l3-2" />
        </>
      ) : null}
      {kind === 'tank' ? (
        <>
          <ellipse cx="32" cy="14" rx="15" ry="6" />
          <path d="M17 14v35c0 4 7 7 15 7s15-3 15-7V14" />
          <path className="shape-glyph__accent" d="M17 47c0 4 7 7 15 7s15-3 15-7" />
        </>
      ) : null}
      {kind === 'tubular' ? (
        <>
          <path d="M8 19h35c7 0 7 11 0 11H21c-7 0-7 11 0 11h35" />
          <path className="shape-glyph__accent" d="m49 13 7 6-7 6m-34 10-7 6 7 6" />
        </>
      ) : null}
      {kind === 'separator-phase' ? (
        <>
          <rect x="8" y="20" width="48" height="27" rx="13" />
          <path className="shape-glyph__accent" d="M10 34c8-5 15 5 23 0s14 5 21 0" />
          <path d="M20 47v8m24-8v8" />
        </>
      ) : null}
      {kind === 'separator-settling' ? (
        <>
          <path d="M12 15h40v31l-10 11H22L12 46V15Z" />
          <path className="shape-glyph__accent" d="M13 31h38M14 41h36" />
        </>
      ) : null}
      {kind === 'separator-solid-liquid' ? (
        <>
          <path d="M11 18h42v29H11zM17 14v38m8-38v38m8-38v38m8-38v38m8-38v38" />
          <path className="shape-glyph__accent" d="M5 32h6m42 0h6" />
        </>
      ) : null}
      {kind === 'condenser' ? (
        <>
          <circle cx="32" cy="32" r="22" />
          <path className="shape-glyph__accent" d="M16 39c5 0 5-14 10-14s5 14 10 14 5-14 10-14" />
          <path d="M5 32h6m42 0h6" />
        </>
      ) : null}
      {kind === 'metering' ? (
        <>
          <circle cx="29" cy="33" r="16" />
          <path className="shape-glyph__accent" d="M29 33 39 24M13 33H5m40 0h14" />
          <path d="M48 16v34m0-28h6m-6 8h4m-4 8h6m-6 8h4" />
        </>
      ) : null}
      {kind === 'transfer' ? (
        <>
          <circle cx="27" cy="34" r="16" />
          <path d="M27 18v-8h14" />
          <path className="shape-glyph__accent" d="m22 41 14-7-14-7v14Zm21-7h16" />
        </>
      ) : null}
      {kind === 'conveyor' ? (
        <>
          <path d="M7 23h50v20H7z" />
          <circle cx="17" cy="33" r="4" />
          <circle cx="32" cy="33" r="4" />
          <circle cx="47" cy="33" r="4" />
          <path className="shape-glyph__accent" d="m49 16 8 7-8 7" />
        </>
      ) : null}
      {kind === 'slicer' ? (
        <>
          <circle cx="28" cy="31" r="19" />
          <circle className="shape-glyph__accent" cx="28" cy="31" r="5" />
          <path className="shape-glyph__accent" d="m28 12 4 14 15-4m-34 17 14-4 4 15" />
          <path d="M47 31h12" />
        </>
      ) : null}
      {kind === 'hopper' ? (
        <>
          <path d="M11 13h42l-8 31-9 8h-8l-9-8-8-31Z" />
          <path className="shape-glyph__accent" d="M28 52v7h8v-7M16 27h32" />
        </>
      ) : null}
      {kind === 'dust' ? (
        <>
          <path d="M15 12h34l-5 28-9 9v10h-6V49l-9-9-5-28Z" />
          <path className="shape-glyph__accent" d="M22 22c8-5 20 1 15 8-3 5-13 1-9-3 2-2 6 0 5 2" />
        </>
      ) : null}
      {kind === 'packaging' ? (
        <>
          <path d="M9 41h46v9H9z" />
          <circle cx="17" cy="54" r="3" />
          <circle cx="47" cy="54" r="3" />
          <path d="M18 17h15v24H18zM35 24h12v17H35z" />
          <path className="shape-glyph__accent" d="m18 17 7 6 8-6m2 7 6 5 6-5" />
        </>
      ) : null}
      {kind === 'warehouse' ? (
        <>
          <path d="m8 25 24-15 24 15v32H8V25Z" />
          <path className="shape-glyph__accent" d="M20 57V35h24v22M20 42h24M20 49h24" />
        </>
      ) : null}
    </svg>
  );
}
