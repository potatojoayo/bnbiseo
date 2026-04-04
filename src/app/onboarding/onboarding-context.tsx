'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

type PanelStep = 1 | 2 | 3
type WizardStep = 'ask' | 'airbnb-url' | 'manual-address' | 'register'

type OnboardingState = {
  wizardStep: WizardStep
  step2Path: 'airbnb-url' | 'manual-address'
  maxReachedPanel: PanelStep
  airroiDetail: unknown | null
  manualAddress: { zonecode: string; address: string; addressDetail: string } | null
}

type OnboardingContextType = {
  panelStep: PanelStep
  maxReachedPanel: PanelStep
  wizardStep: WizardStep
  goTo: (ws: WizardStep) => void
  goToPanel: (ps: PanelStep) => void
  savedState: OnboardingState | null
  saveProgress: (data: Partial<Omit<OnboardingState, 'wizardStep' | 'step2Path' | 'maxReachedPanel'>>) => void
  clearProgress: () => void
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

const STORAGE_KEY = 'bnbiseo-onboarding'

const WIZARD_TO_PANEL: Record<WizardStep, PanelStep> = {
  'ask': 1,
  'airbnb-url': 2,
  'manual-address': 2,
  'register': 3,
}

const VALID_WIZARD_STEPS: WizardStep[] = ['ask', 'airbnb-url', 'manual-address', 'register']

function loadState(): OnboardingState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OnboardingState
    if (!VALID_WIZARD_STEPS.includes(parsed.wizardStep)) return null
    return parsed
  } catch {
    return null
  }
}

function persistState(state: OnboardingState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const initial = useRef<OnboardingState | null>(null)

  const [wizardStep, setWizardStep] = useState<WizardStep>('ask')
  const [maxReachedPanel, setMaxReachedPanel] = useState<PanelStep>(1)
  const step2Path = useRef<'airbnb-url' | 'manual-address'>('airbnb-url')
  const extraData = useRef<Partial<Omit<OnboardingState, 'wizardStep' | 'step2Path' | 'maxReachedPanel'>>>({})

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      initial.current = saved
      setWizardStep(saved.wizardStep)
      setMaxReachedPanel(saved.maxReachedPanel ?? WIZARD_TO_PANEL[saved.wizardStep])
      step2Path.current = saved.step2Path
      extraData.current = {
        airroiDetail: saved.airroiDetail,
        manualAddress: saved.manualAddress,
      }
    }
    setReady(true)
  }, [])

  // Update maxReached + persist on change
  useEffect(() => {
    if (!ready) return
    const current = WIZARD_TO_PANEL[wizardStep]
    setMaxReachedPanel((prev) => {
      const next = Math.max(prev, current) as PanelStep
      persistState({
        wizardStep,
        step2Path: step2Path.current,
        maxReachedPanel: next,
        airroiDetail: extraData.current.airroiDetail ?? null,
        manualAddress: extraData.current.manualAddress ?? null,
      })
      return next
    })
  }, [wizardStep, ready])

  function goTo(ws: WizardStep) {
    if (ws === 'airbnb-url' || ws === 'manual-address') {
      step2Path.current = ws
    }
    setWizardStep(ws)
  }

  function goToPanel(ps: PanelStep) {
    if (ps === 1) setWizardStep('ask')
    else if (ps === 2) setWizardStep(step2Path.current)
    else setWizardStep('register')
  }

  function saveProgress(data: Partial<Omit<OnboardingState, 'wizardStep' | 'step2Path' | 'maxReachedPanel'>>) {
    extraData.current = { ...extraData.current, ...data }
    persistState({
      wizardStep,
      step2Path: step2Path.current,
      maxReachedPanel,
      airroiDetail: extraData.current.airroiDetail ?? null,
      manualAddress: extraData.current.manualAddress ?? null,
    })
  }

  function clearProgress() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  if (!ready) return null

  return (
    <OnboardingContext.Provider
      value={{
        panelStep: WIZARD_TO_PANEL[wizardStep],
        maxReachedPanel,
        wizardStep,
        goTo,
        goToPanel,
        savedState: initial.current,
        saveProgress,
        clearProgress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
