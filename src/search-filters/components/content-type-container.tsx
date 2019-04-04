import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'

import * as results from 'src/overview/results/selectors'
import * as selectors from '../selectors'
import * as actions from '../actions'
import { RootState } from 'src/options/types'

import ContentTypes from './content-types'
import FilterButton from './filter-button'

const styles = require('./content-types.css')

export interface StateProps {
    showFilteredTypes?: boolean
    websitesFilter: boolean
    annotationsFilter: boolean
    highlightsFilter: boolean
    notesFilter: boolean
    isAnnotsSearch: boolean
}

export interface DispatchProps {
    toggleFilterTypes?: () => void
    clearFilterTypes?: () => void
    hideFilterTypes?: () => void
    toggleWebsitesFilter: () => void
    toggleHighlightsFilter: () => void
    toggleNotesFilter: () => void
    toggleAnnotationsFilter: () => void
}
interface OwnProps {
    env: 'overview' | 'inpage'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class ContentTypeContainer extends PureComponent<Props, State> {
    renderDisplayFilters = () => {
        const filterNodes: JSX.Element[] = []
        if (this.props.notesFilter) {
            filterNodes.push(
                <span key="notes">
                    Notes
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.toggleNotesFilter}
                    />
                </span>,
            )
        }

        if (this.props.highlightsFilter) {
            filterNodes.push(
                <span key="highlights">
                    Highlights
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.toggleHighlightsFilter}
                    />
                </span>,
            )
        }

        if (this.props.annotationsFilter) {
            filterNodes.push(
                <span key="annots">
                    Annotations
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.toggleAnnotationsFilter}
                    />
                </span>,
            )
        }

        if (this.props.websitesFilter) {
            filterNodes.push(
                <span key="pages">
                    Websites
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.toggleWebsitesFilter}
                    />
                </span>,
            )
        }

        return filterNodes
    }

    render() {
        if (!this.props.isAnnotsSearch) {
            return null
        }

        return (
            <FilterButton
                source="Types"
                filteredItems={[]}
                togglePopup={this.props.toggleFilterTypes}
                hidePopup={this.props.hideFilterTypes}
                clearFilters={this.props.clearFilterTypes}
                displayFilters={this.renderDisplayFilters}
            >
                {/* The Content Type checklist */}
                {this.props.showFilteredTypes && (
                    <ContentTypes
                        env={this.props.env}
                        tooltipPosition={this.props.tooltipPosition}
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
            </FilterButton>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    showFilteredTypes: selectors.filterTypes(state),
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
    toggleFilterTypes: () => dispatch(actions.toggleFilterTypes()),
    clearFilterTypes: () => dispatch(actions.clearFilterTypes()),
    hideFilterTypes: () => dispatch(actions.hideFilterTypes()),
    toggleWebsitesFilter: () => dispatch(actions.toggleWebsitesFilter()),
    toggleHighlightsFilter: () => dispatch(actions.toggleHighlightsFilter()),
    toggleNotesFilter: () => dispatch(actions.toggleNotesFilter()),
    toggleAnnotationsFilter: () => dispatch(actions.toggleAnnotationsFilter()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(ContentTypeContainer)
