import React from 'react'
import browser from 'webextension-polyfill'
import styled, { keyframes, css } from 'styled-components'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { SETTINGS_URL } from 'src/constants'
import { TaskState } from 'ui-logic-core/lib/types'

export interface Props {
    currentUser: AuthenticatedUser
    theme: MemexThemeVariant
    toggleTheme: () => void
    getRootElement: () => HTMLElement
    padding?: string
    iconSize?: string
    getFeatureBaseToken: () => Promise<string>
}
export interface State {
    isOpen: boolean
    showChat: boolean
    showFeedbackForm: boolean
    showChangeLog: boolean
    showTutorialBox: boolean
    currentUser: AuthenticatedUser | null
    loading: TaskState
    token?: string
}

export class HelpBtn extends React.PureComponent<Props, State> {
    private helpButtonRef = React.createRef<HTMLDivElement>()

    state = {
        isOpen: false,
        showChat: false,
        showFeedbackForm: false,
        showChangeLog: false,
        showTutorialBox: false,
        currentUser: null,
        loading: 'pristine' as TaskState,
        token: null,
    }

    private handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault()

        this.setState((state) => ({ isOpen: !state.isOpen }))
    }

    renderTutorialBox() {
        if (this.state.showTutorialBox) {
            return (
                <TutorialBox
                    tutorialId="all"
                    getRootElement={this.props.getRootElement}
                    onTutorialClose={() => {
                        this.setState({ showTutorialBox: false })
                    }}
                    isHeadless
                />
            )
        }
    }

    private renderMenu() {
        if (!this.state.isOpen) {
            return null
        }

        return (
            <PopoutBox
                targetElementRef={this.helpButtonRef.current}
                placement={'top-end'}
                offsetX={10}
                closeComponent={() =>
                    this.setState((state) => ({
                        isOpen: !state.isOpen,
                        showChat: false,
                        showFeedbackForm: false,
                        showChangeLog: false,
                    }))
                }
                getPortalRoot={this.props.getRootElement}
            >
                {this.state.showChat ||
                this.state.showFeedbackForm ||
                this.state.showChangeLog ? (
                    <ChatBox>
                        <LoadingIndicator size={30} />
                        <ChatFrame
                            src={
                                this.state.showFeedbackForm
                                    ? `https://memex.featurebase.app?jwt=${this.state.token}`
                                    : this.state.showChangeLog
                                    ? `https://memex.featurebase.app/changelog?jwt=${this.state.token}`
                                    : `https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599&user_email=${this.props.currentUser.email}`
                            }
                            height={600}
                            width={500}
                        />
                    </ChatBox>
                ) : (
                    <MenuList>
                        <MenuItem
                            onClick={() =>
                                this.setState({
                                    showChat: true,
                                })
                            }
                            top={true}
                        >
                            <Icon
                                filePath={icons.chatWithUs}
                                heightAndWidth="22px"
                                hoverOff
                                color={'greyScale1'}
                            />
                            Live Chat Support
                        </MenuItem>
                        <MenuItem
                            onClick={() =>
                                this.setState({
                                    showTutorialBox: !this.state
                                        .showTutorialBox,
                                })
                            }
                        >
                            <Icon
                                filePath={icons.helpIcon}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            Tutorials and FAQs
                            {this.renderTutorialBox()}
                        </MenuItem>
                        <MenuItem
                            onClick={async () => {
                                this.setState({
                                    loading: 'running',
                                })
                                const token = await this.props.getFeatureBaseToken()

                                if (token) {
                                    this.setState({
                                        token: token,
                                        showFeedbackForm: true,
                                    })
                                }
                            }}
                        >
                            <Icon
                                filePath={icons.sadFace}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            Feature Requests & Bugs
                        </MenuItem>
                        <MenuItem
                            onClick={() => window.open(SETTINGS_URL, '_blank')}
                        >
                            <Icon
                                filePath={icons.command}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            Keyboard Shortcuts
                        </MenuItem>
                        <MenuItem
                            onClick={async () => {
                                this.setState({
                                    loading: 'running',
                                })
                                const token = await this.props.getFeatureBaseToken()

                                if (token) {
                                    this.setState({
                                        token: token,
                                        showChangeLog: true,
                                    })
                                }
                            }}
                        >
                            <Icon
                                filePath={icons.clock}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            What's new?
                        </MenuItem>
                        <MenuItem
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/privacy',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.shield}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            Terms & Privacy
                        </MenuItem>
                        <MenuItem
                            onClick={() =>
                                window.open('https://x.com/memexgarden')
                            }
                        >
                            <Icon
                                filePath={icons.twitter}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            Twitter/X - @memexgarden
                        </MenuItem>
                        <FooterText>
                            Memex {browser.runtime.getManifest().version}
                        </FooterText>
                    </MenuList>
                )}
            </PopoutBox>
        )
    }

    render() {
        return (
            <HelpIconPosition>
                {this.renderMenu()}
                {window.location.href.includes('/overview') && (
                    <Icon
                        heightAndWidth={this.props.iconSize || '24px'}
                        color={
                            this.props.theme === 'dark'
                                ? 'greyScale5'
                                : 'greyScale4'
                        }
                        filePath={this.props.theme === 'dark' ? 'moon' : 'sun'}
                        onClick={() => this.props.toggleTheme()}
                        padding={this.props.padding}
                    />
                )}
                <Icon
                    filePath={icons.helpIcon}
                    heightAndWidth={this.props.iconSize || '24px'}
                    onClick={this.handleClick}
                    containerRef={this.helpButtonRef}
                    padding={this.props.padding}
                />
            </HelpIconPosition>
        )
    }
}

const ChatBox = styled.div`
    position: relative;
    height: 600px;
    width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`
const ChatFrame = styled.iframe`
    border: none;
    border-radius: 12px;
    position: absolute;
    top: 0px;
    left: 0px;
`

const MenuList = styled.div`
    display: flex;
    flex-direction: column;
    width: 300px;
    padding: 10px;
    position: relative;
    max-height: 360px;
    height: fit-content;
    grid-gap: 2px;
`

const HelpIconPosition = styled.div`
    display: flex;
    justify-content: space-between;
    height: fit-content;
    width: fit-content;
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 100;
    grid-gap: 10px;

    @media (max-width: 1100px) {
        display: none;
    }
`
const openAnimation = keyframes`
 0% { padding-bottom: 5px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const MenuItem = styled.div<{ top?: boolean }>`
    animation-name: ${openAnimation};
    animation-delay: 15ms;
    animation-duration: 0.1s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: backwards;
    overflow: hidden;
    height: 43px;
    display: flex;
    align-items: center;
    padding-bottom: 0px;

    border-radius: 8px;
    border: none;
    list-style: none;
    background-color: ${(props) => props.top && props.theme.colors.prime1};
    color: ${(props) =>
        props.top ? props.theme.colors.black : props.theme.colors.greyScale6};
    justify-content: ${(props) => props.top && 'center'};
    font-weight: 400;
    height: 40px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    text-decoration: none;
    font-size: 14px;
    grid-gap: 10px;

    cursor: pointer;

    & * {
        cursor: pointer;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

const Link = styled.a<{ top }>`
    color: ${(props) =>
        props.top ? props.theme.colors.black : props.theme.colors.white};
    font-weight: ${(props) => (props.top ? '600' : '400')};
    height: 40px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    text-decoration: none;
    font-size: 14px;
    grid-gap: 10px;
`

const FooterText = styled.div`
    height: 20px;
    display: flex;
    font-size: 14px;
    align-items: center;
    font-weight: 300;
    color: ${(props) => props.theme.colors.greyScale5};
    padding: 0px 10px 0 10px;
`
