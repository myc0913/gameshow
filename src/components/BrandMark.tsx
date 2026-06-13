export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="brand-mark__frame brand-mark__frame--top"
        d="M8 4.5H31.5C39 4.5 43.5 9 43.5 16.5V25"
        pathLength="1"
      />
      <path
        className="brand-mark__frame brand-mark__frame--bottom"
        d="M43.5 30V34C43.5 40 40 43.5 34 43.5H14C7.5 43.5 4.5 40 4.5 33.5V12C4.5 7 6 4.5 10.5 4.5"
        pathLength="1"
      />

      <path
        className="brand-mark__stroke brand-mark__stroke--forward"
        d="M10.5 14.5C16 11.5 21.5 14 24 20.5C26.5 27 32 30 38 25.5"
        pathLength="1"
      />
      <path
        className="brand-mark__stroke brand-mark__stroke--backward"
        d="M37.5 34C31 38 23 35.5 20.5 29C18 22.5 13.5 20.5 9.5 23.5"
        pathLength="1"
      />
      <path
        className="brand-mark__flow brand-mark__flow--forward"
        d="M10.5 14.5C16 11.5 21.5 14 24 20.5C26.5 27 32 30 38 25.5"
        pathLength="1"
      />
      <path
        className="brand-mark__flow brand-mark__flow--backward"
        d="M37.5 34C31 38 23 35.5 20.5 29C18 22.5 13.5 20.5 9.5 23.5"
        pathLength="1"
      />

      <circle className="brand-mark__origin" cx="10.5" cy="14.5" r="1.7" />
      <circle className="brand-mark__return" cx="37.5" cy="34" r="1.4" />
      <circle className="brand-mark__core-glow" cx="22.3" cy="24.2" r="6" />
      <circle className="brand-mark__ambient-ring" cx="22.3" cy="24.2" r="4.2" />
      <circle className="brand-mark__core" cx="22.3" cy="24.2" r="2.15" />
    </svg>
  );
}
