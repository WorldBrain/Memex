import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'
import {
    DashboardResultsDependencies,
    DashboardResultsEvent,
    DashboardResultsState,
} from 'src/overview/components/DashboardResultsContainer/types'
import DashboardResultsLogic from 'src/overview/components/DashboardResultsContainer/logic'
import Onboarding from 'src/overview/onboarding'
import { isDuringInstall } from 'src/overview/onboarding/utils'
import { OVERVIEW_URL } from 'src/constants'
import ViewerModal from 'src/reader/components/ViewerModal'
import { DashboardContainer } from 'src/dashboard-refactor'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { ThemeProvider } from 'styled-components'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import browser from 'webextension-polyfill'

interface RootState extends DashboardResultsState {
    themeVariant?: MemexThemeVariant
    theme?: MemexTheme
}
export default class DashboardResultsContainer extends StatefulUIElement<
    DashboardResultsDependencies,
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(props: DashboardResultsDependencies) {
        super(props, new DashboardResultsLogic(props))
    }

    async componentDidMount() {
        let themeVariant: MemexThemeVariant = 'dark'
        try {
            themeVariant = await loadThemeVariant()
        } catch (err) {
            console.error('Could not load theme, falling back to dark mode')
        }
        this.setState({ themeVariant, theme: theme({ variant: themeVariant }) })

        await browser.storage.onChanged.addListener(
            async (changes, areaName) => {
                if (areaName !== 'local') {
                    return
                }

                if (changes.themeVariant) {
                    const { themeVariant } = await browser.storage.local.get(
                        'themeVariant',
                    )

                    this.setState({
                        themeVariant,
                        theme: theme({ variant: themeVariant }),
                    })
                }
            },
        )
    }

    handleToggleAnnotationsSidebar = (args: {
        pageUrl: string
        pageTitle: string
    }) => this.processEvent('handleToggleAnnotationsSidebar', args)

    readerClose = () => this.processEvent('handleReaderClose', {})

    handleReaderViewClick = (url: string) => {
        return this.processEvent('handleReaderViewClick', url)
    }

    readerLoaded = async ({ url, title }) => {}

    handleOnboardingComplete = () => {
        window.location.href = OVERVIEW_URL
        window.location.reload()
    }

    render() {
        if (isDuringInstall()) {
            return <Onboarding navToDashboard={this.handleOnboardingComplete} />
        }

        if (this.state.theme == null) {
            return null
        } else {
            return (
                <>
                    <ThemeProvider theme={this.state.theme ?? null}>
                        <DashboardContainer
                            services={this.props.services}
                            theme={this.state.theme}
                            renderUpdateNotifBanner={() => (
                                <UpdateNotifBanner
                                    theme={{
                                        ...this.state.theme,
                                        position: 'fixed',
                                    }}
                                />
                            )}
                            getRootElement={() =>
                                document.getElementById('app')
                            }
                        />

                        {this.state.readerShow && (
                            <ViewerModal
                                fullUrl={this.state.readerUrl}
                                handleClose={this.readerClose}
                                onInit={this.readerLoaded}
                            />
                        )}
                    </ThemeProvider>
                </>
            )
        }
    }
}
