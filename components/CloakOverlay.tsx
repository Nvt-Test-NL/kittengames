"use client"

import { useState, useEffect, useCallback } from "react"

interface CloakOverlayProps {
  isEnabled: boolean
  overlayContent: {
    title: string
    favicon: string
    type?: 'html' | 'image'
    html?: string
    image?: string
    backgroundColor?: string
    textColor?: string
  fillMode?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none'
  }
}

export default function CloakOverlay({ isEnabled, overlayContent }: CloakOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  const handleMouseOut = useCallback((e: MouseEvent) => {
    // Show overlay when cursor leaves window (like the provided HTML example)
    if (!e.relatedTarget && !(e as any).toElement) {
      if (isEnabled) {
        setShowOverlay(true)

        // Apply tab cloaking
        document.title = overlayContent.title
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
        if (favicon) {
          favicon.href = overlayContent.favicon
        } else {
          const newFavicon = document.createElement("link")
          newFavicon.rel = "icon"
          newFavicon.href = overlayContent.favicon
          document.head.appendChild(newFavicon)
        }
      }
    }
  }, [isEnabled, overlayContent])

  const handleClick = useCallback(() => {
    // Hide overlay on click
    if (showOverlay) {
      setShowOverlay(false)

      // Restore original tab title and favicon
      const originalTitle = localStorage.getItem("originalTabTitle") || document.title
      const originalFavicon = localStorage.getItem("originalTabFavicon") || "/favicon.ico"

      document.title = originalTitle
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
      if (favicon) {
        favicon.href = originalFavicon
      }
    }
  }, [showOverlay])

  useEffect(() => {
    // Store original title and favicon once
    const originalTitle = document.title
    const originalFavicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') || "/favicon.ico"

    localStorage.setItem("originalTabTitle", originalTitle)
    localStorage.setItem("originalTabFavicon", originalFavicon)

    if (isEnabled) {
      document.body.addEventListener("mouseout", handleMouseOut)
      document.addEventListener("click", handleClick)
    }

    return () => {
      document.body.removeEventListener("mouseout", handleMouseOut)
      document.removeEventListener("click", handleClick)
    }
  }, [isEnabled, handleMouseOut, handleClick])

  if (!showOverlay) return null

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        backgroundColor: overlayContent.backgroundColor || '#ffffff',
        color: overlayContent.textColor || '#333333',
        visibility: showOverlay ? "visible" : "hidden",
      }}
    >
      {overlayContent.type === 'image' && overlayContent.image ? (
        <img
          src={overlayContent.image}
          alt={overlayContent.title || 'Overlay'}
          className={`w-full h-full ${
            overlayContent.fillMode === 'cover' ? 'object-cover' :
            overlayContent.fillMode === 'fill' ? 'object-fill' :
            overlayContent.fillMode === 'scale-down' ? 'object-scale-down' :
            overlayContent.fillMode === 'none' ? 'object-none' : 'object-contain'
          }`}
          loading="eager"
        />
      ) : (
        <div
          className="w-full h-full overflow-auto p-6"
          dangerouslySetInnerHTML={{ __html: overlayContent.html || '' }}
        />
      )}
    </div>
  )
}
