'use client'

import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import { pageVariants, itemVariants, listVariants, statVariants, headerVariants } from '@/lib/motion'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

// Wraps the whole page — orchestrates stagger for all AnimatedItem children
export function AnimatedPage({ children, className, style }: Props) {
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="show" className={className} style={style}>
      {children}
    </motion.div>
  )
}

// A single card / section that slides up on enter
export function AnimatedItem({ children, className, style }: Props) {
  return (
    <motion.div variants={itemVariants} className={className} style={style}>
      {children}
    </motion.div>
  )
}

// Stagger container for a list of AnimatedItem children
export function AnimatedList({ children, className, style }: Props) {
  return (
    <motion.div variants={listVariants} initial="hidden" animate="show" className={className} style={style}>
      {children}
    </motion.div>
  )
}

// Stat card — slight scale + slide
export function AnimatedStat({ children, className, style }: Props) {
  return (
    <motion.div variants={statVariants} className={className} style={style}>
      {children}
    </motion.div>
  )
}

// Page header
export function AnimatedHeader({ children, className, style }: Props) {
  return (
    <motion.div variants={headerVariants} className={className} style={style}>
      {children}
    </motion.div>
  )
}
