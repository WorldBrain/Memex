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

const REACT_ROOT_ID = '__MEMEX-ERROR-ROOT'

type RootProps = Pick<
    ErrorNotificationProps,
    'blockedBackground' | 'width' | 'positioning' | 'title' | 'errorMessage'
> & {
    rootEl: HTMLElement
}

interface RootState {
    themeVariant: MemexThemeVariant | null
    show: boolean
}

class Root extends React.PureComponent<RootProps, RootState> {
    static defaultProps: Pick<
        RootProps,
        'blockedBackground' | 'positioning'
    > = {
        positioning: 'centerCenter',
        blockedBackground: true,
    }

    state: RootState = { themeVariant: null, show: true }

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    render() {
        const { themeVariant, show } = this.state
        if (!themeVariant || !show) {
            return null
        }

        return (
            <StyleSheetManager target={this.props.rootEl}>
                <ThemeProvider theme={theme({ variant: themeVariant })}>
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

export const renderErrorDisplay = async (
    props: ErrorDisplayProps,
): Promise<void> => {
    const existingRoot = document.getElementById(REACT_ROOT_ID)
    if (existingRoot) {
        existingRoot.remove()
    }
    const root = document.createElement('div')
    root.setAttribute('id', REACT_ROOT_ID)

    const renderComponent = () => {
        document.body.appendChild(root)
        ReactDOM.render(<Root rootEl={root} {...props} />, root)
    }

    renderComponent()
}
