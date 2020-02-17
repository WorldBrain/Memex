import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import NotificationContainer, {
    selectors as notifs,
} from '../../../notifications'
import { selectors as filters } from 'src/search-filters'
import NoResultBadTerm from './NoResultBadTerm'
import ResultsMessage from './results-message'
import ResultList from './ResultListContainer'
import OnboardingMessage from './onboarding-message'
import SearchTypeSwitch from './search-type-switch-container'
import * as actions from '../actions'
import * as selectors from '../selectors'
import { RootState } from 'src/options/types'
import { features } from 'src/util/remote-functions-background'
import MobileAppMessage from './mobile-app-message'

const styles = require('./ResultList.css')

export interface StateProps {
    noResults: boolean
    isBadTerm: boolean
    isLoading: boolean
    showInbox: boolean
    isMobileListFiltered: boolean
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

interface State {
    showSocialSearch: boolean
}

class ResultsContainer extends React.Component<Props, State> {
    state = {
        showSocialSearch: false,
    }

    async componentDidMount() {
        this.setState({
            showSocialSearch: await features.getFeature('SocialIntegration'),
        })
    }

    private renderContent() {
        const showOnboarding = localStorage.getItem('stage.Onboarding')
        const showMobileAd = localStorage.getItem('stage.MobileAppAd') ?? 'true'

        if (this.props.isMobileListFiltered && this.props.noResults) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm title="You don't have anything saved from the mobile app yet">
                        {showMobileAd === 'true' && <MobileAppMessage />}
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        if (showOnboarding === 'true' && this.props.noResults) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm title="You don't have anything saved yet">
                        <OnboardingMessage />
                    </NoResultBadTerm>
                </ResultsMessage>
            )
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
                        {this.props.totalResultCount} results
                    </ResultsMessage>
                )}
                <ResultList />
            </React.Fragment>
        )
    }

    render() {
        return (
            <div className={styles.main}>
                {this.props.showInbox ? (
                    <NotificationContainer />
                ) : (
                    <>
                        <SearchTypeSwitch
                            showSocialSearch={this.state.showSocialSearch}
                        />
                        {this.renderContent()}
                    </>
                )}
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    showInbox: notifs.showInbox(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    isLoading: selectors.isLoading(state),
    areAnnotationsExpanded: selectors.areAnnotationsExpanded(state),
    isMobileListFiltered: filters.isMobileListFiltered(state),
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
