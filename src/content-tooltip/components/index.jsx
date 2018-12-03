import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'

export function setupUIContainer(
    target,
    { createAndCopyDirectLink, openSettings, destroyTooltip, createAnnotation },
) {
    return new Promise(async resolve => {
        ReactDOM.render(
            <TooltipContainer
                onInit={showTooltip => resolve(showTooltip)}
                destroy={destroyTooltip}
                createAndCopyDirectLink={createAndCopyDirectLink}
                createAnnotation={createAnnotation}
                openSettings={openSettings}
            />,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
