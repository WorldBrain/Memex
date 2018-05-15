import React from 'react'
import ReactDOM from 'react-dom'
import Container from './container'

export default function renderUI(target) {
    const state = {
        // tooltipPosition: null,
        tooltipPosition: { x: 200, y: 200 },
        linkCreation: 'pristine',
        // linkCreation: 'running',
        // linkCreation: 'success',
        // linkCreation: 'failed',
        linkUrl: null,
        // linkUrl: 'http://staging.memex.link/aaaaa/www.test.com/foo/bar/spam/eggs',
    }

    ReactDOM.render(<Container {...state} />, target)
}
