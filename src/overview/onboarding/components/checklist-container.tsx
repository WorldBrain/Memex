import React from 'react'
import { connect } from 'react-redux'

import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import * as constants from '../constants'
import { browser } from 'webextension-polyfill-ts'
import { setLocalStorage } from 'src/util/storage'
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
    noResults: boolean
}

export interface DispatchProps {
    fetchOnboardingStages: () => void
    fetchShowOnboarding: () => void
    initOnboardingTooltips: () => void
    closeOnboardingBox: () => void
}

export interface OwnProps {
    isRightBox?: boolean
}

export type Props = StateProps & DispatchProps & OwnProps

class OnboardingChecklist extends React.Component<Props> {
    processEvent = remoteFunction('processEvent')

    async componentDidMount() {
        await this.props.fetchShowOnboarding()
        await this.props.fetchOnboardingStages()
    }

    _setOnboardingKey = async (step: string, value: string) => {
        await setLocalStorage(
            constants.STORAGE_KEYS.onboardingDemo[step],
            value,
        )
    }

    _openDemoPage = async () => {
        const url = constants.ANNOTATION_DEMO_URL
        await browser.tabs.create({ url })
    }

    handleAnnotationStage = async () => {
        if (this.props.annotationStage === 'DONE') {
            return
        }

        this.processEvent({
            type: EVENT_NAMES.START_ANNOTATION_ONBOARDING,
        })

        await this._setOnboardingKey('step1', 'highlight_text')
        await this._openDemoPage()
    }

    handlePowerSearchStage = async () => {
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
            await this._setOnboardingKey('step2', 'redirected')
            await this._openDemoPage()
        } else {
            await this._setOnboardingKey('step2', 'overview-tooltips')
            this.props.initOnboardingTooltips()
        }
    }

    handleTaggingStage = async () => {
        if (this.props.taggingStage === 'DONE') {
            return
        }

        // TODO: Add analytic

        await this._setOnboardingKey('step3', 'redirected')
        await this._openDemoPage()
    }

    render() {
        const {
            showOnboardingBox,
            annotationStage,
            powerSearchStage,
            taggingStage,
        } = this.props

        if (!showOnboardingBox) {
            return null
        }

        return (
            <Checklist
                isRightBox={this.props.isRightBox}
                isAnnotationChecked={annotationStage === 'DONE'}
                isPowerSearchChecked={powerSearchStage === 'DONE'}
                isTaggingChecked={taggingStage === 'DONE'}
                handleAnnotationStage={this.handleAnnotationStage}
                handlePowerSearchStage={this.handlePowerSearchStage}
                handleTaggingStage={this.handleTaggingStage}
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
    noResults: resultSelectors.noResults(state),
})

const mapDispatchToPrpos = dispatch => ({
    fetchOnboardingStages: () => dispatch(actions.fetchOnboardingStages()),
    fetchShowOnboarding: () => dispatch(actions.fetchShowOnboarding()),
    closeOnboardingBox: () => dispatch(actions.closeOnboardingBox()),
    initOnboardingTooltips: () =>
        dispatch(tooltipsActs.initOnboardingTooltips()),
})

export default connect(
    mapStateToProps,
    mapDispatchToPrpos,
)(OnboardingChecklist)
