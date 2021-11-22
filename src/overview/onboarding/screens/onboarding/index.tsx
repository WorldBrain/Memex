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
import { GUIDED_ONBOARDING_URL } from '../../constants'
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
    static defaultProps: Pick<
        Props,
        'navToDashboard' | 'authBG' | 'personalCloudBG' | 'navToGuidedTutorial'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
        navToDashboard: () => {
            window.location.href = OVERVIEW_URL
            window.location.reload()
        },
        navToGuidedTutorial: () => {
            window.open(GUIDED_ONBOARDING_URL)
        },
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private renderTutorialStep = () => (
        <div className={styles.welcomeScreen}>
            <div className={styles.titleText}>The basics in 90s</div>
            <div className={styles.videoBox}>
                <iframe
                    src="https://share.descript.com/embed/fp4rxz3DycZ"
                    title="Onboarding Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
            </div>
            <ButtonBar>
                <PrimaryAction
                    label={'Try saving and annotating a website'}
                    onClick={() => {
                        this.processEvent('goToGuidedTutorial', null)
                    }}
                />
            </ButtonBar>
            <div className={styles.text}>or go to search dashboard</div>
        </div>
    )

    private renderSyncStep = () => (
        <div className={styles.welcomeScreen}>
            <div className={styles.loadingSpinner}>
                <LoadingIndicator />
            </div>
            <div className={styles.contentBox}>
                <div className={styles.titleText}>
                    Syncing with Existing Data
                </div>
                <div className={styles.descriptionText}>
                    This process continues in the background.
                    <br />
                    It may take a while for all data to appear in your dashboard
                    and you may experience temporary performance issues.
                </div>
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
            <div className={styles.betaTag}>beta</div>
            <div className={styles.contentBox}>
                <div className={styles.titleText}>Welcome to Memex</div>
                <div className={styles.descriptionText}>
                    Enter an email address to sign up or log in.
                </div>
            </div>
            <SignInScreen
                onSuccess={(isNewUser) =>
                    this.processEvent('onUserLogIn', { newSignUp: isNewUser })
                }
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
