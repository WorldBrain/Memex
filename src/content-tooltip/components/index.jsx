import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'

export function setupUIContainer(
    target,
    { createAndCopyDirectLink, openSettings, destroyTooltip },
) {
    return new Promise(resolve => {
        ReactDOM.render(
            <TooltipContainer
                onInit={showTooltip => resolve(showTooltip)}
                destroy={destroyTooltip}
                createAndCopyDirectLink={createAndCopyDirectLink}
                openSettings={openSettings}
            />,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
