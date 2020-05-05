import { storiesOf } from '@storybook/react'
import ProgressStepContainer from 'src/common-ui/components/progress-step-container'
import QRCanvas from 'src/common-ui/components/qr-canvas'
import React from 'react'

storiesOf('Other', module)
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
    .add('HTML QR Code canvas short example', () => (
        <QRCanvas toEncode="test" />
    ))
    .add('HTML QR Code canvas long example', () => (
        <QRCanvas toEncode={longText} />
    ))

const longText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Dolor sed viverra ipsum nunc aliquet bibendum enim. In massa tempor nec feugiat.
Nunc aliquet bibendum enim facilisis gravida. Nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper.
Amet luctus venenatis lectus magna fringilla. Volutpat maecenas volutpat blandit aliquam etiam erat velit scelerisque in.
Egestas egestas fringilla phasellus faucibus scelerisque eleifend. Sagittis orci a scelerisque purus semper eget duis.
Nulla pharetra diam sit amet nisl suscipit. Sed adipiscing diam donec adipiscing tristique risus nec feugiat in. '
Fusce ut placerat orci nulla. Pharetra vel turpis nunc eget lorem dolor. Tristique senectus et netus et malesuada.
`
