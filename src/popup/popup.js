import React from 'react'
import { render } from 'react-dom'
import Raven from 'raven-js'

import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import Popup from './container'

if (process.env.SENTRY_DSN && process.env.SENTRY_DSN.length) {
    Raven.config(process.env.SENTRY_DSN).install()
}

render(
    <ErrorBoundary component={RuntimeError}>
        <Popup />
    </ErrorBoundary>,
    document.getElementById('popup'),
)
