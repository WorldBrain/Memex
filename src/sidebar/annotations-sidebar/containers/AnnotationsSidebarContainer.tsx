import * as React from 'react'
import { EventEmitter } from 'events'

import { StatefulUIElement } from 'src/util/ui-logic'
import { AnnotationsSidebarEventEmitter } from '../types'
import {
    SidebarContainerLogic,
    SidebarContainerState,
    SidebarContainerEvents,
    SidebarContainerOptions,
} from './old/sidebar-annotations/logic'
import AnnotationsSidebar from '../components/AnnotationsSidebar'

export class AnnotationsSidebarContainer extends StatefulUIElement<
    SidebarContainerOptions,
    SidebarContainerState,
    SidebarContainerEvents
> {
    events = new EventEmitter() as AnnotationsSidebarEventEmitter

    constructor(props: SidebarContainerOptions) {
        super(props, new SidebarContainerLogic(props))
    }

    componentDidMount() {
        super.componentDidMount()

        this.setupEventForwarding()
    }

    componentWillUnmount() {
        super.componentWillUnmount()

        this.cleanupEventForwarding()
    }

    private setupEventForwarding() {
        this.events.on('clickAnnotation', ({ url }) =>
            this.processEvent('goToAnnotationInPage', {
                annotationUrl: url,
                context: 'pageAnnotations',
            }),
        )
        this.events.on('clickAnnotationTag', (args) =>
            console.log('CLICKED TAG:', args),
        )
        this.events.on('clickAnnotationBookmarkBtn', ({ url }) =>
            this.processEvent('toggleAnnotationBookmark', {
                annotationUrl: url,
                context: 'pageAnnotations',
            }),
        )
        this.events.on('clickAnnotationDeleteBtn', ({ url }) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
                mode: 'delete',
            }),
        )
        this.events.on('clickAnnotationEditBtn', ({ url }) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
                mode: 'edit',
            }),
        )

        this.events.on('clickConfirmAnnotationEditBtn', ({ url, ...args }) =>
            this.processEvent('editAnnotation', {
                annotationUrl: url,
                context: 'pageAnnotations',
                ...args,
            }),
        )
        this.events.on('clickConfirmAnnotationDeleteBtn', ({ url }) =>
            this.processEvent('deleteAnnotation', {
                annotationUrl: url,
                context: 'pageAnnotations',
            }),
        )
        this.events.on(
            'clickConfirmAnnotationCreateBtn',
            ({ text, isBookmarked, ...args }) =>
                this.processEvent('saveNewPageComment', {
                    commentText: text,
                    bookmarked: isBookmarked,
                    ...args,
                }),
        )

        this.events.on('clickCancelAnnotationDeleteBtn', ({ url }) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
                mode: 'default',
            }),
        )
        this.events.on('clickCancelAnnotationEditBtn', ({ url }) =>
            this.processEvent('switchAnnotationMode', {
                annotationUrl: url,
                context: 'pageAnnotations',
                mode: 'default',
            }),
        )
        this.events.on('clickCancelAnnotationCreateBtn', () =>
            this.processEvent('cancelNewPageComment', null),
        )

        this.events.on('paginateAnnotations', () =>
            this.processEvent('paginateSearch', null),
        )
        // this.events.on('queryAnnotations', ({ query }) =>
        //     this.processEvent('changeSearchQuery', { searchQuery: query }),
        // )

        this.events.on('removeTemporaryHighlights', () =>
            console.log('REMOVE HIGHLIGHTS'),
        )
    }

    private cleanupEventForwarding() {
        for (const event of this.events.eventNames()) {
            this.events.removeAllListeners(event)
        }
    }

    render() {
        // TODO: properly set up tags picker deps
        return (
            <AnnotationsSidebar
                events={this.events}
                {...this.state}
                env={this.props.env}
                mode="default"
                isAnnotationCreateShown={this.state.showCommentBox}
                isSearchLoading={this.state.primarySearchState === 'running'}
                appendLoader={this.state.secondarySearchState === 'running'}
                hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                annotationCreateProps={{
                    anchor: this.state.commentBox.anchor,
                    tagPickerDependencies: {} as any,
                }}
                annotationTagProps={{} as any}
            />
        )
    }
}
