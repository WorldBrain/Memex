import React from 'react'

import AdvSettings from './AdvSettingsContainer'
import { IMPORT_TYPE } from '../constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ReadwiseSettings from 'src/readwise-integration/ui/containers/readwise-settings'
import { remoteFunctions } from 'src/util/remote-functions-background'
import { runInBackground } from 'src/util/webextensionRPC'
import { ReadwiseInterface } from 'src/readwise-integration/background/types/remote-interface'
import * as icons from 'src/common-ui/components/design-library/icons'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./Import.css')

interface Props {
    isLoading: boolean
    loadingMsg?: string
    isStopped: boolean
    shouldRenderEsts: boolean
    shouldRenderProgress: boolean
    allowTypes: any
}

const Warning = ({ children }) => (
    <div className={localStyles.warning}>
        <img src="/img/caution.png" className={localStyles.icon} />{' '}
        <p className={localStyles.warningText}>{children}</p>
    </div>
)

class Import extends React.PureComponent<Props> {
    // private renderSettings() {
    //     if (!this.props.shouldRenderEsts) {
    //         return
    //     }

    //     return <AdvSettings />
    // }

    state = {
        showDiscordDemo: false,
    }

    private renderReadwise() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SettingSection
                    icon={'readwise'}
                    title={'ReadWise.io integration'}
                    description={
                        <div>
                            <span>
                                Automatically push all your highlights to
                                Readwise. Here you can get the{' '}
                                <a
                                    target="_blank"
                                    href="https://readwise.io/access_token"
                                >
                                    API key
                                </a>
                                .
                            </span>
                        </div>
                    }
                >
                    <ReadwiseSettings />
                </SettingSection>
            </div>
        )
    }
    private renderDiscord() {
        return (
            <div>
                <SettingSection
                    icon={'discord'}
                    title={'Discord Channel Sync'}
                    description={
                        'Sync all links/videos/events posted in a discord channel to Memex Spaces.'
                    }
                >
                    <WatchVideoButton>
                        <PrimaryAction
                            type="primary"
                            size="medium"
                            onClick={() => {
                                this.setState({
                                    showDiscordDemo: true,
                                })
                            }}
                            label="Watch Demo"
                        />
                    </WatchVideoButton>
                    {this.state.showDiscordDemo && (
                        <DiscordDemoVideoContainer>
                            <DiscordDemoVideo src="https://share.descript.com/embed/ks1YdGjS5XS" />
                        </DiscordDemoVideoContainer>
                    )}
                    <InstructionsSection>
                        <InstructionsEntry>
                            <InstructionsPill>Step 1</InstructionsPill>
                            <InstructionsText>
                                Install Bot in Server (needs Admin permissions)
                            </InstructionsText>
                            <PrimaryAction
                                type="secondary"
                                size="small"
                                onClick={() => {
                                    window.open(
                                        'https://links.memex.garden/bots/discord',
                                    )
                                }}
                                label="Install Bot"
                            />
                        </InstructionsEntry>
                        <InstructionsEntry>
                            <InstructionsPill>Step 2</InstructionsPill>
                            <InstructionsText>
                                Type{' '}
                                <MemexSyncCommand>/memex-sync</MemexSyncCommand>{' '}
                                into text field of channel you want to sync
                            </InstructionsText>
                        </InstructionsEntry>
                    </InstructionsSection>
                </SettingSection>
            </div>
        )
    }

    private renderSectionIcon() {
        if (this.props.shouldRenderProgress) {
            return 'play'
        }

        if (this.props.isStopped) {
            return 'check'
        }

        if (this.props.shouldRenderEsts) {
            return 'heartEmpty'
        }
    }

    private renderSectionTitle() {
        if (this.props.shouldRenderProgress) {
            return 'Import Progress'
        }

        if (this.props.isStopped) {
            return 'Import Finished'
        }

        if (this.props.shouldRenderEsts) {
            return 'Import Bookmarks from other services'
        }
    }

    private renderSectionDescription() {
        if (this.props.shouldRenderProgress) {
            return (
                <>
                    The import may freeze because of a browser setting. Go to{' '}
                    <a
                        className={localStyles.link}
                        target="_blank"
                        href="https://links.memex.garden/import_bug"
                    >
                        <b>links.memex.garden/import_bug</b>
                    </a>{' '}
                    to fix it.
                </>
            )
        }

        if (this.props.isStopped) {
            return ''
        }

        if (this.props.shouldRenderEsts) {
            return 'Import your existing bookmarks of your browser, and other services like Pocket, Pinboard, Raindrop or Diigo.'
        }
    }

    render() {
        const {
            isLoading,
            loadingMsg,
            isStopped,
            children,
            allowTypes,
        } = this.props

        return (
            <div>
                {this.renderDiscord()}
                <SettingSection
                    title={this.renderSectionTitle()}
                    description={this.renderSectionDescription()}
                    icon={this.renderSectionIcon()}
                >
                    <div className={localStyles.mainContainer}>
                        <div className={localStyles.importTableContainer}>
                            {children}
                            {/* {this.renderSettings()} */}
                        </div>
                        {isLoading && !allowTypes[IMPORT_TYPE.OTHERS].length && (
                            <LoadingBlocker>
                                <LoadingIndicator />
                            </LoadingBlocker>
                        )}
                    </div>
                </SettingSection>
                {this.renderReadwise()}
            </div>
        )
    }
}

export default Import

const WatchVideoButton = styled.div`
    display: flex;
    position: absolute;
    top: 30px;
    right: 30px;
`

const DiscordDemoVideoContainer = styled.div`
    height: 0px;
    width: 100%;
    padding-top: 56.25%;
    position: relative;
    margin-bottom: 20px;
`

const DiscordDemoVideo = styled.iframe`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 10px;
`

const InstructionsSection = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 20px;
`

const InstructionsEntry = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    grid-gap: 20px;
`

const InstructionsPill = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 400;
    width: 80px;
    justify-content: center;
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale6};
`

const InstructionsText = styled.div`
    font-size: 14px;
    font-weight: 300;
    color: ${(props) => props.theme.colors.greyScale6};
`

const MemexSyncCommand = styled.span`
    color: ${(props) => props.theme.colors.prime1};
`

const LoadingBlocker = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 101%;
    width: 101%;
    text-align: center;
    z-index: 25000000;
    background: ${(props) => props.theme.colors.greyScale1};
`
