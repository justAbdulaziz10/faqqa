"use client";

// Last-resort screen when the root layout itself fails. No fonts or CSS can be relied on here.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f1729", color: "#efe7d6", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>صار خلل بسيط</h1>
          <p style={{ color: "#9aa6bd", lineHeight: 1.8 }}>جرب مرة ثانية، وإذا تكرر ارجع بعد شوي.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, background: "#f4e7a1", color: "#0f1729", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>جرب مرة ثانية</button>
        </div>
      </body>
    </html>
  );
}
