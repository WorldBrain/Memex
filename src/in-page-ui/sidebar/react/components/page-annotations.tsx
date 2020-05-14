import * as React from 'react'
import Waypoint from 'react-waypoint'
import { Annotation } from 'src/annotations/types'
import AnnotationBox, {
    AnnotationBoxEventProps,
    AnnotationBoxGeneralProps,
} from 'src/in-page-ui/components/annotation-box/annotation-box'
import { TagsEventProps } from 'src/in-page-ui/components/annotation-box/edit-mode-content'
import { LoadingIndicator } from 'src/common-ui/components'
import { SidebarEnv, AnnotationMode } from '../types'
import CongratsMessage from './congrats-message'
import EmptyMessage from './empty-message'

export interface PageAnnotationsProps {
    env: SidebarEnv
    highlighter: AnnotationBoxGeneralProps['highlighter']
    needsWaypoint: boolean
    appendLoader: boolean
    annotations: Annotation[]
    annotationModes: {
        [annotationUrl: string]: AnnotationMode
    }
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    annotationEventHandlers: AnnotationBoxEventProps
    showCongratsMessage: boolean
    tagsEventProps: TagsEventProps
    handleScrollPagination: () => void
}

export default class PageAnnotations extends React.Component<
    PageAnnotationsProps
> {
    private handleWaypointEnter = (args: Waypoint.CallbackArgs) => {
        this.props.handleScrollPagination()
    }

    private renderList() {
        const {
            annotationEventHandlers: annotationProps,
            tagsEventProps,
        } = this.props
        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationBox
                key={i}
                env={this.props.env}
                highlighter={this.props.highlighter}
                mode={this.props.annotationModes[annot.url] || 'default'}
                displayCrowdfunding={false}
                {...annot}
                {...annotationProps}
                {...tagsEventProps}
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
