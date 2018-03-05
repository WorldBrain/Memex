import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'

import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import Popup from './container'

render(
    <ErrorBoundary component={RuntimeError}>
        <Popup />
    </ErrorBoundary>,
    document.getElementById('popup'),
)
