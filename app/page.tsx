import { MenuCard } from "@/components/menu-card"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5e8c9] p-4">
      {/* Texture overlay for old paper effect */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <MenuCard />
    </div>
  )
}
