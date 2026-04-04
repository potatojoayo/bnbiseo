'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export function TopLoader() {
  return (
    <AppProgressBar
      color="#FF385C"
      height="3px"
      shallowRouting
      options={{ showSpinner: false, easing: 'ease', speed: 200 }}
    />
  )
}
