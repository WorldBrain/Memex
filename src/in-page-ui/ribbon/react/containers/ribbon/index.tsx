import * as React from 'react'
import {
    RibbonContainerOptions,
    RibbonContainerState,
    RibbonContainerLogic,
    RibbonContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Ribbon from '../../components/ribbon-container'
import { Anchor } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { PageList } from 'src/custom-lists/background/types'

export interface RibbonContainerProps extends RibbonContainerOptions {
    isSidebarOpen: boolean
    openSidebar: () => void
    closeSidebar: () => void
}

export default class RibbonContainer extends StatefulUIElement<
    RibbonContainerProps,
    RibbonContainerState,
    RibbonContainerEvents
> {
    constructor(props) {
        super(props, new RibbonContainerLogic(props))
    }

    componentDidMount() {
        super.componentDidMount()
        this.props.ribbonController.events.on('showRibbon', this.showRibbon)
        this.props.ribbonController.events.on('hideRibbon', this.hideRibbon)
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.ribbonController.events.removeListener(
            'showRibbon',
            this.showRibbon,
        )
        this.props.ribbonController.events.removeListener(
            'hideRibbon',
            this.hideRibbon,
        )
    }

    showRibbon = () => {
        this.processEvent('show', null)
    }

    hideRibbon = () => {
        this.processEvent('hide', null)
    }

    render() {
        return (
            <Ribbon
                openSidebar={(args: any) => {
                    this.props.openSidebar()
                }}
                closeSidebar={this.props.closeSidebar}
                getRemoteFunction={this.props.getRemoteFunction}
                highlighter={this.props.highlighter}
                commentText={''}
                isSidebarOpen={this.props.isSidebarOpen}
                isRibbonEnabled={true}
                handleRemoveRibbon={() => {}}
                isCommentSaved={false}
                annotationsManager={this.props.annotationsManager}
                getUrl={() => ''}
                setRibbonRef={(e: HTMLElement) => {}}
                setShowSidebarCommentBox={() => {}}
                insertOrRemoveTooltip={(isTooltipEnabled: false) => {}}
                isExpanded={this.state.state === 'visible'}
                isTooltipEnabled={false}
                areHighlightsEnabled={false}
                isPaused={false}
                isBookmarked={false}
                tabId={this.props.currentTab.id}
                tags={[]}
                initTagSuggs={[]}
                collections={[]}
                initCollSuggs={[]}
                showCommentBox={false}
                showSearchBox={false}
                showTagsPicker={false}
                showCollectionsPicker={false}
                searchValue={''}
                onInit={() => {}}
                setAnnotationsManager={(
                    annotationsManager: AnnotationsManager,
                ) => {}}
                handleRibbonToggle={() => {}}
                handleTooltipToggle={() => {}}
                handleHighlightsToggle={() => {}}
                handlePauseToggle={() => {}}
                handleBookmarkToggle={() => {}}
                onTagAdd={(tag: string) => {}}
                onTagDel={(tag: string) => {}}
                onCollectionAdd={(collection: PageList) => {}}
                onCollectionDel={(collection: PageList) => {}}
                setShowCommentBox={(value: false) => {}}
                setShowTagsPicker={(value: false) => {}}
                setShowCollectionsPicker={(value: false) => {}}
                setShowSearchBox={(value: false) => {}}
                setSearchValue={(value: string) => {}}
            />
        )
    }
}
