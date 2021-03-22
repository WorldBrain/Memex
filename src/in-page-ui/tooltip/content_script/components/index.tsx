import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'

import TooltipContainer from './container'
import { TooltipInPageUIInterface } from 'src/in-page-ui/tooltip/types'
import { theme } from 'src/common-ui/components/design-library/theme'

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
            <ThemeProvider theme={theme}>
                <TooltipContainer
                    onInit={(showTooltip) => resolve(showTooltip)}
                    {...params}
                />
            </ThemeProvider>,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
