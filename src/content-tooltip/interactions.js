import React from 'react'
import ReactDOM from 'react-dom'

import Container from './components/container'
import { delayed } from './utils'

export function setupUIContainer(target) {
    return new Promise(resolve => {
        ReactDOM.render(
            <Container onInit={showTooltip => resolve(showTooltip)} />,
            target,
        )
    })
}

export function setupTooltipTrigger(callback) {
    document.body.addEventListener('mouseup', event => {
        conditionallyTriggerTooltip(
            { x: event.clientX, y: event.clientY },
            callback,
        )
    })
}

export const conditionallyTriggerTooltip = delayed(
    async (position, callback) => {
        if (!userSelectedText()) {
            return
        }

        callback(position)
    },
    300,
)

function userSelectedText() {
    const selection = document.getSelection()
    const userSelectedText = !!selection && !selection.isCollapsed
    return userSelectedText
}
