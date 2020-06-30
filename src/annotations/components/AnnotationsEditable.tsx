import * as React from 'react'
import Waypoint from 'react-waypoint'
import { Annotation } from 'src/annotations/types'

import { LoadingIndicator } from 'src/common-ui/components'
import {
    AnnotationEditableGeneralProps,
    AnnotationViewEditableProps,
} from 'src/annotations/components/AnnotationEditable'
import EmptyMessage from 'src/annotations/components/old/empty-message'
import CongratsMessage from 'src/annotations/components/old/congrats-message'
import { TagsEventProps } from 'src/annotations/components/AnnotationEdit'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'

// TODO: clean all these up, haven't started working through this component yet
// (See AnnotationCreate)
export interface PageAnnotationsProps {
    highlighter?: AnnotationEditableGeneralProps['highlighter']
    needsWaypoint?: boolean
    appendLoader?: boolean
    annotations?: Annotation[]
    annotationModes?: {
        [annotationUrl: string]: AnnotationMode
    }
    activeAnnotationUrl?: string | null
    hoverAnnotationUrl?: string
    annotationEventHandlers?: AnnotationViewEditableProps
    showCongratsMessage?: boolean
    tagsEventProps?: TagsEventProps
    handleScrollPagination?: () => void
}

// TODO(sidebar-refactor): extract scrollable waypoint list to a generic component
// TODO(sidebar-refactor): then a component specifically for an annotations list may become unneccassry, just need to `map` where needed (the sidebar)
export default class AnnotationsEditable extends React.Component<
    PageAnnotationsProps
> {
    private handleWaypointEnter = (args: Waypoint.CallbackArgs) => {
        this.props.handleScrollPagination()
    }

    private renderList() {
        const annots = this.props.annotations.map((annotation, i) => {
            // TODO(sidebar-refactor): Just for testing until fixing AnnotationEditable
            return <pre>{JSON.stringify(annotation)}</pre>

            /*            <AnnotationEditable
                key={i}
                highlighter={this.props.highlighter}
                mode={this.props.annotationModes[annot.url] || 'default'}
                displayCrowdfunding={false}
                {...annot}
                {...this.props.annotationEventHandlers}
                {...this.props.tagsEventProps}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
            />*/
        })

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    onEnter={this.handleWaypointEnter}
                    key="sidebar-waypoint"
                />,
            )
        }

        if (this.props.appendLoader) {
            annots.push(<LoadingIndicator key="spinner" />)
        }

        return annots
    }

    render() {
        if (this.props.annotations.length === 0) {
            return <EmptyMessage />
        }

        return (
            <React.Fragment>
                {this.renderList()}
                {this.props.showCongratsMessage && <CongratsMessage />}
            </React.Fragment>
        )
    }
}
