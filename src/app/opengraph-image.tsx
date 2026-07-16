import { ImageResponse } from "next/og";

/**
 * Image OpenGraph générée au build (next/og, aucune dépendance ajoutée) —
 * affichée quand le site est partagé (SMS, WhatsApp, LinkedIn, Facebook…).
 * Reprend le design system sombre de globals.css.
 */

export const alt = "Décroché — Ne perdez plus jamais un client. L'assistant SMS des artisans du BTP.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #08090d 0%, #0e1016 55%, #131017 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "460px",
            height: "460px",
            borderRadius: "50%",
            background: "rgba(255, 178, 36, 0.14)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-60px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "rgba(76, 201, 240, 0.12)",
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "36px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#ffb224",
              display: "flex",
            }}
          />
          <div style={{ fontSize: "34px", fontWeight: 800, color: "#f2f3f7", display: "flex" }}>Décroché</div>
        </div>
        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            color: "#f2f3f7",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Ne perdez plus jamais</span>
          <span style={{ color: "#ffb224" }}>un client.</span>
        </div>
        <div style={{ fontSize: "30px", color: "#9aa1b2", marginTop: "30px", display: "flex" }}>
          L&apos;assistant SMS qui rattrape les appels manqués des artisans du BTP.
        </div>
        <div style={{ fontSize: "24px", color: "#4cc9f0", marginTop: "44px", display: "flex" }}>
          qualifyourlead.com · Essai gratuit 14 jours
        </div>
      </div>
    ),
    { ...size },
  );
}
