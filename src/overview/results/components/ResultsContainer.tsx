import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import NotificationContainer, {
    selectors as notifs,
} from '../../../notifications'
import NoResultBadTerm from './NoResultBadTerm'
import ResultsMessage from './ResultsMessage'
import ResultList from './ResultListContainer'
import OnboardingBox, { OnboardingChecklist } from '../../onboarding/components'
import * as selectors from '../selectors'
import { RootState } from '../../../options/types'

const styles = require('./ResultList.css')

export interface StateProps {
    noResults: boolean
    isBadTerm: boolean
    isLoading: boolean
    showInbox: boolean
    shouldShowCount: boolean
    isInvalidSearch: boolean
    showInitSearchMsg: boolean
    totalResultCount: number
}

export interface DispatchProps {}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class ResultsContainer extends PureComponent<Props> {
    private renderContent() {
        if (this.props.showInbox) {
            return <NotificationContainer />
        }

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

        if (this.props.showInitSearchMsg) {
            return <OnboardingBox />
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
                {this.props.shouldShowCount && (
                    <ResultsMessage small>
                        Found <strong>{this.props.totalResultCount}</strong>{' '}
                        results in your digital memory
                    </ResultsMessage>
                )}
                <ResultList />
                {!this.props.isLoading && <OnboardingChecklist isRightBox />}
            </React.Fragment>
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
    shouldShowCount: selectors.shouldShowCount(state),
    isInvalidSearch: selectors.isInvalidSearch(state),
    totalResultCount: selectors.totalResultCount(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = () => ({})

export default connect(
    mapState,
    mapDispatch,
)(ResultsContainer)
