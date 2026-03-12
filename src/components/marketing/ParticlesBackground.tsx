"use client"

import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { useCallback } from "react"

export default function ParticlesBackground() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine)
  }, [])

  return (
    <Particles
      init={particlesInit}
      className="absolute inset-0 -z-10"
      options={{
        background: { color: { value: "transparent" } },
        particles: {
          number: { value: 40 },
          size: { value: 2 },
          move: { enable: true, speed: 0.5 },
          opacity: { value: 0.3 },
        },
      }}
    />
  )
}