import React from 'react'
import ReactDOM from 'react-dom'
import retargetEvents from 'react-shadow-dom-retarget-events'
import ToolbarNotification from './container'

export function setupUIContainer(
    target,
    {
        type,
        shadow,
        position,
        onCloseRequested,
    }: {
        type: string
        shadow: HTMLElement
        position: any
        onCloseRequested: () => void
    },
) {
    retargetEvents(shadow)
    return new Promise(async resolve => {
        ReactDOM.render(
            <ToolbarNotification
                type={type}
                onCloseRequested={onCloseRequested}
                position={position}
            />,
            target,
        )
        resolve()
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
