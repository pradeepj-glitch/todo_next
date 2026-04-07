export type Priority = "low" | "medium" | "high";

export const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  low:    { label: "Low",    color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.3)",  glow: "rgba(34,197,94,0.2)"  },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)", glow: "rgba(245,158,11,0.2)" },
  high:   { label: "High",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)",  glow: "rgba(239,68,68,0.2)"  },
};

export const getThemeColors = (isDark: boolean, primaryColor: string = "#6366f1") => ({
  bg:           isDark ? "#070b12"   : "#f4f6fb",
  surface:      isDark ? "#0d1420"   : "#ffffff",
  surfaceHover: isDark ? "#111827"   : "#f9faff",
  border:       isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
  borderHover:  isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)",
  text:         isDark ? "#e8edf5"   : "#111827",
  textMuted:    isDark ? "#5a6a82"   : "#8a94a6",
  textSub:      isDark ? "#3d4f68"   : "#bcc4d0",
  input:        isDark ? "#0d1420"   : "#f4f6fb",
  inputBorder:  isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
  heading:      isDark ? "#f0f4ff"   : "#0a0f1e",
  accent:       primaryColor,
  shimmer:      isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
});
