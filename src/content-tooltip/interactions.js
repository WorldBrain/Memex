import React from 'react'
import ReactDOM from 'react-dom'
import { delayed } from './utils'

export function setupTooltipTrigger(callback) {
    document.body.addEventListener('mouseup', event => {
        conditionallyTriggerTooltip(
            { x: event.pageX, y: event.pageY },
            callback,
            event,
        )
    })
}

export const conditionallyTriggerTooltip = delayed(
    async (position, callback, event) => {
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
