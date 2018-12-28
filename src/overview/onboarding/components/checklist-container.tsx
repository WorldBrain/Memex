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

export interface StateProps {
    onboardingStages: {
        annotationStage: string
        powerSearchStage: string
    }
}

export interface DispatchProps {
    fetchOnboardingStages: () => void
}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class OnboardingChecklist extends React.Component<Props> {
    processEvent = remoteFunction('processEvent')

    async componentDidMount() {
        await this.props.fetchOnboardingStages()
    }

    handleAnnotationStage = async () => {
        if (this.props.onboardingStages.annotationStage === 'DONE') {
            return
        }

        this.processEvent({
            type: EVENT_NAMES.START_ANNOTATION_ONBOARDING,
        })

        const url = constants.ANNOTATION_DEMO_URL
        await setLocalStorage(
            constants.STORAGE_KEYS.onboardingDemo.step1,
            'highlight_text',
        )
        await browser.tabs.create({
            url,
        })
    }

    handlePowerSearchStage = async () => {
        if (this.props.onboardingStages.powerSearchStage === 'DONE') {
            return
        }

        this.processEvent({
            type: EVENT_NAMES.START_POWERSEARCH_ONBOARDING,
        })

        const url = constants.ANNOTATION_DEMO_URL
        await setLocalStorage(
            constants.STORAGE_KEYS.onboardingDemo.step2,
            'redirected',
        )
        await browser.tabs.create({
            url,
        })
    }

    render() {
        const {
            annotationStage,
            powerSearchStage,
        } = this.props.onboardingStages
        return (
            <Checklist
                isAnnotationChecked={annotationStage === 'DONE'}
                isPowerSearchChecked={powerSearchStage === 'DONE'}
                handleAnnotationStage={this.handleAnnotationStage}
                handlePowerSearchStage={this.handlePowerSearchStage}
            />
        )
    }
}

const mapStateToProps = state => ({
    onboardingStages: selectors.onboardingStages(state),
})

const mapDispatchToPrpos = dispatch => ({
    fetchOnboardingStages: () => dispatch(actions.fetchOnboardingStages()),
})

export default connect(
    mapStateToProps,
    mapDispatchToPrpos,
)(OnboardingChecklist)
