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

export interface OwnProps {
    isRightBox?: boolean
}

export type Props = StateProps & DispatchProps & OwnProps

class OnboardingChecklist extends React.Component<Props> {
    processEvent = remoteFunction('processEvent')
    openOptionsTab = remoteFunction('openOptionsTab')

    async componentDidMount() {
        await this.props.fetchShowOnboarding()
        await this.props.fetchOnboardingStages()
    }

    private handleAnnotationStage = async () => {
        if (this.props.isAnnotationDone) {
            return
        }

        await utils.setOnboardingStage(FLOWS.annotation, STAGES.redirected)
        await utils.openDemoPage()

        this.processEvent({
            type: EVENT_NAMES.START_ANNOTATION_ONBOARDING,
        })
    }

    private handlePowerSearchStage = async () => {
        if (this.props.isPowerSearchDone) {
            return
        }

        /*
        If there are no results in Overview, take user to the Wiki
        Else, directly start the onboarding tooltip process.
        */
        if (this.props.noResults) {
            await utils.setOnboardingStage(FLOWS.powerSearch, STAGES.redirected)
            await utils.openDemoPage()
        } else {
            await utils.setOnboardingStage(
                FLOWS.powerSearch,
                STAGES.powerSearch.overviewTooltips,
            )
            this.props.initOnboardingTooltips()
        }

        this.processEvent({
            type: EVENT_NAMES.START_POWERSEARCH_ONBOARDING,
        })
    }

    private handleTaggingStage = async () => {
        if (this.props.isTaggingDone) {
            return
        }

        await utils.setOnboardingStage(FLOWS.tagging, STAGES.redirected)
        await utils.openDemoPage()

        this.processEvent({
            type: EVENT_NAMES.START_TAGGING_ONBOARDING,
        })
    }

    private handleBackupStage = async () => {
        if (this.props.isBackupDone) {
            return
        }

        this.openOptionsTab('backup')
        await this.props.setBackupStageDone()

        this.processEvent({
            type: EVENT_NAMES.FINISH_BACKUP_ONBOARDING,
        })
    }

    render() {
        if (!this.props.showOnboardingBox) {
            return null
        }

        return (
            <Checklist
                isRightBox={this.props.isRightBox}
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
