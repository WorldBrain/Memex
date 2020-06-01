import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { selectors as sidebarSelectors } from 'src/sidebar-overlay/sidebar'
import { OVERVIEW_URL } from 'src/constants'
import Onboarding from '../onboarding'
import { DeleteConfirmModal } from '../delete-confirm-modal'
import {
    SidebarContainer as SidebarLeft,
    CollectionsContainer as CollectionsButton,
} from '../sidebar-left'
import { HelpBtn } from '../help-btn'
import { Header, acts as searchBarActs } from '../search-bar'
import { Results, acts as resultActs } from '../results'
import Head from '../../options/containers/Head'
import DragElement from './DragElement'
import { Tooltip } from '../tooltips'
import { isDuringInstall } from '../onboarding/utils'

export interface Props {
    pageUrl: string
    setShowOnboardingMessage: () => void
    toggleAnnotationsSidebar(args: { pageUrl: string; pageTitle: string }): void
    handleReaderViewClick: (url: string) => void
}

class Overview extends PureComponent<Props> {
    handleOnboardingComplete = () => {
        window.location.href = OVERVIEW_URL
        this.props.setShowOnboardingMessage()
        localStorage.setItem('stage.Onboarding', 'true')
        localStorage.setItem('stage.MobileAppAd', 'true')
    }

    renderOnboarding() {
        return (
            <div>
                <Onboarding navToOverview={this.handleOnboardingComplete} />
                <HelpBtn />
            </div>
        )
    }

    renderOverview() {
        return (
            <div>
                <Head />
                <CollectionsButton />
                <Header />
                <SidebarLeft />
                <Results
                    toggleAnnotationsSidebar={
                        this.props.toggleAnnotationsSidebar
                    }
                    handleReaderViewClick={this.props.handleReaderViewClick}
                />
                <DeleteConfirmModal message="Delete page and related notes" />
                <DragElement />

                {/* <div className={styles.productHuntContainer}>
                    <a
                        href="https://www.producthunt.com/posts/memex-1-0?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-memex-1-0"
                        target="_blank"
                    >
                        <img
                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=151367&theme=dark"
                            alt="Memex 1.0 - Annotate, search and organize what you've read online. | Product Hunt Embed"
                            className={styles.productHuntBatch}
                        />
                    </a>
                </div> */}

                <Tooltip />
                <HelpBtn />
            </div>
        )
    }

    render() {
        if (isDuringInstall()) {
            return this.renderOnboarding()
        }

        return this.renderOverview()
    }
}

const mapStateToProps = (state) => ({
    pageUrl: sidebarSelectors.pageUrl(state),
})

const mapDispatchToProps = (dispatch) => ({
    init: () => {
        return dispatch(searchBarActs.init())
    },
    setShowOnboardingMessage: () =>
        dispatch(resultActs.setShowOnboardingMessage(true)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
