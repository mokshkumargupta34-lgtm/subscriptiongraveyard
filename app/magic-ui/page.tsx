import { AuroraText } from "@/components/ui/aurora-text";
import { SparklesText } from "@/components/ui/sparkles-text";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BlurFade } from "@/components/ui/blur-fade";
import { Meteors } from "@/components/ui/meteors";
import { Ripple } from "@/components/ui/ripple";
import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Particles } from "@/components/ui/particles";
import { BorderBeam } from "@/components/ui/border-beam";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { Globe } from "@/components/ui/globe";

function Cell({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{title}</p>
      <div className={`flex min-h-28 items-center justify-center ${className}`}>{children}</div>
    </div>
  );
}

const TECH = ["Next.js", "React", "Tailwind", "Framer Motion", "TypeScript", "shadcn/ui"];

export default function MagicUIGallery() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-14 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-white/40">Installed · Live</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <AuroraText>Magic UI</AuroraText>
        </h1>
        <p className="mt-5 text-white/60">
          <NumberTicker value={77} className="font-semibold text-white" /> components installed in this project. A
          representative sample:
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Cell title="Aurora Text">
          <span className="text-3xl font-bold">
            <AuroraText>Gradient</AuroraText>
          </span>
        </Cell>

        <Cell title="Sparkles Text">
          <SparklesText className="text-3xl font-bold">Sparkle</SparklesText>
        </Cell>

        <Cell title="Typing Animation">
          <TypingAnimation className="text-2xl font-semibold">Exhume the inbox…</TypingAnimation>
        </Cell>

        <Cell title="Shiny Button">
          <ShinyButton>Shiny</ShinyButton>
        </Cell>

        <Cell title="Shimmer Button">
          <ShimmerButton className="shadow-2xl">Shimmer</ShimmerButton>
        </Cell>

        <Cell title="Rainbow Button">
          <RainbowButton>Rainbow</RainbowButton>
        </Cell>

        <Cell title="Pulsating Button">
          <PulsatingButton>Pulse</PulsatingButton>
        </Cell>

        <Cell title="Number Ticker">
          <span className="text-5xl font-bold tabular-nums">
            $<NumberTicker value={3532} />
          </span>
        </Cell>

        <Cell title="Blur Fade">
          <BlurFade delay={0.2} inView>
            <span className="text-2xl font-semibold">It appears…</span>
          </BlurFade>
        </Cell>

        <Cell title="Marquee" className="w-full overflow-hidden">
          <Marquee pauseOnHover className="[--duration:14s]">
            {TECH.map((t) => (
              <span key={t} className="mx-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
                {t}
              </span>
            ))}
          </Marquee>
        </Cell>

        <Cell title="Meteors" className="relative overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <Meteors number={18} />
          </div>
        </Cell>

        <Cell title="Ripple" className="relative overflow-hidden">
          <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg">
            <Ripple />
          </div>
        </Cell>

        <Cell title="Dot Pattern" className="relative overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <DotPattern className="opacity-60" />
          </div>
        </Cell>

        <Cell title="Grid Pattern" className="relative overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <GridPattern className="opacity-60" />
          </div>
        </Cell>

        <Cell title="Flickering Grid" className="relative overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <FlickeringGrid className="absolute inset-0" squareSize={3} gridGap={5} color="#8b5cf6" maxOpacity={0.5} />
          </div>
        </Cell>

        <Cell title="Particles" className="relative overflow-hidden">
          <div className="relative h-28 w-full overflow-hidden rounded-lg">
            <Particles className="absolute inset-0" quantity={80} color="#a855f7" />
          </div>
        </Cell>

        <Cell title="Border Beam">
          <div className="relative h-24 w-40 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <BorderBeam size={60} duration={8} />
          </div>
        </Cell>

        <Cell title="Orbiting Circles" className="relative">
          <div className="relative flex h-32 w-full items-center justify-center">
            <OrbitingCircles radius={50} iconSize={18}>
              <span className="text-lg">🪐</span>
              <span className="text-lg">👻</span>
              <span className="text-lg">💸</span>
            </OrbitingCircles>
          </div>
        </Cell>

        <Cell title="Globe" className="relative">
          <div className="relative flex h-48 w-full items-center justify-center overflow-hidden">
            <Globe />
          </div>
        </Cell>
      </div>

      <footer className="mt-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
        components/ui · installed via shadcn @magicui registry
      </footer>
    </main>
  );
}
