import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'

import { ErrorBoundary, RuntimeError } from 'src/common-ui/components'
import Sidebar from './container'

render(
    <ErrorBoundary component={RuntimeError}>
        <Sidebar />
    </ErrorBoundary>,
    document.getElementById('app'),
)
