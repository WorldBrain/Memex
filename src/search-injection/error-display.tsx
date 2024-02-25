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
import * as constants from './constants'

type RootProps = Pick<
    ErrorNotificationProps,
    'blockedBackground' | 'width' | 'positioning' | 'title' | 'errorMessage'
> & {
    rootEl: HTMLElement
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

    render() {
        if (!this.state.themeVariant) {
            return null
        }

        return (
            <StyleSheetManager target={this.props.rootEl}>
                <ThemeProvider
                    theme={theme({ variant: this.state.themeVariant })}
                >
                    <ErrorNotification
                        closeComponent={() => this.props.rootEl.remove()}
                        getPortalRoot={() => this.props.rootEl}
                        {...this.props}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export type ErrorDisplayProps = Omit<RootProps, 'rootEl'>

export const renderErrorDisplay = (props: ErrorDisplayProps): void => {
    const existingRoot = document.getElementById(
        constants.REACT_ROOTS.errorDisplay,
    )
    if (existingRoot) {
        existingRoot.remove()
    }
    const root = document.createElement('div')
    root.setAttribute('id', constants.REACT_ROOTS.errorDisplay)

    const renderComponent = () => {
        document.body.appendChild(root)
        ReactDOM.render(<Root rootEl={root} {...props} />, root)
    }

    renderComponent()
}
