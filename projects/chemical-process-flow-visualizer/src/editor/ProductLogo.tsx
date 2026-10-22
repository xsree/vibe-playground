export function ProductLogo() {
  return (
    <svg className="product-logo" viewBox="0 0 48 48" role="img" aria-label="工艺流程可视化标志">
      <path d="M16 10v8c0 3.8 3.6 6 8 6s8-2.2 8-6v-8" />
      <ellipse cx="24" cy="10" rx="8" ry="4" />
      <path d="M16 18v12c0 3.8 3.6 6 8 6s8-2.2 8-6V18M24 36v6M11 42h26" />
      <path className="product-logo__pipe" d="M4 20h12M32 28h8v-8h4" />
      <circle className="product-logo__joint" cx="4" cy="20" r="2" />
      <circle className="product-logo__joint" cx="44" cy="20" r="2" />
    </svg>
  );
}
