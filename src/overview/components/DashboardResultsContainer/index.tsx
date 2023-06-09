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

export default class DashboardResultsContainer extends StatefulUIElement<
    DashboardResultsDependencies,
    DashboardResultsState,
    DashboardResultsEvent
> {
    constructor(props: DashboardResultsDependencies) {
        super(props, new DashboardResultsLogic(props))
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

        return (
            <>
                <DashboardContainer
                    services={this.props.services}
                    renderUpdateNotifBanner={() => (
                        <UpdateNotifBanner theme={{ position: 'fixed' }} />
                    )}
                />

                {this.state.readerShow && (
                    <ViewerModal
                        fullUrl={this.state.readerUrl}
                        handleClose={this.readerClose}
                        onInit={this.readerLoaded}
                    />
                )}
            </>
        )
    }
}
