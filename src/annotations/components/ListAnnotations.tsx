import * as React from 'react'
import Waypoint from 'react-waypoint'
import { Annotation } from 'src/annotations/types'

import { LoadingIndicator } from 'src/common-ui/components'
import AnnotationViewEditable, {
    AnnotationEditableGeneralProps,
    AnnotationViewEditableProps,
} from 'src/annotations/components/AnnotationViewEditable'
import { TagsEventProps } from 'src/annotations/components/old/edit/AnnotationEditForm'
import { AnnotationMode } from 'src/in-page-ui/sidebar/react/types'
import EmptyMessage from 'src/annotations/components/old/empty-message'
import CongratsMessage from 'src/annotations/components/old/congrats-message'

export interface PageAnnotationsProps {
    highlighter: AnnotationEditableGeneralProps['highlighter']
    needsWaypoint: boolean
    appendLoader: boolean
    annotations: Annotation[]
    annotationModes: {
        [annotationUrl: string]: AnnotationMode
    }
    activeAnnotationUrl: string | null
    hoverAnnotationUrl: string
    annotationEventHandlers: AnnotationViewEditableProps
    showCongratsMessage: boolean
    tagsEventProps: TagsEventProps
    handleScrollPagination: () => void
}

export default class ListAnnotations extends React.Component<
    PageAnnotationsProps
> {
    private handleWaypointEnter = (args: Waypoint.CallbackArgs) => {
        this.props.handleScrollPagination()
    }

    private renderList() {
        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationViewEditable
                key={i}
                highlighter={this.props.highlighter}
                mode={this.props.annotationModes[annot.url] || 'default'}
                displayCrowdfunding={false}
                {...annot}
                {...this.props.annotationEventHandlers}
                {...this.props.tagsEventProps}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
            />
        ))

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
