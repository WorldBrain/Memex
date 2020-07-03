import * as React from 'react'

import { StatefulUIElement } from 'src/util/ui-logic'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import {
    SidebarContainerLogic,
    SidebarContainerState,
    SidebarContainerEvents,
    SidebarContainerOptions,
    AnnotationEventContext,
} from './logic'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    setRef?: (sidebar: AnnotationsSidebarContainer) => void
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    constructor(props: P) {
        super(props, new SidebarContainerLogic(props))

        if (props.setRef) {
            props.setRef(this)
        }
    }

    showSidebar = () => {
        this.processEvent('show', null)
    }

    hideSidebar = () => {
        this.processEvent('hide', null)
    }

    protected getEditProps = (): AnnotationsSidebarProps['annotationEditProps'] => ({
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

    protected getCreateProps = (): AnnotationsSidebarProps['annotationCreateProps'] => ({
        anchor: this.state.commentBox.anchor,
        onCancel: () => this.processEvent('cancelNewPageComment', null),
        onSave: ({ text, isBookmarked, ...args }) =>
            this.processEvent('saveNewPageComment', {
                commentText: text,
                bookmarked: isBookmarked,
                ...args,
            }),
    })

    protected getTagProps = (): AnnotationsSidebarProps['annotationTagProps'] => ({
        loadDefaultSuggestions: () =>
            this.props.tags.fetchInitialTagSuggestions(),
        queryEntries: (query) =>
            this.props.tags.searchForTagSuggestions({ query }),
    })

    render() {
        return (
            <AnnotationsSidebar
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
