const tones = {
  notice: "bg-notice-soft text-notice",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
} as const;

export default function Notice({
  tone = "notice",
  children,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-card p-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
