import React from 'react'

import AnnotationEditable, { Props } from './AnnotationEditable'
import { NoteResultHoverState } from './types'

export * from './AnnotationEditable'

interface State {
    hoverState: NoteResultHoverState
}

export default class HoverControlledAnnotationEditable extends React.Component<
    Props & { passDownRef?: React.RefObject<AnnotationEditable> },
    State
> {
    static defaultProps = AnnotationEditable.defaultProps

    state: State = { hoverState: null }

    private setHoverState: (
        hoverState: NoteResultHoverState,
    ) => React.MouseEventHandler = (hoverState) => (e) =>
        this.setState({ hoverState })

    render() {
        const { passDownRef, ...props } = this.props
        return (
            <AnnotationEditable
                {...props}
                ref={passDownRef}
                onHighlightHover={this.setHoverState('main-content')}
                onFooterHover={this.setHoverState('footer')}
                onNoteHover={this.setHoverState('note')}
                onTagsHover={this.setHoverState('tags')}
                onListsHover={this.setHoverState('lists')}
                onUnhover={this.setHoverState(null)}
                hoverState={this.state.hoverState}
            />
        )
    }
}
