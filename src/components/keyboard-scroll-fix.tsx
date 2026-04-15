'use client'

import { useEffect, useRef } from 'react'

function isInput(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

export function KeyboardScrollFix() {
  const savedScrollY = useRef(0)

  useEffect(() => {
    function onFocusIn(e: Event) {
      if (isInput(e.target)) {
        savedScrollY.current = window.scrollY
      }
    }
    function onFocusOut(e: Event) {
      if (!isInput(e.target)) return
      const y = savedScrollY.current
      // Wait briefly to check if focus moved to another input
      setTimeout(() => {
        if (!isInput(document.activeElement)) {
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 100)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return null
}
