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
import { auth, featuresBeta } from 'src/util/remote-functions-background'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { AnnotationsSidebarInDashboardResults as AnnotationsSidebar } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'

const styles = require('./overview.styles.css')
const resultItemStyles = require('src/common-ui/components/result-item.css')

export interface Props {
    pageUrl: string
    setShowOnboardingMessage: () => void
    toggleAnnotationsSidebar(args: { pageUrl: string; pageTitle: string }): void
    handleReaderViewClick: (url: string) => void
}

interface State {
    showPioneer: boolean
}

class Overview extends PureComponent<Props> {
    private annotationsSidebar: AnnotationsSidebar

    state = {
        showPioneer: false,
    }

    componentDidMount() {
        // this.props.init()
        this.showPioneer()
    }

    async showPioneer() {
        if (await auth.isAuthorizedForFeature('beta')) {
            this.setState({
                showPioneer: true,
            })
        }
    }

    get mockHighlighter() {
        return {
            removeTempHighlights: () => undefined,
            renderHighlight: () => undefined,
        }
    }

    private setAnnotsSidebarRef = (sidebar: AnnotationsSidebar) => {
        this.annotationsSidebar = sidebar
    }

    // TODO: (sidebar-refactor, prior1)

    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        const isAlreadyOpenForOtherPage =
            args.pageUrl !== this.annotationsSidebar.state.pageUrl

        if (
            this.annotationsSidebar.state.state === 'hidden' ||
            isAlreadyOpenForOtherPage
        ) {
            this.annotationsSidebar.showSidebar()
        } else if (this.annotationsSidebar.state.state === 'visible') {
            this.annotationsSidebar.hideSidebar()
        }
    }

    private handleClickOutsideSidebar: React.MouseEventHandler = (e) => {
        const wasResultAnnotBtnClicked = (e.target as HTMLElement)?.classList?.contains(
            resultItemStyles.commentBtn,
        )

        if (
            !wasResultAnnotBtnClicked &&
            this.annotationsSidebar.state.state === 'visible'
        ) {
            this.annotationsSidebar.hideSidebar()
        }
    }

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
        console.log(this.state.showPioneer)
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
                {/* <AnnotationsSidebar
                    currentTab={}
                    env="overview"
                    setRef={this.setAnnotsSidebarRef}
                /> */}

                <Tooltip />
                <div className={styles.rightCorner}>
                    {this.state.showPioneer && (
                        <div
                            onClick={() => {
                                window.open('#/features')
                            }}
                            className={styles.pioneerBadge}
                        >
                            <ButtonTooltip
                                tooltipText="Thank you for supporting this journey 🙏"
                                position="top"
                            >
                                👨🏾‍🚀Pioneer Edition
                            </ButtonTooltip>
                        </div>
                    )}
                    <HelpBtn />
                </div>
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
        featuresBeta.getFeatureState('copy-paster')
        return dispatch(searchBarActs.init())
    },
    setShowOnboardingMessage: () =>
        dispatch(resultActs.setShowOnboardingMessage(true)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
