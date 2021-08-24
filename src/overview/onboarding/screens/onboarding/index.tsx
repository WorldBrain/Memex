import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import type { State, Event, Dependencies } from './types'
import OnboardingBox from '../../components/onboarding-box'
import { OVERVIEW_URL } from 'src/constants'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

import { SignInScreen } from 'src/authentication/components/SignIn'

import Margin from 'src/dashboard-refactor/components/Margin'
import { runInBackground } from 'src/util/webextensionRPC'

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
    static defaultProps: Pick<Props, 'navToOverview' | 'authBG'> = {
        authBG: runInBackground(),
        navToOverview: () => {
            window.location.href = OVERVIEW_URL
            window.location.reload()
        },
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private renderMainStep() {
        return (
            <div className={styles.welcomeScreen}>
                <img src={'/img/onlyIconLogo.svg'} className={styles.logoImg} />
                <div className={styles.titleText}>
                    All you need to know to get started
                </div>
                <div className={styles.shortcutContainer}>
                    <div className={styles.shortcutBox}>
                        <div className={styles.shortcutDescription}>
                            Save current page
                        </div>
                        <div className={styles.shortcutName}>
                            <span className={styles.keyboardButton}>alt</span>+
                            <span className={styles.keyboardButton}>s</span>
                        </div>
                    </div>

                    <div className={styles.shortcutBox}>
                        <div className={styles.shortcutDescription}>
                            Annotate highlighted text
                        </div>
                        <div className={styles.shortcutName}>
                            <span className={styles.keyboardButton}>alt</span>+
                            <span className={styles.keyboardButton}>a</span>
                        </div>
                    </div>

                    <div className={styles.shortcutBox}>
                        <div className={styles.shortcutDescription}>
                            Search Saved Pages & Notes
                        </div>
                        <div className={styles.shortcutName}>
                            <span className={styles.keyboardButton}>alt</span>+
                            <span className={styles.keyboardButton}>f</span>
                        </div>
                    </div>
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

                {/*<div className={styles.shortcutContainer}>
                </div>


                <div className={styles.shortcutContainer}>
                    <div className={styles.shortcutDescriptionBox}>
                        <div className={styles.shortcutDescription}>
                            Save current page
                        </div>
                        <div className={styles.shortcutDescription}>
                            Annotate highlighted text
                        </div>
                        <div className={styles.shortcutDescription}>
                            Full-Text search pages and highlights
                        </div>
                    </div>
                    <div className={styles.shortcutNameBox}>
                        <div className={styles.shortcutName}>
                            alt+s
                        </div>
                        <div className={styles.shortcutName}>
                            alt+a
                        </div>
                        <div className={styles.shortcutName}>
                            alt+d
                        </div>
                    </div>
                </div>*/}
                <ButtonBar>
                    <PrimaryAction
                        label={'Try it out'}
                        onClick={() =>
                            window.open('https://worldbrain.io/actionTutorial')
                        }
                    />
                    <Margin horizontal="5px" />
                    <SecondaryAction
                        label={'Go to Dashboard'}
                        onClick={this.props.navToOverview}
                    />
                </ButtonBar>
            </div>
        )
    }

    private renderLoginStep() {
        return (
            <div className={styles.welcomeScreen}>
                <div className={styles.welcomeText}>Welcome to Memex</div>
                <SignInScreen
                    onSuccess={() => this.processEvent('onUserLogIn', null)}
                />
            </div>
        )
    }

    render() {
        return (
            <OnboardingBox {...this.props}>
                {this.state.shouldShowLogin
                    ? this.renderLoginStep()
                    : this.renderMainStep()}
            </OnboardingBox>
        )
    }
}
