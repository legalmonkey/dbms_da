import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import {
  Children,
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/Button'
import './Stepper.css'

/**
 * React Bits Stepper, adapted.
 * Upstream: https://reactbits.dev/r/Stepper-TS-CSS.json
 *
 * Changes from upstream, each for a clinical-form reason:
 *   - `canAdvance` gate. Upstream advances unconditionally, so a registration
 *     form could reach the review step with invalid fields. Continue and
 *     Complete now wait for the gate, which may be async (the final step uses
 *     it to submit, and only completes once the save succeeds).
 *   - Step indicators are real <button>s with labels and aria-current. Upstream
 *     rendered clickable <div>s that a keyboard could not reach. Indicators
 *     only navigate backwards, so a step can never be skipped past validation.
 *   - Footer uses the design-system Button (loading state, focus ring, 4px
 *     radius) instead of upstream's pill-shaped purple button.
 *   - A polite live region announces "Step 2 of 3: Contact numbers", and focus
 *     moves to the new step so screen-reader and keyboard users keep their place.
 *   - The slide respects prefers-reduced-motion.
 */

interface StepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  /** Resolve true to allow leaving `step`. Runs for Continue and Complete. */
  canAdvance?: (step: number) => boolean | Promise<boolean>
  /** Human names for each step, used by indicators and the announcement. */
  stepLabels?: string[]
  stepCircleContainerClassName?: string
  stepContainerClassName?: string
  contentClassName?: string
  footerClassName?: string
  backButtonText?: string
  nextButtonText?: string
  completeButtonText?: string
  disableStepIndicators?: boolean
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  canAdvance,
  stepLabels = [],
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Complete',
  disableStepIndicators = false,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState(0)
  const [advancing, setAdvancing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const hasInteracted = useRef(false)

  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps
  const labelFor = (step: number) => stepLabels[step - 1] ?? `Step ${step}`

  const updateStep = (newStep: number) => {
    hasInteracted.current = true
    setCurrentStep(newStep)
    if (newStep > totalSteps) onFinalStepCompleted()
    else onStepChange(newStep)
  }

  // Keep keyboard and screen-reader users anchored on the step they moved to.
  useEffect(() => {
    if (!hasInteracted.current || isCompleted) return
    contentRef.current?.focus({ preventScroll: true })
  }, [currentStep, isCompleted])

  const gate = async () => {
    if (!canAdvance) return true
    setAdvancing(true)
    try {
      return await canAdvance(currentStep)
    } finally {
      setAdvancing(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (isLastStep || advancing) return
    if (!(await gate())) return
    setDirection(1)
    updateStep(currentStep + 1)
  }

  const handleComplete = async () => {
    if (advancing) return
    if (!(await gate())) return
    setDirection(1)
    updateStep(totalSteps + 1)
  }

  return (
    <div className="outer-container" {...rest}>
      <div className={`step-circle-container ${stepCircleContainerClassName}`}>
        <ol className={`step-indicator-row ${stepContainerClassName}`} aria-label="Progress">
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1
            return (
              <Fragment key={stepNumber}>
                <li className="contents">
                  <StepIndicator
                    step={stepNumber}
                    label={labelFor(stepNumber)}
                    currentStep={currentStep}
                    disabled={disableStepIndicators}
                    onClickStep={(clicked) => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    }}
                  />
                </li>
                {index < totalSteps - 1 ? (
                  <li className="contents" aria-hidden="true">
                    <StepConnector isComplete={currentStep > stepNumber} />
                  </li>
                ) : null}
              </Fragment>
            )
          })}
        </ol>

        {!isCompleted ? (
          <p aria-live="polite" className="px-5 pt-3 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
            Step {currentStep} of {totalSteps}: {labelFor(currentStep)}
          </p>
        ) : null}

        <StepContentWrapper
          ref={contentRef}
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`step-content-default ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted ? (
          <div className={`footer-container ${footerClassName}`}>
            <div className={`footer-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
              {currentStep !== 1 ? (
                <Button type="button" onClick={handleBack} disabled={advancing}>
                  {backButtonText}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                onClick={() => void (isLastStep ? handleComplete() : handleNext())}
                loading={advancing}
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface StepContentWrapperProps {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: ReactNode
  className?: string
  ref?: React.Ref<HTMLDivElement>
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className,
  ref,
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState(0)
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      className={`${className} outline-none`}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted ? (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={setParentHeight}>
            {children}
          </SlideTransition>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  // Re-measure whenever the content changes size, e.g. when a validation
  // message appears under a field, not only when the step first mounts.
  useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return
    onHeightReady(node.offsetHeight)
    const observer = new ResizeObserver(() => onHeightReady(node.offsetHeight))
    observer.observe(node)
    return () => observer.disconnect()
  }, [onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={reducedMotion ? fadeVariants : stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? '50%' : '-50%', opacity: 0 }),
}

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export function Step({ children }: { children: ReactNode }) {
  return <div className="step-default">{children}</div>
}

function StepIndicator({
  step,
  label,
  currentStep,
  onClickStep,
  disabled,
}: {
  step: number
  label: string
  currentStep: number
  onClickStep: (step: number) => void
  disabled?: boolean
}) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete'
  // Backwards only: a completed step can be revisited, a future one cannot be
  // reached without passing the gate on every step before it.
  const clickable = !disabled && status === 'complete'
  const stateText = status === 'complete' ? 'completed' : status === 'active' ? 'current' : 'not started'

  return (
    <button
      type="button"
      className="step-indicator"
      data-status={status}
      data-clickable={clickable}
      aria-current={status === 'active' ? 'step' : undefined}
      aria-label={`Step ${step}, ${label}, ${stateText}`}
      aria-disabled={!clickable}
      tabIndex={clickable || status === 'active' ? 0 : -1}
      onClick={() => {
        if (clickable) onClickStep(step)
      }}
    >
      <span className="step-indicator-inner">
        {status === 'complete' ? (
          <CheckIcon className="check-icon" />
        ) : status === 'active' ? (
          <span className="active-dot" />
        ) : (
          <span className="step-number">{step}</span>
        )}
      </span>
    </button>
  )
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const reducedMotion = useReducedMotion()
  return (
    <div className="step-connector">
      <motion.div
        className="step-connector-inner"
        initial={false}
        animate={{ width: isComplete ? '100%' : '0%' }}
        transition={{ duration: reducedMotion ? 0 : 0.4 }}
      />
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
