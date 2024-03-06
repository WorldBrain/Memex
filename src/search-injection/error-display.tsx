import React from 'react'
import ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import {
    ErrorNotification,
    ErrorNotificationProps,
} from '@worldbrain/memex-common/lib/common-ui/components/error-notification'
import { createInPageUI } from 'src/in-page-ui/utils'

type RootProps = Pick<
    ErrorNotificationProps,
    'blockedBackground' | 'width' | 'positioning' | 'title' | 'errorMessage'
> & {
    rootEl: HTMLElement
    shadowRoot: ShadowRoot
}

interface RootState {
    themeVariant: MemexThemeVariant | null
}

class Root extends React.PureComponent<RootProps, RootState> {
    static defaultProps: Pick<
        RootProps,
        'blockedBackground' | 'positioning'
    > = {
        positioning: 'centerCenter',
        blockedBackground: true,
    }

    state: RootState = { themeVariant: null }

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    private removeRoot = () => {
        const unmountResult = ReactDOM.unmountComponentAtNode(this.props.rootEl)
        if (unmountResult) {
            this.props.rootEl.remove()
        }
    }

    render() {
        if (!this.state.themeVariant) {
            return null
        }
        const { rootEl, shadowRoot, ...props } = this.props
        const memexTheme = theme({ variant: this.state.themeVariant })

        return (
            <StyleSheetManager target={shadowRoot as any}>
                <ThemeProvider theme={memexTheme}>
                    <ErrorNotification
                        closeComponent={this.removeRoot}
                        getPortalRoot={() => rootEl}
                        {...props}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export type ErrorDisplayProps = Omit<RootProps, 'rootEl' | 'shadowRoot'>

export const renderErrorDisplay = (props: ErrorDisplayProps): void => {
    const { rootElement, shadowRoot } = createInPageUI('error-display')
    ReactDOM.render(
        <Root rootEl={rootElement} shadowRoot={shadowRoot} {...props} />,
        rootElement,
    )
}
