import * as React from 'react'
import styled from 'styled-components'
import Waypoint from 'react-waypoint'
import { Annotation } from 'src/annotations/types'

import { LoadingIndicator } from 'src/common-ui/components'
import AnnotationEditable, {
    AnnotationEditableGeneralProps,
    Props as AnnotationViewEditableProps,
} from 'src/annotations/components/AnnotationEditable'
import { TagsEventProps } from 'src/annotations/components/AnnotationEdit'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import CongratsMessage from './parts/CongratsMessage'

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
class AnnotationsEditable extends React.Component<PageAnnotationsProps> {
    private handleWaypointEnter = (args: Waypoint.CallbackArgs) => {
        this.props.handleScrollPagination()
    }

    private renderList() {
        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationEditable
                key={i}
                highlighter={this.props.highlighter}
                mode={this.props.annotationModes[annot.url] ?? 'default'}
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
            <>
                {this.renderList()}
                {this.props.showCongratsMessage && <CongratsMessage />}
            </>
        )
    }
}

export default AnnotationsEditable

const EmptyMessage = () => (
    <EmptyMessageStyled>
        <EmptyMessageEmojiStyled>¯\_(ツ)_/¯</EmptyMessageEmojiStyled>
        <EmptyMessageTextStyled>
            No notes or highlights on this page
        </EmptyMessageTextStyled>
    </EmptyMessageStyled>
)

const EmptyMessageStyled = styled.div`
    width: 80%;
    margin: 0px auto;
    text-align: center;
    margin-top: 90px;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);
`

const EmptyMessageEmojiStyled = styled.div`
    font-size: 20px;
    margin-bottom: 15px;
    color: rgb(54, 54, 46);
`

const EmptyMessageTextStyled = styled.div`
    margin-bottom: 15px;
    font-weight: 400;
    font-size: 15px;
    color: #a2a2a2;
`
