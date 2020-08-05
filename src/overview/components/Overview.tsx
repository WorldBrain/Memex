import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
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
import TrialExpiryWarning from './TrialExpiryWarning'
import { Tooltip } from '../tooltips'
import { isDuringInstall } from '../onboarding/utils'
import {
    auth,
    featuresBeta,
    subscription,
} from 'src/util/remote-functions-background'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { AnnotationsSidebarInDashboardResults } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'
import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/annotations/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationsSidebarContainer } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarContainer'
import {
    createAnnotationsCache,
    AnnotationsCacheInterface,
} from 'src/annotations/annotations-cache'
import { show } from 'src/overview/modals/actions'
import classNames from 'classnames'

import { ContentSharingInterface } from 'src/content-sharing/background/types'

const styles = require('./overview.styles.css')
const resultItemStyles = require('src/common-ui/components/result-item.css')

export interface Props {
    setShowOnboardingMessage: () => void
    toggleAnnotationsSidebar(args: { pageUrl: string; pageTitle: string }): void
    handleReaderViewClick: (url: string) => void
    showSubscriptionModal: () => void
}

interface State {
    showPioneer: boolean
    showUpgrade: boolean
    trialExpiry: boolean
    expiryDate: number
}

class Overview extends PureComponent<Props, State> {
    private annotationsCache: AnnotationsCacheInterface
    private annotationsBG = runInBackground<AnnotationInterface<'caller'>>()
    private customListsBG = runInBackground<RemoteCollectionsInterface>()
    private tagsBG = runInBackground<RemoteTagsInterface>()

    private annotationsSidebarRef = React.createRef<
        AnnotationsSidebarContainer
    >()
    get annotationsSidebar(): AnnotationsSidebarContainer {
        return this.annotationsSidebarRef.current
    }

    state = {
        showPioneer: false,
        showUpgrade: false,
        trialExpiry: false,
        expiryDate: undefined,
    }

    constructor(props: Props) {
        super(props)

        this.annotationsCache = createAnnotationsCache({
            annotations: this.annotationsBG,
            tags: this.tagsBG,
        })
    }

    closeTrialExpiryNotif() {
        this.setState({
            trialExpiry: false,
        })
    }

    componentDidMount() {
        // this.props.init()
        this.upgradeState()
        this.expiryDate()
    }

    async expiryDate() {
        const date = await auth.getSubscriptionExpiry()
        const dateNow = Math.floor(new Date().getTime() / 1000)
        const inTrial = await auth.getSubscriptionStatus()

        if (date - dateNow < 259200 && inTrial === 'in_trial') {
            //3 days notification window
            this.setState({
                trialExpiry: true,
                expiryDate: date,
            })
        }

        return date
    }

    async upgradeState() {
        const plans = await auth.getAuthorizedPlans()

        if (await auth.isAuthorizedForFeature('beta')) {
            this.setState({ showPioneer: true, showUpgrade: false })
        }
        if (plans.length === 0) {
            this.setState({ showUpgrade: true })
        }
    }

    get mockHighlighter() {
        return {
            removeTempHighlights: () => undefined,
            renderHighlight: () => undefined,
        }
    }

    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        const isAlreadyOpenForOtherPage =
            args.pageUrl !== this.annotationsSidebar.state.pageUrl

        if (
            this.annotationsSidebar.state.showState === 'hidden' ||
            isAlreadyOpenForOtherPage
        ) {
            this.annotationsSidebar.setPageUrl(args.pageUrl)
            this.annotationsSidebar.showSidebar()
        } else if (this.annotationsSidebar.state.showState === 'visible') {
            this.annotationsSidebar.hideSidebar()
        }
    }

    private handleClickOutsideSidebar: React.MouseEventHandler = (e) => {
        const wasResultAnnotBtnClicked = (e.target as HTMLElement)?.classList?.contains(
            resultItemStyles.commentBtn,
        )

        if (
            !wasResultAnnotBtnClicked &&
            this.annotationsSidebar.state.showState === 'visible'
        ) {
            this.annotationsSidebar.hideSidebar()
        }
    }

    private handleCloseSidebarBtnClick: React.MouseEventHandler = (e) => {
        this.annotationsSidebar.hideSidebar()
    }

    handleOnboardingComplete = () => {
        window.location.href = OVERVIEW_URL
        this.props.setShowOnboardingMessage()
        localStorage.setItem('stage.Onboarding', 'true')
        localStorage.setItem('stage.MobileAppAd', 'true')
        window.location.reload()
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
            <div className={styles.mainWindow}>
                <div
                    className={classNames(styles.Overview, {
                        [styles.OverviewWithNotif]: this.state.trialExpiry,
                    })}
                >
                    <Head />
                    <CollectionsButton />
                    <Header />
                    <SidebarLeft />

                    <Results
                        toggleAnnotationsSidebar={
                            this.handleAnnotationSidebarToggle
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
                    <AnnotationsSidebarInDashboardResults
                        tags={this.tagsBG}
                        annotations={this.annotationsBG}
                        customLists={this.customListsBG}
                        refSidebar={this.annotationsSidebarRef}
                        annotationsCache={this.annotationsCache}
                        onClickOutside={this.handleClickOutsideSidebar}
                        onCloseSidebarBtnClick={this.handleCloseSidebarBtnClick}
                    />

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
                                    🚀 Pioneer Edition
                                </ButtonTooltip>
                            </div>
                        )}
                        {this.state.showUpgrade && (
                            <div
                                onClick={this.props.showSubscriptionModal}
                                className={styles.pioneerBadge}
                            >
                                ⭐️ Upgrade Memex
                            </div>
                        )}
                        <HelpBtn />
                    </div>
                </div>
                {this.state.trialExpiry && (
                    <div className={styles.notifications}>
                        {this.state.trialExpiry && (
                            <TrialExpiryWarning
                                expiryDate={this.state.expiryDate}
                                showPaymentWindow={
                                    this.props.showSubscriptionModal
                                }
                                closeTrialNotif={() =>
                                    this.closeTrialExpiryNotif()
                                }
                            />
                        )}
                    </div>
                )}
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

const mapStateToProps = (state) => ({})

const mapDispatchToProps = (dispatch) => ({
    init: () => {
        featuresBeta.getFeatureState('copy-paster')
        featuresBeta.getFeatureState('sharing-collections')
        return dispatch(searchBarActs.init())
    },
    setShowOnboardingMessage: () =>
        dispatch(resultActs.setShowOnboardingMessage(true)),
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
