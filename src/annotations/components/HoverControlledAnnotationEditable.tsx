import React from 'react'

import AnnotationEditable, { Props } from './AnnotationEditable'
import { NoteResultHoverState } from 'src/dashboard-refactor/search-results/types'

export * from './AnnotationEditable'

interface State {
    hoverState: NoteResultHoverState
}

export default class HoverControlledAnnotationEditable extends React.Component<
    Props,
    State
> {
    static defaultProps = AnnotationEditable.defaultProps

    state: State = { hoverState: null }

    private setHoverState: (
        hoverState: NoteResultHoverState,
    ) => React.MouseEventHandler = (hoverState) => (e) =>
        this.setState({ hoverState })

    render() {
        return (
            <AnnotationEditable
                {...this.props}
                onHighlightHover={this.setHoverState('main-content')}
                onFooterHover={this.setHoverState('footer')}
                onNoteHover={this.setHoverState('note')}
                onTagsHover={this.setHoverState('tags')}
                onUnhover={this.setHoverState(null)}
                hoverState={this.state.hoverState}
            />
        )
    }
}
