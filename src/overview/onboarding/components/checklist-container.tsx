import React from 'react'
import { connect } from 'react-redux'

import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { STAGES } from '../constants'
import * as utils from '../utils'

import Checklist from './checklist'
import * as actions from '../actions'
import * as selectors from '../selectors'
import * as tooltipsActs from '../../tooltips/actions'
import * as resultSelectors from '../../results/selectors'

export interface StateProps {
    showOnboardingBox: boolean
    annotationStage: string
    powerSearchStage: string
    taggingStage: string
    backupStage: string
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
        if (this.props.annotationStage === 'DONE') {
            return
        }

        this.processEvent({
            type: EVENT_NAMES.START_ANNOTATION_ONBOARDING,
        })

        await utils.setOnboardingStage('annotation', STAGES.redirected)
        await utils.openDemoPage()
    }

    private handlePowerSearchStage = async () => {
        if (this.props.powerSearchStage === 'DONE') {
            return
        }

        this.processEvent({
            type: EVENT_NAMES.START_POWERSEARCH_ONBOARDING,
        })

        /*
        If there are no results in Overview, take user to the Wiki
        Else, directly start the onboarding tooltip process.
        */
        if (this.props.noResults) {
            await utils.setOnboardingStage('powerSearch', STAGES.redirected)
            await utils.openDemoPage()
        } else {
            await utils.setOnboardingStage(
                'powerSearch',
                STAGES.powerSearch.overviewTooltips,
            )
            this.props.initOnboardingTooltips()
        }
    }

    private handleTaggingStage = async () => {
        if (this.props.taggingStage === 'DONE') {
            return
        }
        // TODO: Add analytics
        await utils.setOnboardingStage('tagging', STAGES.redirected)
        await utils.openDemoPage()
    }

    private handleBackupStage = async () => {
        if (this.props.backupStage === 'DONE') {
            return
        }

        // TODO: Add analytics
        this.openOptionsTab('backup')
        await this.props.setBackupStageDone()
    }

    render() {
        if (!this.props.showOnboardingBox) {
            return null
        }

        return (
            <Checklist
                isRightBox={this.props.isRightBox}
                congratsMessage={this.props.congratsMessage}
                isAnnotationChecked={this.props.annotationStage === 'DONE'}
                isPowerSearchChecked={this.props.powerSearchStage === 'DONE'}
                isTaggingChecked={this.props.taggingStage === 'DONE'}
                isBackupChecked={this.props.backupStage === 'DONE'}
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
    annotationStage: selectors.annotationStage(state),
    powerSearchStage: selectors.powerSearchStage(state),
    taggingStage: selectors.taggingStage(state),
    backupStage: selectors.backupStage(state),
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
