import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import EventEmitter from 'events'

import { runInBackground } from 'src/util/webextensionRPC'
import SidebarContainer, {
    SidebarContainer as AnnotationsSidebar,
} from 'src/in-page-ui/sidebar/react/containers/sidebar'
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
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { SearchInterface } from 'src/search/background/types'

const resultItemStyles = require('src/common-ui/components/result-item.css')

export interface Props {
    pageUrl: string
    init: () => void
    setShowOnboardingMessage: () => void
}

class Overview extends PureComponent<Props> {
    private annotationsSidebar: AnnotationsSidebar

    componentDidMount() {
        this.props.init()
    }

    get mockInPageUI() {
        return {
            state: {},
            events: new EventEmitter(),
            hideRibbon: () => undefined,
            hideSidebar: () => undefined,
        }
    }

    get mockHighlighter() {
        return {
            removeTempHighlights: () => undefined,
        }
    }

    private setAnnotsSidebarRef = (sidebar) => {
        this.annotationsSidebar = sidebar
    }

    private handleAnnotationSidebarToggle = async (args?: {
        pageUrl: string
        pageTitle?: string
    }) => {
        const isAlreadyOpenForOtherPage =
            args.pageUrl !==
            this.annotationsSidebar.state.showAnnotsForPage?.url

        if (
            this.annotationsSidebar.state.state === 'hidden' ||
            isAlreadyOpenForOtherPage
        ) {
            await this.annotationsSidebar.processEvent(
                'togglePageAnnotationsView',
                args,
            )
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
        return (
            <div>
                <Head />
                <CollectionsButton />
                <Header />
                <SidebarLeft />
                <Results
                    toggleAnnotationsSidebar={
                        this.handleAnnotationSidebarToggle
                    }
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

                {/* NOTE: most of these deps are unused in the overview's usage of the sidebar
                    - perhaps we should make a separate simplified interface for overview usage? */}
                <SidebarContainer
                    env="overview"
                    normalizeUrl={normalizeUrl}
                    currentTab={{ url: 'http://worldbrain.io' } as any}
                    annotations={runInBackground<
                        AnnotationInterface<'caller'>
                    >()}
                    tags={runInBackground<RemoteTagsInterface>()}
                    bookmarks={runInBackground<BookmarksInterface>()}
                    search={runInBackground<SearchInterface>()}
                    customLists={runInBackground<RemoteCollectionsInterface>()}
                    inPageUI={this.mockInPageUI as any}
                    setRef={this.setAnnotsSidebarRef}
                    highlighter={this.mockHighlighter as any}
                    onClickOutside={this.handleClickOutsideSidebar}
                    searchResultLimit={10}
                />
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
