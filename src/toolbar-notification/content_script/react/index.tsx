import React from 'react'
import { createRoot } from 'react-dom/client'
// import retargetEvents from 'react-shadow-dom-retarget-events'
import ToolbarNotification from './container'

export function setupUIContainer(
    target,
    {
        type,
        shadow,
        onCloseRequested,
        extraProps,
    }: {
        type: string
        shadow: HTMLElement
        onCloseRequested: () => void
        extraProps: any
    },
) {
    // retargetEvents(shadow)
    return new Promise<void>((resolve) => {
        const root = createRoot(target)
        root.render(
            <ToolbarNotification
                type={type}
                onCloseRequested={onCloseRequested}
                {...extraProps}
            />,
        )
        resolve()
    })
}

export function destroyUIContainer(target) {
    // unmount handled by container removal or caller
}
