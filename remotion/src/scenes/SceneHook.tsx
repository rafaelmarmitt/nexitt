import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const FONT = "Plus Jakarta Sans, sans-serif";

const Bubble: React.FC<{ delay: number; x: number; y: number; w: number; h: number; color: string }> = ({
  delay, x, y, w, h, color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const float = Math.sin((frame - delay) / 18) * 6;
  return (
    <div style={{
      position: "absolute", left: x, top: y + float, width: w, height: h,
      background: color, borderRadius: 28,
      transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`,
      opacity: s, boxShadow: "0 20px 50px rgba(20,184,166,0.25)",
    }} />
  );
};

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const subS = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const kicker = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#0f1f1d" }}>
      <Bubble delay={0} x={150} y={180} w={140} h={50} color="#dcfce7" />
      <Bubble delay={6} x={1620} y={260} w={170} h={60} color="#ccfbf1" />
      <Bubble delay={12} x={220} y={820} w={180} h={64} color="#ecfccb" />
      <Bubble delay={18} x={1580} y={780} w={140} h={50} color="#dcfce7" />
      <Bubble delay={24} x={120} y={520} w={110} h={42} color="#ccfbf1" />
      <Bubble delay={30} x={1700} y={540} w={120} h={45} color="#ecfccb" />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{
          opacity: kicker,
          transform: `translateY(${interpolate(kicker, [0, 1], [20, 0])}px)`,
          fontSize: 28, fontWeight: 600, letterSpacing: "0.32em",
          color: "#0d7a6f", textTransform: "uppercase", marginBottom: 32,
        }}>
          Conta<span style={{ color: "#84cc16" }}>.AI</span> &nbsp;•&nbsp; MEI Inteligente
        </div>
        <div style={{
          opacity: titleS,
          transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
          fontSize: 128, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em",
          maxWidth: 1400,
        }}>
          Seu <span style={{
            background: "linear-gradient(135deg, #14b8a6, #84cc16)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>WhatsApp</span><br />virou sua contabilidade
        </div>
        <div style={{
          opacity: subS,
          transform: `translateY(${interpolate(subS, [0, 1], [20, 0])}px)`,
          fontSize: 36, fontWeight: 500, color: "#3d524f", marginTop: 28,
        }}>
          Vendas, impostos e relatórios — direto no chat.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
