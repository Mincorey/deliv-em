import type { Variants } from 'framer-motion'

// Page wrapper — quick fade + tiny lift
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07 },
  },
}

// Individual card / section
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// Stagger container (no own animation — just orchestrates children)
export const listVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

// Stat card — scales up slightly from 95%
export const statVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// Header — fades in fast
export const headerVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
