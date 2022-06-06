import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import TooltipContainer, { Props } from './container'
import { theme } from 'src/common-ui/components/design-library/theme'
import type { InPageUIRootMount } from 'src/in-page-ui/types'

export function setupUIContainer(
    mount: InPageUIRootMount,
    params: Omit<Props, 'onInit'>,
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <StyleSheetManager target={mount.shadowRoot as any}>
                <ThemeProvider theme={theme}>
                    <TooltipContainer
                        onInit={(showTooltip) => resolve(showTooltip)}
                        {...params}
                    />
                </ThemeProvider>
            </StyleSheetManager>,
            mount.rootElement,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
