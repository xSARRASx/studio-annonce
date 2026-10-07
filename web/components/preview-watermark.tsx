import "./preview-watermark.css";

/** Presentation only: the API must also protect the delivered preview. */
export function PreviewWatermark({ from = 0 }: { from?: number }) {
  return <div className="preview-watermark" aria-hidden="true" style={{ clipPath: `inset(0 0 0 ${from}%)` }}>
    <div className="preview-watermark-pattern">{Array.from({ length: 12 }, (_, i) => <span key={i}>STUDIO ANNONCE · APERÇU</span>)}</div>
  </div>;
}
