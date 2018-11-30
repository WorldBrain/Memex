import React from 'react'
import ReactDOM from 'react-dom'
import ToolbarNotification from './container'

export function setupUIContainer(
    target,
    { type, onCloseRequested }: { type: string; onCloseRequested: () => void },
) {
    return new Promise(async resolve => {
        ReactDOM.render(
            <ToolbarNotification
                type={type}
                onCloseRequested={onCloseRequested}
            />,
            target,
        )
        resolve()
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
