import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import {
    AnnotationsSidebarInPage,
    Props as AnnotationsSidebarDependencies,
} from './containers/AnnotationsSidebarInPage'
import { InPageUIRootMount } from 'src/in-page-ui/types'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

interface RootProps {
    mount: InPageUIRootMount
    dependencies: Omit<
        AnnotationsSidebarDependencies,
        'sidebarContext' | 'storageAPI' | 'runtimeAPI' | 'theme'
    >
}
interface RootState {
    themeVariant?: MemexThemeVariant
    theme?: MemexTheme
}
class Root extends React.Component<RootProps, RootState> {
    async componentDidMount() {
        let themeVariant: MemexThemeVariant = 'dark'
        try {
            themeVariant = await loadThemeVariant()
        } catch (err) {
            console.error('Could not load theme, falling back to dark mode')
        }
        this.setState({ themeVariant, theme: theme({ variant: themeVariant }) })
    }

    render() {
        if (!this.state.theme) {
            return null
        }

        const { props } = this
        return (
            <StyleSheetManager target={props.mount.shadowRoot as any}>
                <ThemeProvider theme={this.state.theme}>
                    <AnnotationsSidebarInPage
                        {...props.dependencies}
                        theme={this.state.theme}
                    />
                </ThemeProvider>
            </StyleSheetManager>
        )
    }
}

export function setupInPageSidebarUI(
    mount: InPageUIRootMount,
    dependencies: Omit<
        AnnotationsSidebarDependencies,
        'sidebarContext' | 'storageAPI' | 'runtimeAPI' | 'theme'
    >,
) {
    ReactDOM.render(
        <Root mount={mount} dependencies={dependencies} />,
        mount.rootElement,
    )
}

export function destroyInPageSidebarUI(
    target: HTMLElement,
    shadowRoot?: ShadowRoot,
) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
