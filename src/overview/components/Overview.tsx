import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import React, { PureComponent } from 'react'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { DashboardContainer } from 'src/dashboard-refactor'
import type { UIServices } from 'src/services/ui/types'

export interface Props {
    services: UIServices
    analyticsBG: AnalyticsCoreInterface
}

interface State {
    themeVariant?: MemexThemeVariant
    theme?: MemexTheme
}

class Overview extends React.Component<Props, State> {
    state: State = {}

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

        return (
            <DashboardContainer
                services={this.props.services}
                theme={this.state.theme}
                renderUpdateNotifBanner={() => (
                    <UpdateNotifBanner
                        theme={{ ...this.state.theme, position: 'fixed' }}
                    />
                )}
                analyticsBG={this.props.analyticsBG}
            />
        )
    }
}

export default Overview
