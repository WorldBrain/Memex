import 'babel-polyfill'
import React from 'react'
import { storiesOf } from '@storybook/react'

import ProgressStepContainer from 'src/common-ui/components/progress-step-container'

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
