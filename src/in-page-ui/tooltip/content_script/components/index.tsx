import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'

export function setupUIContainer(
    target,
    {
        createAndCopyDirectLink,
        openSettings,
        destroyTooltip,
        createAnnotation,
        createHighlight,
    },
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <TooltipContainer
                onInit={(showTooltip) => resolve(showTooltip)}
                destroy={destroyTooltip}
                createAndCopyDirectLink={createAndCopyDirectLink}
                createAnnotation={createAnnotation}
                createHighlight={createHighlight}
                openSettings={openSettings}
            />,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
