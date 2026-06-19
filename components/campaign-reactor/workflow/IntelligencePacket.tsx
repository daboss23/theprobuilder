'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { Point } from './AgentConnectionPath'

/**
 * A small labelled intelligence packet that travels from an agent into OPUS
 * (or from OPUS out to the output panel). Positioned absolutely within the
 * workflow stage and animated along an eased translate between the two
 * measured anchors. Rendered only on desktop with motion enabled; the finding
 * itself always lands as text in the Emerging Strategy panel regardless.
 */
export function IntelligencePacket({
  from,
  to,
  label,
  colorClass,
  opus,
  onDone,
}: {
  from: Point
  to: Point
  label: string
  colorClass?: string
  opus?: boolean
  onDone: () => void
}) {
  return (
    <motion.div
      className={cn('packet-chip', colorClass, opus && 'packet-chip--opus')}
      initial={{ x: from.x, y: from.y, opacity: 0, scale: 0.55 }}
      animate={{
        x: to.x,
        y: to.y,
        opacity: [0, 1, 1, 0],
        scale: [0.55, 1, 1, 0.82],
      }}
      transition={{ duration: 1.15, ease: [0.4, 0, 0.2, 1], times: [0, 0.18, 0.78, 1] }}
      onAnimationComplete={onDone}
    >
      {label}
    </motion.div>
  )
}
