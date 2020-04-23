import * as React from 'react'
import {
    RibbonContainerOptions,
    RibbonContainerState,
    RibbonContainerLogic,
    RibbonContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Ribbon from '../../components/ribbon-container'
import { RibbonSubcomponentProps } from '../../components/types'
import { Anchor } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { PageList } from 'src/custom-lists/background/types'

type SingleArgOf<Func> = Func extends (arg: infer T) => void ? T : null

export interface RibbonContainerProps extends RibbonContainerOptions {
    state: 'visible' | 'hidden'
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
                isExpanded={this.props.state === 'visible'}
                getRemoteFunction={this.props.getRemoteFunction}
                annotationsManager={this.props.annotationsManager}
                highlighter={this.props.highlighter}
                isRibbonEnabled={true}
                handleRemoveRibbon={() => {}}
                getUrl={() => ''}
                tabId={this.props.currentTab.id}
                handleRibbonToggle={() => {}}
                highlights={{
                    areHighlightsEnabled: false,
                    handleHighlightsToggle: () =>
                        this.processEvent('handleHighlightsToggle', null),
                }}
                tooltip={{
                    isTooltipEnabled: false,
                    handleTooltipToggle: () =>
                        this.processEvent('handleTooltipToggle', null),
                }}
                sidebar={{
                    isSidebarOpen: this.props.isSidebarOpen,
                    setShowSidebarCommentBox: () => {},
                    openSidebar: (args: any) => {
                        this.props.openSidebar()
                    },
                    closeSidebar: this.props.closeSidebar,
                }}
                commentBox={{
                    ...this.state.commentBox,
                    setShowCommentBox: () =>
                        this.processEvent('setShowCommentBox', null),
                }}
                bookmark={{
                    isBookmarked: false,
                    handleBookmarkToggle: () =>
                        this.processEvent('handleBookmarkToggle', null),
                }}
                tagging={{
                    tags: [],
                    initTagSuggs: [],
                    showTagsPicker: false,
                    onTagAdd: (tag: string) => {},
                    onTagDel: (tag: string) => {},
                    setShowTagsPicker: (value: false) => {},
                }}
                lists={{
                    collections: [],
                    initCollSuggs: [],
                    showCollectionsPicker: false,
                    onCollectionAdd: (collection: PageList) => {},
                    onCollectionDel: (collection: PageList) => {},
                    setShowCollectionsPicker: (value: false) => {},
                }}
                search={{
                    showSearchBox: false,
                    searchValue: '',
                    setShowSearchBox: (value: false) => {},
                    setSearchValue: (value: string) => {},
                }}
                pausing={{
                    isPaused: false,
                    handlePauseToggle: () => {},
                }}
            />
        )
    }
}
