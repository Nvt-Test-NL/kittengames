"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/legacy/image"

interface CloakOverlayProps {
  isEnabled: boolean
  overlayContent: {
    title: string
    favicon: string
    pageContent: string
    backgroundColor: string
    textColor: string
  }
}

export default function CloakOverlay({ isEnabled, overlayContent }: CloakOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  const handleMouseOut = useCallback((e: MouseEvent) => {
    // Show overlay when cursor leaves window (same logic as HTML example)
    if (!e.relatedTarget && !(e as any).toElement) {
      if (isEnabled) {
        setShowOverlay(true)
        
        // Apply tab cloaking
        document.title = overlayContent.title
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
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
    // Hide overlay only when user clicks (same as HTML example)
    if (showOverlay) {
      setShowOverlay(false)
      
      // Restore original tab title and favicon
      const originalTitle = localStorage.getItem("originalTabTitle") || "KittenGames"
      const originalFavicon = localStorage.getItem("originalTabFavicon") || "/favicon.ico"
      
      document.title = originalTitle
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) {
        favicon.href = originalFavicon
      }
    }
  }, [showOverlay])

  useEffect(() => {
    // Store original title and favicon when component mounts
    const originalTitle = document.title
    const originalFavicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') || "/favicon.ico"
    
    localStorage.setItem("originalTabTitle", originalTitle)
    localStorage.setItem("originalTabFavicon", originalFavicon)

    if (isEnabled) {
      // Use mouseout on document.body like the HTML example
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
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[9999]"
      style={{
        backgroundColor: overlayContent.backgroundColor,
        color: overlayContent.textColor,
        visibility: showOverlay ? "visible" : "hidden",
      }}
    >
      {/* Mock browser interface */}
      <div className="w-full h-full flex flex-col">
        {/* Browser tab bar */}
        <div className="bg-gray-200 border-b border-gray-300 px-4 py-2 flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-t-lg px-3 py-1 max-w-xs">
            {overlayContent.favicon && (
              <div className="flex-shrink-0 w-4 h-4 relative">
                <Image
                  src={overlayContent.favicon}
                  alt="Tab Icon"
                  layout="fill"
                  objectFit="contain"
                  className="rounded-sm"
                />
              </div>
            )}
            <span className="text-sm text-gray-700 truncate">
              {overlayContent.title}
            </span>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        {/* Browser address bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-2">
          <div className="bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-600">
            🔒 https://{overlayContent.title.toLowerCase().replace(/\s+/g, '')}.com
          </div>
        </div>

        {/* Page content */}
        <div 
          className="flex-1 p-8 overflow-auto flex items-center justify-center"
          style={{
            backgroundColor: overlayContent.backgroundColor,
            color: overlayContent.textColor,
          }}
        >
          <div 
            className="max-w-4xl mx-auto text-center"
            style={{ fontSize: "2rem" }}
            dangerouslySetInnerHTML={{ __html: overlayContent.pageContent }}
          />
        </div>
      </div>
    </div>
  )
}
