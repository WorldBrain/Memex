import 'babel-polyfill'
import React from 'react'
import { storiesOf } from '@storybook/react'

import ProgressStepContainer from 'src/common-ui/components/progress-step-container'
import OnboardingTooltip from 'src/overview/onboarding/components/onboarding-tooltip'

storiesOf('ProgressContainer', module)
    .add('No steps seen/completed', () => (
        <ProgressStepContainer totalSteps={4} onStepClick={() => undefined} />
    ))
    .add('All steps seen', () => (
        <ProgressStepContainer
            totalSteps={4}
            currentStep={4}
            onStepClick={() => undefined}
        />
    ))

storiesOf('Onboarding Tooltip', module).add('Import example', () => (
    <OnboardingTooltip
        descriptionText="Import your existing bookmarks &amp; web history from Pocket, Diigo, Raindrop.io and many more."
        CTAText="Import"
        onCTAClick={() => undefined}
        onDismiss={() => undefined}
    />
))
