import 'babel-polyfill'
import React from 'react'
import { storiesOf } from '@storybook/react'

import ProgressStepContainer from 'src/common-ui/components/progress-step-container'
import OnboardingRibbonSettings from '../../overview/onboarding/components/onboarding-ribbon-settings'

storiesOf('ProgressContainer', module)
    .add('No steps seen/completed', () => (
        <ProgressStepContainer totalSteps={4} />
    ))
    .add('All steps seen', () => (
        <ProgressStepContainer totalSteps={4} currentStep={4} />
    ))

storiesOf('Settings', module).add(
    'Ribbon settings as seen on the onboarding screens',
    () => <OnboardingRibbonSettings />,
)
