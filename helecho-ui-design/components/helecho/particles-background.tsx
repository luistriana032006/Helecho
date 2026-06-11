"use client"

import { Particles, ParticlesProvider, useParticlesProvider } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import type { Engine, ISourceOptions } from "@tsparticles/engine"

const OPTIONS: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  detectRetina: true,
  particles: {
    number: { value: 46, density: { enable: true } },
    color: { value: ["#1e8049", "#2dc653", "#154734"] },
    links: {
      enable: true,
      color: "#1e8049",
      distance: 140,
      opacity: 0.22,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.7,
      direction: "none",
      outModes: { default: "out" },
      random: false,
      straight: false,
    },
    opacity: { value: { min: 0.15, max: 0.5 } },
    size: { value: { min: 1, max: 3 } },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
    },
    modes: {
      grab: { distance: 160, links: { opacity: 0.4 } },
    },
  },
}

async function initEngine(engine: Engine) {
  await loadSlim(engine)
}

function ParticlesCanvas() {
  const { loaded } = useParticlesProvider()
  if (!loaded) return null
  return (
    <Particles
      id="library-particles"
      options={OPTIONS}
      className="pointer-events-none absolute inset-0 -z-10"
    />
  )
}

export function ParticlesBackground() {
  return (
    <ParticlesProvider init={initEngine}>
      <ParticlesCanvas />
    </ParticlesProvider>
  )
}
