import React, { PureComponent } from 'react'
import CheckmarkRow from './checkmark-row'

import { StateProps, DispatchProps } from './content-type-container'

type Props = StateProps & DispatchProps

interface State {}

class ContentTypes extends PureComponent<Props, State> {
    render() {
        return (
            <div>
                <CheckmarkRow
                    value="Annotations"
                    subtitle="Highlights including notes"
                    active={this.props.annotationsFilter}
                    onClick={this.props.toggleAnnotationsFilter}
                />
                <CheckmarkRow
                    value="Highlights"
                    subtitle="Only highlighted text"
                    active={this.props.highlightsFilter}
                    small
                    onClick={this.props.toggleHighlightsFilter}
                />
                <CheckmarkRow
                    value="Notes"
                    subtitle="Only the content of Notes"
                    active={this.props.notesFilter}
                    small
                    onClick={this.props.toggleNotesFilter}
                />
                <CheckmarkRow
                    value="Websites"
                    subtitle="All your visited web history"
                    active={this.props.websitesFilter}
                    onClick={this.props.toggleWebsitesFilter}
                />
                {/* Unsure about whether PDF should have a state or the comming soon tag */}
                <CheckmarkRow
                    value="PDFs"
                    subtitle="All your visited PDFs"
                    active={false}
                    onClick={() => null}
                />
            </div>
        )
    }
}

export default ContentTypes
