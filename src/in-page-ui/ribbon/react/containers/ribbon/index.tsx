import * as React from 'react'
import {
    RibbonContainerDependencies,
    RibbonContainerState,
    RibbonContainerLogic,
    RibbonContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Ribbon from '../../components/ribbon-container'
import { Anchor } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { PageList } from 'src/custom-lists/background/types'

export interface RibbonContainerProps extends RibbonContainerDependencies {}

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
        this.props.ribbonEvents.on('showRibbon', this.showRibbon)
        this.props.ribbonEvents.on('hideRibbon', this.hideRibbon)
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.ribbonEvents.removeListener('showRibbon', this.showRibbon)
        this.props.ribbonEvents.removeListener('hideRibbon', this.hideRibbon)
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
                getRemoteFunction={this.props.getRemoteFunction}
                highlighter={this.props.highlighter}
                commentText={''}
                isSidebarOpen={false}
                isRibbonEnabled={true}
                isCommentSaved={false}
                annotationsManager={this.props.annotationsManager}
                getUrl={() => ''}
                setRibbonRef={(e: HTMLElement) => {}}
                closeSidebar={() => {}}
                handleRemoveRibbon={() => {}}
                openSidebar={(args: any) => {}}
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
                openRibbon={() => {}}
            />
        )
    }
}
