import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import TooltipContainer, {
    Props,
} from '@worldbrain/memex-common/lib/in-page-ui/tooltip/container'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import type { InPageUIRootMount } from 'src/in-page-ui/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

interface TooltipRootProps {
    mount: InPageUIRootMount
    params: Omit<Props, 'onTooltipInit'>
    onTooltipInit: (showTooltip: () => void) => void
}

interface TooltipRootState {
    themeVariant?: MemexThemeVariant
}

class TooltipRoot extends React.Component<TooltipRootProps, TooltipRootState> {
    state: TooltipRootState = {}

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    render() {
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }
        const { props } = this

        return (
            <StyleSheetManager target={props.mount.shadowRoot as any}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
                    <TooltipContainer
                        onTooltipInit={props.onTooltipInit}
                        {...props.params}
                        context="extension"
                        getRootElement={() => props.mount.rootElement}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export function setupUIContainer(
    mount: InPageUIRootMount,
    params: Omit<Props, 'onTooltipInit'>,
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <TooltipRoot
                mount={mount}
                params={params}
                onTooltipInit={resolve}
            />,
            mount.rootElement,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}
