export default function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <Bone width={160} height={12} />
        <div style={{ height: 8 }} />
        <Bone width={260} height={9} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "20px 24px" }}>
            <Bone width={80} height={9} />
            <div style={{ height: 10 }} />
            <Bone width={120} height={22} />
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <Bone width={100} height={10} />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: "16px 24px", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Bone width={32} height={32} radius="50%" />
              <div>
                <Bone width={120} height={10} />
                <div style={{ height: 5 }} />
                <Bone width={80} height={9} />
              </div>
            </div>
            <Bone width={60} height={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bone({ width, height, radius = "6px" }: { width: number | string; height: number; radius?: string }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: "rgba(0,0,0,0.06)",
      animation: "skeletonPulse 1.4s ease-in-out infinite",
    }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
