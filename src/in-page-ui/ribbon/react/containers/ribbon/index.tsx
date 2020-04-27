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

    // componentDidMount() {
    //     super.componentDidMount()
    //     this.props.ribbonController.events.on('showRibbon', this.showRibbon)
    //     this.props.ribbonController.events.on('hideRibbon', this.hideRibbon)
    // }

    // componentWillUnmount() {
    //     super.componentWillUnmount()
    //     this.props.ribbonController.events.removeListener(
    //         'showRibbon',
    //         this.showRibbon,
    //     )
    //     this.props.ribbonController.events.removeListener(
    //         'hideRibbon',
    //         this.hideRibbon,
    //     )
    // }

    // showRibbon = () => {
    //     this.processEvent('show', null)
    // }

    // hideRibbon = () => {
    //     this.processEvent('hide', null)
    // }

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
                    ...this.state.highlights,
                    handleHighlightsToggle: () =>
                        this.processEvent('handleHighlightsToggle', null),
                }}
                tooltip={{
                    ...this.state.tooltip,
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
                    initTagSuggestions: this.state.tagging.initTagSuggestions,
                    handleCommentTextChange: (comment: string) => {},
                    saveComment: () => this.processEvent('saveComment', null),
                    cancelComment: () =>
                        this.processEvent('cancelComment', null),
                    toggleBookmark: () =>
                        this.processEvent('toggleBookmark', null),
                    toggleTagPicker: () =>
                        this.processEvent('toggleTagPicker', null),
                    setShowCommentBox: value =>
                        this.processEvent('setShowCommentBox', { value }),
                    addTag: event =>
                        this.processEvent('addTag', { value: event }),
                    deleteTag: event =>
                        this.processEvent('deleteTag', { value: event }),
                }}
                bookmark={{
                    ...this.state.bookmark,
                    handleBookmarkToggle: () =>
                        this.processEvent('handleBookmarkToggle', null),
                }}
                tagging={{
                    ...this.state.tagging,
                    addTag: event =>
                        this.processEvent('addTag', { value: event }),
                    deleteTag: event =>
                        this.processEvent('deleteTag', { value: event }),
                    setShowTagsPicker: (value: false) =>
                        this.processEvent('setShowTagsPicker', { value }),
                }}
                lists={{
                    ...this.state.lists,
                    onCollectionAdd: (collection: PageList) => {},
                    // this.processEvent('onCollectionAdd', {
                    //     value: collection,
                    // }),
                    onCollectionDel: (collection: PageList) => {},
                    // this.processEvent('onCollectionDel', {
                    //     value: collection,
                    // }),
                    setShowCollectionsPicker: (value: false) =>
                        this.processEvent('setShowCollectionsPicker', {
                            value,
                        }),
                }}
                search={{
                    ...this.state.search,
                    setShowSearchBox: (value: false) =>
                        this.processEvent('setShowSearchBox', { value }),
                    setSearchValue: (value: string) =>
                        this.processEvent('setSearchValue', { value }),
                }}
                pausing={{
                    ...this.state.pausing,
                    handlePauseToggle: () =>
                        this.processEvent('handlePauseToggle', null),
                }}
            />
        )
    }
}
