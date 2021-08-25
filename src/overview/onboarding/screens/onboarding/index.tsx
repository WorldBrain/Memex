import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import type { State, Event, Dependencies } from './types'
import OnboardingBox from '../../components/onboarding-box'
import { OVERVIEW_URL } from 'src/constants'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { SignInScreen } from 'src/authentication/components/SignIn'

import { runInBackground } from 'src/util/webextensionRPC'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

const ButtonBar = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`

const styles = require('../../components/onboarding-box.css')

export interface Props extends Dependencies {}

export default class OnboardingScreen extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<Props, 'navToDashboard' | 'authBG'> = {
        authBG: runInBackground(),
        navToDashboard: () => {
            window.location.href = OVERVIEW_URL
            window.location.reload()
        },
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private renderTutorialStep = () => (
        <div className={styles.welcomeScreen}>
            <div className={styles.titleText}>
                Learn the basics of how to use Memex in 3 minutes
            </div>
            <div className={styles.videoBox}>
                <iframe
                    width="560"
                    height="315"
                    src="https://www.youtube.com/embed/G8UF8lQnAKA"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
            </div>
            <ButtonBar>
                <PrimaryAction
                    label="Continue"
                    onClick={() => this.processEvent('goToSyncStep', null)}
                />
            </ButtonBar>
        </div>
    )

    private renderSyncStep = () => (
        <div className={styles.welcomeScreen}>
            <div className={styles.loadingSpinner}>
                <LoadingIndicator />
            </div>
            <div className={styles.titleText}>Syncing with Existing Data</div>
            <div className={styles.descriptionText}>
                This process continues in the background.
            </div>
            <div className={styles.descriptionText}>
                It may take a while for all data to appear in your dashboard and
                you may experience temporary performance issues.
            </div>
            <ButtonBar>
                <PrimaryAction
                    label="Go to Dashboard"
                    onClick={() => this.processEvent('finishOnboarding', null)}
                />
            </ButtonBar>
        </div>
    )

    private renderOnboardingSteps() {
        switch (this.state.step) {
            case 'tutorial':
                return this.renderTutorialStep()
            case 'sync':
            default:
                return this.renderSyncStep()
        }
    }

    private renderLoginStep = () => (
        <div className={styles.welcomeScreen}>
            <img src={'/img/onlyIconLogo.svg'} className={styles.logoImg} />
            <SignInScreen
                onSuccess={() => this.processEvent('onUserLogIn', null)}
            />
        </div>
    )

    render() {
        return (
            <OnboardingBox>
                {this.state.shouldShowLogin
                    ? this.renderLoginStep()
                    : this.renderOnboardingSteps()}
            </OnboardingBox>
        )
    }
}
