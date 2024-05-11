import * as React from 'react'
import AccountInfo from 'src/authentication/components/AccountInfo'
import AuthDialog from 'src/authentication/components/AuthDialog'
import styled from 'styled-components'
import type { State, Event, Dependencies } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import { LoadingContainer } from 'src/dashboard-refactor/styled-components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import { LOGIN_URL } from 'src/constants'
import checkBrowser from 'src/util/check-browser'
import browser, { Browser } from 'webextension-polyfill'

// interface Props {
//     initiallyShowSubscriptionModal?: boolean
//     refreshUser?: boolean
//     showSubscriptionModal: () => void
// }

export interface Props extends Dependencies {
    refreshUser?: boolean
    getRootElement: () => HTMLElement
    bgScriptBG: RemoteBGScriptInterface
    browserAPIs: Browser
}

export default class UserScreen extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Pick<Props, 'authBG'> = {
        authBG: runInBackground(),
    }

    async componentDidMount() {
        const user = await this.props.authBG.getCurrentUser()

        if (user == null) {
            const browserName = checkBrowser()
            const isFirefox = browserName === 'firefox'

            const isStaging = process.env.NODE_ENV === 'development'

            if (isFirefox || isStaging) {
                window.location.href = LOGIN_URL
            } else {
                const env = process.env.NODE_ENV
                let memexSocialUrl: string
                if (env === 'production') {
                    memexSocialUrl = 'https://memex.social/'
                } else {
                    memexSocialUrl = 'https://staging.memex.social/'
                }
                await browser.tabs.create({
                    url: `${memexSocialUrl}auth`,
                })
            }

            window.location.href = LOGIN_URL
        }

        this.processEvent('getCurrentUser', { currentUser: user })
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    getTitle() {
        if (this.state.authDialogMode === 'login') {
            return 'Welcome Back'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'Welcome to Memex'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'Reset your password'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'Check your Emails'
        }
    }

    getDescription() {
        if (this.state.authDialogMode === 'login') {
            return 'Login to continue'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'Sign up to get started'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'Enter the email you used to sign up for Memex'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'Check your Emails, and your Spam folder'
        }
    }

    getIcon() {
        if (this.state.authDialogMode === 'login') {
            return 'login'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'peopleFine'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'reload'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'mail'
        }
    }

    render() {
        return (this.state.loadState === 'running' ||
            this.state.currentUser == null) &&
            !this.state.isStagingEnv ? (
            <LoadingContainer>
                {this.state.currentUser === null && (
                    <InfoText>
                        Login via the page that opens or reload this page to get
                        there again
                    </InfoText>
                )}
                <LoadingIndicator size={50} />
            </LoadingContainer>
        ) : (
            this.state.loadState === 'success' && (
                <>
                    {this.state.currentUser === null ? (
                        <div>
                            <SettingSection
                                icon={this.getIcon()}
                                title={this.getTitle()}
                                description={this.getDescription()}
                            >
                                <AuthDialog
                                    onAuth={() => {
                                        window.location.reload()
                                    }}
                                    onModeChange={({ mode }) => {
                                        this.processEvent('setAuthDialogMode', {
                                            mode,
                                        })
                                    }}
                                    browserAPIs={browser}
                                />
                            </SettingSection>
                        </div>
                    ) : (
                        <AccountInfo
                            setAuthMode={(mode) => {
                                this.processEvent('setAuthDialogMode', {
                                    mode: mode,
                                })
                            }}
                            getRootElement={this.props.getRootElement}
                            bgScriptBG={this.props.bgScriptBG}
                            browserAPIs={browser}
                        />
                    )}
                </>
            )
        )
    }
}

const UserScreenContainer = styled.div`
    margin-bottom: 30px;
`

const Section = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
`
