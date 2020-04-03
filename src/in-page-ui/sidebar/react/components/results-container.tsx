import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import NoResultBadTerm from 'src/overview/results/components/NoResultBadTerm'
import ResultsMessage from 'src/overview/results/components/results-message'
import ResultList, { ResultListContainerProps } from './result-list-container'

const styles = require('./result-list.css')

export interface StateProps {
    noResults: boolean
    isBadTerm: boolean
    isLoading: boolean
    areAnnotationsExpanded: boolean
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number
}

export interface DispatchProps {
    toggleAreAnnotationsExpanded: (e: React.SyntheticEvent) => void
}

export interface OwnProps {}

export type ResultsContainerProps = StateProps &
    DispatchProps &
    OwnProps &
    ResultListContainerProps

export default class ResultsContainer extends PureComponent<
    ResultsContainerProps
> {
    private renderContent() {
        if (this.props.isBadTerm) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm>
                        Search terms are too common, or have been filtered out
                        to increase performance.
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        if (this.props.isInvalidSearch) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm title="Invalid search query">
                        You can't exclude terms without including at least 1
                        term to search
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        if (this.props.noResults) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm>
                        found for this query. ¯\_(ツ)_/¯
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        // No issues; render out results list view
        return (
            <React.Fragment>
                <ResultList {...this.props} />
            </React.Fragment>
        )
    }

    render() {
        return <div className={styles.main}>{this.renderContent()}</div>
    }
}
