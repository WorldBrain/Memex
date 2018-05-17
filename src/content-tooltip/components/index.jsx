import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'

export function setupUIContainer(
    target,
    { createAndCopyDirectLink, openSettings, destroyTooltip, createAnnotation },
) {
    return new Promise(resolve => {
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

ReactDOM.render(<Container {...state} />, target)
}
