import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import NotificationContainer, {
    selectors as notifs,
} from '../../../notifications'
import NoResultBadTerm from './NoResultBadTerm'
import ResultsMessage from './ResultsMessage'
import ResultList from './ResultListContainer'
import OnboardingMessage from './onboarding-message'
import SearchTypeSwitch from './search-type-switch-container'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { RootState } from 'src/options/types'

const styles = require('./ResultList.css')

export interface StateProps {
    noResults: boolean
    isBadTerm: boolean
    isLoading: boolean
    showInbox: boolean
    areAnnotationsExpanded: boolean
    showOnboardingMessage: boolean
    shouldShowCount: boolean
    isInvalidSearch: boolean
    showInitSearchMsg: boolean
    totalResultCount: number
}

export interface DispatchProps {
    toggleAreAnnotationsExpanded: (e: React.SyntheticEvent) => void
}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class ResultsContainer extends PureComponent<Props> {
    private renderContent() {
        if (this.props.showInbox) {
            return <NotificationContainer />
        }

        const renderSearchSwitch = children => (
            <React.Fragment>
                <SearchTypeSwitch />
                {children}
            </React.Fragment>
        )

        if (this.props.showOnboardingMessage) {
            return <OnboardingMessage />
        }

        if (this.props.isBadTerm) {
            return renderSearchSwitch(
                <ResultsMessage>
                    <NoResultBadTerm>
                        Search terms are too common, or have been filtered out
                        to increase performance.
                    </NoResultBadTerm>
                </ResultsMessage>,
            )
        }

        if (this.props.isInvalidSearch) {
            return renderSearchSwitch(
                <ResultsMessage>
                    <NoResultBadTerm title="Invalid search query">
                        You can't exclude terms without including at least 1
                        term to search
                    </NoResultBadTerm>
                </ResultsMessage>,
            )
        }

        if (this.props.noResults) {
            return renderSearchSwitch(
                <ResultsMessage>
                    <NoResultBadTerm>
                        found for this query. ¯\_(ツ)_/¯
                    </NoResultBadTerm>
                </ResultsMessage>,
            )
        }

        // No issues; render out results list view
        return renderSearchSwitch(
            <React.Fragment>
                {this.props.shouldShowCount && (
                    <ResultsMessage small>
                        {this.props.totalResultCount} results
                    </ResultsMessage>
                )}
                <ResultList />
            </React.Fragment>,
        )
    }

    render() {
        return <div className={styles.main}>{this.renderContent()}</div>
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    showInbox: notifs.showInbox(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    isLoading: selectors.isLoading(state),
    areAnnotationsExpanded: selectors.areAnnotationsExpanded(state),
    shouldShowCount: selectors.shouldShowCount(state),
    isInvalidSearch: selectors.isInvalidSearch(state),
    totalResultCount: selectors.totalResultCount(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
    showOnboardingMessage: selectors.showOnboardingMessage(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = dispatch => ({
    toggleAreAnnotationsExpanded: e => {
        e.preventDefault()
        dispatch(actions.toggleAreAnnotationsExpanded())
    },
})

export default connect(mapState, mapDispatch)(ResultsContainer)
