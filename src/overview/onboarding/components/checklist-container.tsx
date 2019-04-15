import React from 'react'
import { connect } from 'react-redux'

import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { FLOWS, STAGES } from '../constants'
import * as utils from '../utils'

import Checklist from './checklist'
import * as actions from '../actions'
import * as selectors from '../selectors'
import * as tooltipsActs from '../../tooltips/actions'
import * as resultSelectors from '../../results/selectors'
import analytics from 'src/analytics'

export interface StateProps {
    showOnboardingBox: boolean
    isAnnotationDone: boolean
    isPowerSearchDone: boolean
    isTaggingDone: boolean
    isBackupDone: boolean
    noResults: boolean
    congratsMessage: boolean
}

export interface DispatchProps {
    fetchOnboardingStages: () => void
    fetchShowOnboarding: () => void
    initOnboardingTooltips: () => void
    closeOnboardingBox: () => void
    setBackupStageDone: () => void
}

export type Props = StateProps & DispatchProps

class OnboardingChecklist extends React.Component<Props> {
    trackEventInternally = remoteFunction('processEvent')
    openOptionsTab = remoteFunction('openOptionsTab')

    async componentDidMount() {
        await this.props.fetchShowOnboarding()
        await this.props.fetchOnboardingStages()
    }

    private trackEvent(event: { type: string }) {
        this.trackEventInternally({
            type: event.type,
        })
        analytics.trackEvent({ category: 'OnboardingTut', action: event.type })
    }

    private handleAnnotationStage = async () => {
        if (this.props.isAnnotationDone) {
            return
        }

        await utils.setOnboardingStage(FLOWS.annotation, STAGES.redirected)
        await utils.openDemoPage()

        this.trackEvent({
            type: EVENT_NAMES.START_ANNOTATION_ONBOARDING,
        })
    }

    private handlePowerSearchStage = async () => {
        if (this.props.isPowerSearchDone) {
            return
        }
        await utils.setOnboardingStage(FLOWS.powerSearch, STAGES.redirected)
        await utils.openDemoPage()

        this.trackEvent({
            type: EVENT_NAMES.START_POWERSEARCH_ONBOARDING,
        })
    }

    private handleTaggingStage = async () => {
        if (this.props.isTaggingDone) {
            return
        }

        await utils.setOnboardingStage(FLOWS.tagging, STAGES.redirected)
        await utils.openDemoPage()

        this.trackEvent({
            type: EVENT_NAMES.START_TAGGING_ONBOARDING,
        })
    }

    private handleBackupStage = async () => {
        if (this.props.isBackupDone) {
            return
        }

        this.openOptionsTab('backup')
        await this.props.setBackupStageDone()

        this.trackEvent({
            type: EVENT_NAMES.FINISH_BACKUP_ONBOARDING,
        })
    }

    render() {
        if (!this.props.showOnboardingBox) {
            return null
        }

        return (
            <Checklist
                congratsMessage={this.props.congratsMessage}
                isAnnotationChecked={this.props.isAnnotationDone}
                isPowerSearchChecked={this.props.isPowerSearchDone}
                isTaggingChecked={this.props.isTaggingDone}
                isBackupChecked={this.props.isBackupDone}
                handleAnnotationStage={this.handleAnnotationStage}
                handlePowerSearchStage={this.handlePowerSearchStage}
                handleTaggingStage={this.handleTaggingStage}
                handleBackupStage={this.handleBackupStage}
                closeOnboardingBox={this.props.closeOnboardingBox}
            />
        )
    }
}

const mapStateToProps = state => ({
    showOnboardingBox: selectors.showOnboardingBox(state),
    isAnnotationDone: selectors.isAnnotationDone(state),
    isPowerSearchDone: selectors.isPowerSearchDone(state),
    isTaggingDone: selectors.isTaggingDone(state),
    isBackupDone: selectors.isBackupDone(state),
    congratsMessage: selectors.congratsMessage(state),
    noResults: resultSelectors.noResults(state),
})

const mapDispatchToPrpos = dispatch => ({
    fetchOnboardingStages: () => dispatch(actions.fetchOnboardingStages()),
    fetchShowOnboarding: () => dispatch(actions.fetchShowOnboarding()),
    closeOnboardingBox: () => dispatch(actions.closeOnboardingBox()),
    initOnboardingTooltips: () =>
        dispatch(tooltipsActs.initOnboardingTooltips()),
    setBackupStageDone: () => dispatch(actions.setBackupStageDone()),
})

export default connect(
    mapStateToProps,
    mapDispatchToPrpos,
)(OnboardingChecklist)
