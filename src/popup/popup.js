import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'

import initSentry from '../util/raven'
import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import Popup from './container'

initSentry()

render(
    <ErrorBoundary component={RuntimeError}>
        <Popup />
    </ErrorBoundary>,
    document.getElementById('app'),
)
