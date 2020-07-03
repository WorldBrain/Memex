import * as React from 'react'
import { EventEmitter } from 'events'

import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import { AnnotationsSidebarEventEmitter } from '../types'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import { RemoteTagsInterface } from 'src/tags/background/types'
import {
    SidebarContainerLogic,
    SidebarContainerState,
    SidebarContainerEvents,
    SidebarContainerOptions,
    AnnotationEventContext,
} from './old/sidebar-annotations/logic'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export class AnnotationsSidebarContainer extends StatefulUIElement<
    SidebarContainerOptions,
    SidebarContainerState,
    SidebarContainerEvents
> {
    events = new EventEmitter() as AnnotationsSidebarEventEmitter
    private tags: RemoteTagsInterface

    constructor(props: SidebarContainerOptions) {
        super(props, new SidebarContainerLogic(props))

        this.tags = runInBackground()
    }

    private getEditProps = (): AnnotationsSidebarProps['annotationEditProps'] => ({
        env: this.props.env,
        handleMouseEnter: (url) =>
            this.processEvent('annotationMouseEnter', { annotationUrl: url }),
        handleMouseLeave: (url) =>
            this.processEvent('annotationMouseLeave', { annotationUrl: url }),
        handleAnnotationTagClick: (url, tag) =>
            console.log('clicked tag:', url, tag),
        handleBookmarkToggle: (url) =>
            this.processEvent('toggleAnnotationBookmark', {
                annotationUrl: url,
                ...DEF_CONTEXT,
            }),
        handleConfirmDelete: (url) =>
            this.processEvent('deleteAnnotation', {
                annotationUrl: url,
                ...DEF_CONTEXT,
            }),
        handleTrashBtnClick: (url) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                mode: 'delete',
                ...DEF_CONTEXT,
            }),
        handleCancelDelete: (url) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                mode: 'default',
                ...DEF_CONTEXT,
            }),
        handleConfirmAnnotationEdit: ({ url, ...args }) =>
            this.processEvent('editAnnotation', {
                annotationUrl: url,
                ...args,
                ...DEF_CONTEXT,
            }),
        handleEditBtnClick: (url) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                mode: 'edit',
                ...DEF_CONTEXT,
            }),
        handleGoToAnnotation: (url) =>
            this.processEvent('goToAnnotationInPage', {
                annotationUrl: url,
                ...DEF_CONTEXT,
            }),
    })

    private getCreateProps = (): AnnotationsSidebarProps['annotationCreateProps'] => ({
        anchor: this.state.commentBox.anchor,
        onCancel: () => this.processEvent('cancelNewPageComment', null),
        onSave: ({ text, isBookmarked, ...args }) =>
            this.processEvent('saveNewPageComment', {
                commentText: text,
                bookmarked: isBookmarked,
                ...args,
            }),
    })

    private getTagProps = (): AnnotationsSidebarProps['annotationTagProps'] => ({
        loadDefaultSuggestions: () => this.tags.fetchInitialTagSuggestions(),
        queryEntries: (query) => this.tags.searchForTagSuggestions({ query }),
    })

    render() {
        return (
            <AnnotationsSidebar
                events={this.events}
                {...this.state}
                isSearchLoading={this.state.primarySearchState === 'running'}
                appendLoader={this.state.secondarySearchState === 'running'}
                annotationModes={this.state.annotationModes.pageAnnotations}
                isAnnotationCreateShown={this.state.showCommentBox}
                hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                annotationCreateProps={this.getCreateProps()}
                annotationEditProps={this.getEditProps()}
                annotationTagProps={this.getTagProps()}
                handleScrollPagination={() =>
                    this.processEvent('paginateSearch', null)
                }
            />
        )
    }
}
