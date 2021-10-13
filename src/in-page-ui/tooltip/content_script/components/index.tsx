import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'

import TooltipContainer, { Props } from './container'
import { theme } from 'src/common-ui/components/design-library/theme'

export function setupUIContainer(
    target: Element,
    params: Omit<Props, 'onInit'>,
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
