import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import React, { PureComponent } from 'react'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { DashboardContainer } from 'src/dashboard-refactor'
import type { UIServices } from 'src/services/ui/types'

export interface Props {
    services: UIServices
    analyticsBG: AnalyticsCoreInterface
}

class Overview extends PureComponent<Props> {
    render() {
        return (
            <DashboardContainer
                services={this.props.services}
                renderUpdateNotifBanner={() => (
                    <UpdateNotifBanner
                        theme={{ variant: 'dark', position: 'fixed' }}
                    />
                )}
                analyticsBG={this.props.analyticsBG}
            />
        )
    }
}

export default Overview
