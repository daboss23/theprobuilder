'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OpusPhase } from '@/lib/campaign-reactor/workflow'

/**
 * The OPUS reactor heart, rendered as a real-time WebGL scene:
 *
 *   · A faceted holographic ice crystal (fresnel rim + flat facet shading)
 *   · A warm amber intelligence heart that breathes with the run's energy —
 *     the only warm light in the chamber, per the holographic-chamber palette
 *   · An orbiting charge-particle field of cool ions
 *   · Layered glow sprites standing in for bloom (cheap, no postprocessing)
 *
 * Everything is phase-reactive: the live OpusPhase drives a single `energy`
 * level plus a rim/halo tint (electric cyan while working, emerald on ready,
 * red on fault), lerped in the render loop so state changes feel physical
 * rather than switched. Honest-state rule: the crystal only rages when the
 * reactor is actually synthesising.
 *
 * Guardrails: DPR clamped, RAF paused while the tab is hidden, reduced motion
 * renders a single static frame, `onUnavailable` falls the parent back to the
 * CSS core when a WebGL context can't be created, and every GPU resource is
 * disposed on unmount.
 */

interface PhaseVisual {
  /** 0..1 drive level for pulse speed, glow intensity and particle speed. */
  energy: number
  /** Rim + halo tint. */
  tint: THREE.Color
}

const TINT_ICE = new THREE.Color('#67D9FF')
const TINT_EMERALD = new THREE.Color('#34D399')
const TINT_RED = new THREE.Color('#FB7185')

function phaseVisual(phase: OpusPhase): PhaseVisual {
  switch (phase) {
    case 'idle':
      return { energy: 0.38, tint: TINT_ICE }
    case 'initialising':
      return { energy: 0.55, tint: TINT_ICE }
    case 'delegating':
      return { energy: 0.7, tint: TINT_ICE }
    case 'receiving':
      return { energy: 0.85, tint: TINT_ICE }
    case 'synthesising':
    case 'evaluating':
    case 'generating':
      return { energy: 1, tint: TINT_ICE }
    case 'ready':
      return { energy: 0.62, tint: TINT_EMERALD }
    case 'error':
      return { energy: 0.22, tint: TINT_RED }
  }
}

/* ------------------------------- Shaders ---------------------------------- */

const CRYSTAL_VERT = /* glsl */ `
  varying vec3 vViewPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const CRYSTAL_FRAG = /* glsl */ `
  uniform float uEnergy;
  uniform float uFlare;
  uniform vec3 uTint;
  uniform float uTime;
  varying vec3 vViewPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    // Flat facet normal from screen-space derivatives — crisp gem faces.
    vec3 fn = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
    vec3 viewDir = normalize(-vViewPos);

    float facet = clamp(dot(fn, normalize(vec3(0.35, 0.9, 0.6))), 0.0, 1.0);
    float fresnel = pow(1.0 - abs(dot(fn, viewDir)), 2.2);

    // Internal energy shimmer drifting through the lattice.
    float shimmer = 0.5 + 0.5 * sin(vWorldPos.y * 6.0 - uTime * (1.2 + uEnergy * 2.2));

    vec3 ice = vec3(0.32, 0.74, 1.0);             // holographic ice body
    vec3 frost = vec3(0.88, 0.97, 1.0);           // ice-white facet highlight
    vec3 violetRim = vec3(0.62, 0.52, 0.98);      // violet refraction accent
    vec3 body = mix(ice, frost, facet * 0.75 + shimmer * 0.2);

    vec3 col = body * (0.14 + 0.5 * uEnergy + uFlare * 0.5);
    col += uTint * fresnel * (0.38 + uEnergy * 0.62 + uFlare * 0.5);
    col += violetRim * pow(fresnel, 3.0) * (0.25 + uEnergy * 0.3);

    gl_FragColor = vec4(col, 1.0);
  }
`

const CORE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const CORE_FRAG = /* glsl */ `
  uniform float uEnergy;
  uniform float uFlare;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
    float hot = pow(facing, 2.6);
    // Warm amber intelligence heart — the only warm light in the chamber.
    vec3 col = mix(vec3(1.0, 0.52, 0.2), vec3(1.0, 0.96, 0.86), hot);
    float amp = 0.26 + uEnergy * 0.8 + uFlare * 0.9;
    gl_FragColor = vec4(col * amp, 1.0);
  }
`

/* --------------------------- Sprite textures ------------------------------ */

function radialTexture(stops: Array<[number, string]>): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    for (const [offset, color] of stops) g.addColorStop(offset, color)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

/* ------------------------------ Component --------------------------------- */

export default function ReactorCoreCanvas({
  phase,
  receiveSignal,
  reduced,
  onUnavailable,
}: {
  phase: OpusPhase
  receiveSignal: number
  reduced: boolean
  onUnavailable: () => void
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  // Live drive state read by the render loop without re-creating the scene.
  const driveRef = useRef({ energy: 0.38, tint: new THREE.Color('#67D9FF'), flare: 0 })
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  // Set by the scene effect so phase changes can repaint the static frame
  // when continuous motion is disabled.
  const frameRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const v = phaseVisual(phase)
    driveRef.current.energy = v.energy
    driveRef.current.tint = v.tint
    if (reducedRef.current) frameRef.current?.()
  }, [phase])

  // Each landed intelligence packet kicks a flare that decays in the loop.
  const lastSignal = useRef(receiveSignal)
  useEffect(() => {
    if (receiveSignal > lastSignal.current) driveRef.current.flare = 1
    lastSignal.current = receiveSignal
  }, [receiveSignal])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      onUnavailable()
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.classList.add('h-full', 'w-full')
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30)
    camera.position.set(0, 0.1, 6.2)

    /* Crystal — elongated faceted bipyramid */
    const crystalGeo = new THREE.OctahedronGeometry(1.18, 0)
    const crystalMat = new THREE.ShaderMaterial({
      vertexShader: CRYSTAL_VERT,
      fragmentShader: CRYSTAL_FRAG,
      uniforms: {
        uEnergy: { value: 0.38 },
        uFlare: { value: 0 },
        uTint: { value: new THREE.Color('#67D9FF') },
        uTime: { value: 0 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const crystal = new THREE.Mesh(crystalGeo, crystalMat)
    crystal.scale.set(0.5, 0.9, 0.5)
    scene.add(crystal)

    // Slightly larger ghost shell — soft refractive echo around the gem.
    const shellMat = crystalMat.clone()
    shellMat.uniforms.uEnergy = crystalMat.uniforms.uEnergy
    shellMat.uniforms.uFlare = crystalMat.uniforms.uFlare
    shellMat.uniforms.uTint = crystalMat.uniforms.uTint
    shellMat.uniforms.uTime = crystalMat.uniforms.uTime
    shellMat.opacity = 0.4
    const shell = new THREE.Mesh(crystalGeo, shellMat)
    shell.scale.set(0.6, 1.04, 0.6)
    scene.add(shell)

    /* Molten inner core */
    const coreGeo = new THREE.SphereGeometry(0.28, 32, 32)
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
      uniforms: {
        uEnergy: { value: 0.38 },
        uFlare: { value: 0 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    /* Glow halos — cheap bloom. The warm halo hugs the heart tightly so amber
       never bleeds past the crystal into the cool chamber. */
    const warmTex = radialTexture([
      [0, 'rgba(255, 216, 168, 0.85)'],
      [0.35, 'rgba(255, 158, 92, 0.34)'],
      [1, 'rgba(255, 140, 80, 0)'],
    ])
    const warmHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: warmTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    )
    warmHalo.scale.setScalar(2.4)
    scene.add(warmHalo)

    const tintTex = radialTexture([
      [0, 'rgba(255, 255, 255, 0.55)'],
      [0.4, 'rgba(255, 255, 255, 0.16)'],
      [1, 'rgba(255, 255, 255, 0)'],
    ])
    const tintHaloMat = new THREE.SpriteMaterial({
      map: tintTex,
      color: new THREE.Color('#67D9FF'),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const tintHalo = new THREE.Sprite(tintHaloMat)
    tintHalo.scale.setScalar(4.8)
    scene.add(tintHalo)

    /* Charge particles — an orbiting equatorial cloud */
    const PARTICLES = 360
    const positions = new Float32Array(PARTICLES * 3)
    for (let i = 0; i < PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.05 + Math.random() * 0.95
      const y = (Math.random() - 0.5) * (Math.random() < 0.75 ? 0.9 : 2)
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const dotTex = radialTexture([
      [0, 'rgba(220, 244, 255, 1)'],
      [0.4, 'rgba(125, 200, 255, 0.5)'],
      [1, 'rgba(90, 168, 255, 0)'],
    ])
    const particleMat = new THREE.PointsMaterial({
      map: dotTex,
      size: 0.07,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    /* Sizing */
    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    /* Render loop */
    let raf = 0
    let energy = driveRef.current.energy
    const tint = new THREE.Color().copy(driveRef.current.tint)
    const clock = new THREE.Clock()

    const renderFrame = () => {
      const t = clock.getElapsedTime()
      const drive = driveRef.current

      if (reducedRef.current) {
        // Static mode paints discrete frames — snap to the live state.
        energy = drive.energy
        tint.copy(drive.tint)
        drive.flare = 0
      } else {
        // Ease toward the live phase drive so state changes feel physical.
        energy += (drive.energy - energy) * 0.045
        tint.lerp(drive.tint, 0.06)
        drive.flare = Math.max(0, drive.flare - 0.022)
      }

      crystalMat.uniforms.uEnergy.value = energy
      crystalMat.uniforms.uFlare.value = drive.flare
      ;(crystalMat.uniforms.uTint.value as THREE.Color).copy(tint)
      crystalMat.uniforms.uTime.value = t
      coreMat.uniforms.uEnergy.value = energy
      coreMat.uniforms.uFlare.value = drive.flare

      const breathe = 1 + Math.sin(t * (1.1 + energy * 2.4)) * 0.05 * (0.4 + energy)
      crystal.rotation.y = t * (0.16 + energy * 0.34)
      shell.rotation.y = -t * (0.1 + energy * 0.2)
      crystal.scale.set(0.5 * breathe, 0.9 * breathe, 0.5 * breathe)
      core.scale.setScalar(breathe * (0.92 + drive.flare * 0.35))

      particles.rotation.y = t * (0.05 + energy * 0.22)
      particleMat.opacity = 0.35 + energy * 0.55

      const haloPulse = 0.5 + 0.5 * Math.sin(t * (1.1 + energy * 2.4))
      warmHalo.material.opacity = 0.18 + energy * 0.36 + haloPulse * 0.1 + drive.flare * 0.3
      tintHaloMat.color.copy(tint)
      tintHaloMat.opacity = 0.08 + energy * 0.22 + drive.flare * 0.26

      renderer.render(scene, camera)
    }

    frameRef.current = renderFrame

    const loop = () => {
      renderFrame()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      if (reducedRef.current) {
        // Static, dignified frame — no continuous motion.
        renderFrame()
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      cancelAnimationFrame(raf)
      frameRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      crystalGeo.dispose()
      coreGeo.dispose()
      particleGeo.dispose()
      crystalMat.dispose()
      shellMat.dispose()
      coreMat.dispose()
      particleMat.dispose()
      warmHalo.material.dispose()
      tintHaloMat.dispose()
      warmTex.dispose()
      tintTex.dispose()
      dotTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
    // The scene is built once; live state flows through driveRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUnavailable])

  return <div ref={mountRef} aria-hidden className="pointer-events-none absolute -inset-9 z-[2]" />
}
