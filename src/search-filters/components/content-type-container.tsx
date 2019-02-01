import React, { PureComponent, Fragment } from 'react'
import { connect, MapStateToProps, MapDispatchToProps } from 'react-redux'

import * as selectors from '../selectors'
import * as actions from '../actions'

import FilterBar from './FilterBar'
import ContentTypes from './content-types'

export interface StateProps {
    websitesFilter: boolean
    annotationsFilter: boolean
    highlightsFilter: boolean
    notesFilter: boolean
}

export interface DispatchProps {
    toggleWebsitesFilter: () => void
    toggleHighlightsFilter: () => void
    toggleNotesFilter: () => void
    toggleAnnotationsFilter: () => void
}
interface OwnProps {
    showFilteredTypes: boolean
    toggleFilterTypes: () => void
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class ContentTypeContainer extends PureComponent<Props, State> {
    render() {
        return (
            <Fragment>
                {/* The row header which when clicked expands to show the checklist */}
                <FilterBar
                    filter="Content Type"
                    onBarClick={this.props.toggleFilterTypes}
                />

                {/* The Content Type checklist */}
                {this.props.showFilteredTypes && (
                    <ContentTypes
                        annotationsFilter={this.props.annotationsFilter}
                        highlightsFilter={this.props.highlightsFilter}
                        notesFilter={this.props.notesFilter}
                        websitesFilter={this.props.websitesFilter}
                        toggleAnnotationsFilter={
                            this.props.toggleAnnotationsFilter
                        }
                        toggleHighlightsFilter={
                            this.props.toggleHighlightsFilter
                        }
                        toggleNotesFilter={this.props.toggleNotesFilter}
                        toggleWebsitesFilter={this.props.toggleWebsitesFilter}
                    />
                )}
            </Fragment>
        )
    }
}

const mapStateToProps = (state): StateProps => ({
    websitesFilter: selectors.websitesFilter(state),
    annotationsFilter: selectors.annotationsFilter(state),
    highlightsFilter: selectors.highlightsFilter(state),
    notesFilter: selectors.notesFilter(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    toggleWebsitesFilter: () => dispatch(actions.toggleWebsitesFilter()),
    toggleHighlightsFilter: () => dispatch(actions.toggleHighlightsFilter()),
    toggleNotesFilter: () => dispatch(actions.toggleNotesFilter()),
    toggleAnnotationsFilter: () => dispatch(actions.toggleAnnotationsFilter()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(ContentTypeContainer)
