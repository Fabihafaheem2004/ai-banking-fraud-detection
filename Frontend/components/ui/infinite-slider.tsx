"use client"

import { useEffect, useRef, useState } from "react"

interface InfiniteSliderProps {
  children: React.ReactNode[]
  duration?: number
  durationOnHover?: number
  gap?: number
}

export function InfiniteSlider({
  children,
  duration = 40,
  durationOnHover = 20,
  gap = 112,
}: InfiniteSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth

    let currentScroll = 0
    let animationId: number

    const animate = () => {
      const currentDuration = isHovering ? durationOnHover : duration
      const speed = scrollWidth / (currentDuration * 60) // 60fps

      currentScroll += speed

      if (currentScroll >= scrollWidth / 2) {
        currentScroll = 0
      }

      container.scrollLeft = currentScroll
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [duration, durationOnHover, isHovering])

  return (
    <div
      ref={containerRef}
      className="flex overflow-hidden"
      style={{ gap: `${gap}px` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {children}
    </div>
  )
}
