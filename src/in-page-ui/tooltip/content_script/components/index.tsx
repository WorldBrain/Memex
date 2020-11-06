import React from 'react'
import ReactDOM from 'react-dom'
import TooltipContainer from './container'
import { TooltipInPageUIInterface } from 'src/in-page-ui/tooltip/types'

export function setupUIContainer(
    target,
    params: {
        inPageUI: TooltipInPageUIInterface
        createAndCopyDirectLink: any
        openSettings: any
        destroyTooltip: any
        createAnnotation: any
        createHighlight: any
    },
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <TooltipContainer
                onInit={(showTooltip) => resolve(showTooltip)}
                {...params}
            />,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
