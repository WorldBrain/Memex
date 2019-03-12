import React, { PureComponent } from 'react'
import CheckmarkRow from './checkmark-row'

import { StateProps, DispatchProps } from './content-type-container'

type Props = StateProps & DispatchProps

interface State {}

class ContentTypes extends PureComponent<Props, State> {
    private renderAnnotsTypes() {
        if (!this.props.isAnnotsSearch) {
            return null
        }

        return (
            <React.Fragment>
                <CheckmarkRow
                    value="Highlights"
                    subtitle="Only highlighted text"
                    active={this.props.highlightsFilter}
                    onClick={this.props.toggleHighlightsFilter}
                />
                <CheckmarkRow
                    value="Notes"
                    subtitle="Only the content of Notes"
                    active={this.props.notesFilter}
                    onClick={this.props.toggleNotesFilter}
                />
            </React.Fragment>
        )
    }
    render() {
        return (
            <React.Fragment>
                {/* <CheckmarkRow
                    value="Annotations"
                    subtitle="Highlights including notes"
                    active={this.props.annotationsFilter}
                    onClick={this.props.toggleAnnotationsFilter}
                /> */}
                {this.renderAnnotsTypes()}
                {/* <CheckmarkRow
                    value="Websites"
                    subtitle="All your visited web history"
                    active={this.props.websitesFilter}
                    onClick={this.props.toggleWebsitesFilter}
                /> */}
                {/* Unsure about whether PDF should have a state or the comming soon tag */}
                <CheckmarkRow
                    value="PDFs"
                    subtitle="All your visited PDFs"
                    onClick={() => null}
                />
            </React.Fragment>
        )
    }
}

export default ContentTypes
