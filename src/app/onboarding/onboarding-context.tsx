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
  // savedUrl persists the URL input so going back/forward doesn't lose it
  savedUrl: string
}

type OnboardingContextType = {
  panelStep: PanelStep
  maxReachedPanel: PanelStep
  wizardStep: WizardStep
  savedUrl: string
  goTo: (ws: WizardStep, opts?: { resetFromStep1?: boolean }) => void
  goToPanel: (ps: PanelStep) => void
  savedState: OnboardingState | null
  saveProgress: (data: Partial<Omit<OnboardingState, 'wizardStep' | 'step2Path' | 'maxReachedPanel'>>) => void
  clearProgress: () => void
  resetAll: () => void
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
  // pendingMaxReset: when true, the next wizardStep effect should reset maxReachedPanel to 1
  const pendingMaxReset = useRef(false)
  // cleared: when true, prevent persist effect from re-writing cleared localStorage
  const cleared = useRef(false)

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
        savedUrl: saved.savedUrl ?? '',
      }
    }
    setReady(true)
  }, [])

  // Update maxReached + persist on wizardStep change
  useEffect(() => {
    if (!ready || cleared.current) return
    const current = WIZARD_TO_PANEL[wizardStep]

    if (pendingMaxReset.current) {
      // Step 1 re-selection: always reset maxReachedPanel back to 1
      // so that the user cannot skip to step 3 via the panel after changing their answer.
      pendingMaxReset.current = false
      setMaxReachedPanel(1)
      persistState({
        wizardStep,
        step2Path: step2Path.current,
        maxReachedPanel: 1,
        airroiDetail: extraData.current.airroiDetail ?? null,
        manualAddress: extraData.current.manualAddress ?? null,
        savedUrl: extraData.current.savedUrl ?? '',
      })
    } else {
      setMaxReachedPanel((prev) => {
        const next = Math.max(prev, current) as PanelStep
        persistState({
          wizardStep,
          step2Path: step2Path.current,
          maxReachedPanel: next,
          airroiDetail: extraData.current.airroiDetail ?? null,
          manualAddress: extraData.current.manualAddress ?? null,
          savedUrl: extraData.current.savedUrl ?? '',
        })
        return next
      })
    }
  }, [wizardStep, ready])

  function goTo(ws: WizardStep, opts?: { resetFromStep1?: boolean }) {
    cleared.current = false
    if (ws === 'airbnb-url' || ws === 'manual-address') {
      step2Path.current = ws
    }
    if (opts?.resetFromStep1) {
      // Clear all accumulated data and force maxReachedPanel back to 1
      extraData.current = { savedUrl: '', airroiDetail: null, manualAddress: null }
      pendingMaxReset.current = true
    }
    setWizardStep(ws)
  }

  function goToPanel(ps: PanelStep) {
    if (ps === 1) {
      setWizardStep('ask')
    } else if (ps === 2) {
      setWizardStep(step2Path.current)
    } else {
      // Panel step 3 is only reachable when we have data from step 2
      const hasData =
        extraData.current.airroiDetail != null || extraData.current.manualAddress != null
      if (!hasData) return
      setWizardStep('register')
    }
  }

  function saveProgress(data: Partial<Omit<OnboardingState, 'wizardStep' | 'step2Path' | 'maxReachedPanel'>>) {
    extraData.current = { ...extraData.current, ...data }
    // Read maxReachedPanel from state via a functional approach is not possible here,
    // so we persist with the current value (maxReachedPanel state is always up-to-date
    // by the time saveProgress is called — it's called after user completes step 2).
    persistState({
      wizardStep,
      step2Path: step2Path.current,
      maxReachedPanel,
      airroiDetail: extraData.current.airroiDetail ?? null,
      manualAddress: extraData.current.manualAddress ?? null,
      savedUrl: extraData.current.savedUrl ?? '',
    })
  }

  function clearProgress() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    extraData.current = { savedUrl: '', airroiDetail: null, manualAddress: null }
    cleared.current = true
  }

  function resetAll() {
    clearProgress()
    step2Path.current = 'airbnb-url'
    setWizardStep('ask')
    setMaxReachedPanel(1)
  }

  if (!ready) return null

  return (
    <OnboardingContext.Provider
      value={{
        panelStep: WIZARD_TO_PANEL[wizardStep],
        maxReachedPanel,
        wizardStep,
        savedUrl: (extraData.current.savedUrl as string) ?? '',
        goTo,
        goToPanel,
        savedState: initial.current,
        saveProgress,
        clearProgress,
        resetAll,
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
