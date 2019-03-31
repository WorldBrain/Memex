import React, { PureComponent, Fragment } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'

import * as results from 'src/overview/results/selectors'
import * as selectors from '../selectors'
import * as actions from '../actions'
import { RootState } from 'src/options/types'

import FilterBar from './FilterBar'
import ContentTypes from './content-types'

export interface StateProps {
    websitesFilter: boolean
    annotationsFilter: boolean
    highlightsFilter: boolean
    notesFilter: boolean
    isAnnotsSearch: boolean
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
        if (!this.props.isAnnotsSearch) {
            return null
        }

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
                        isAnnotsSearch={this.props.isAnnotsSearch}
                    />
                )}
            </Fragment>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    isAnnotsSearch: results.isAnnotsSearch(state),
    websitesFilter: selectors.websitesFilter(state),
    annotationsFilter: selectors.annotationsFilter(state),
    highlightsFilter: selectors.highlightsFilter(state),
    notesFilter: selectors.notesFilter(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
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
