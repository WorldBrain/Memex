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
import { browser } from 'webextension-polyfill-ts'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { getPkmSyncKey } from 'src/pkm-integrations/background/backend/utils'
import { MemexLocalBackend } from 'src/pkm-integrations/background/backend'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

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

    serverOnline: any

    state = {
        showDiscordDemo: false,
        logSeqFolder: null,
        obsidianFolder: null,
        serverOnline: false,
        serverLoadingState: 'pristine',
        bufferLimitReached: false,
        hasSyncEverBeenRunning: false,
        dateformatLogseq: 'MMM Do, YYYY',
        dateformatObsidian: 'YYYY-DD-MM',
    }

    async componentDidMount(): Promise<void> {
        // Check local storage for saved paths when the component mounts
        this.getPathsFromLocalStorage()

        this.setState({
            serverLoadingState: 'loading',
        })

        this.serverOnline = await new MemexLocalBackend({
            url: 'http://localhost:11922',
        }).isReachable()

        console.log('this.server', this.serverOnline)

        // Check every 3 seconds if the server is running and update the state accordingly
        setInterval(async () => {
            const serverOnline = await new MemexLocalBackend({
                url: 'http://localhost:11922',
            }).isReachable()

            this.setState({
                serverOnline: serverOnline,
            })
        }, 3000)

        const bufferMaxReached = await browser.storage.local.get(
            'PKMSYNCbufferMaxReached',
        )
        if (bufferMaxReached.PKMSYNCbufferMaxReached) {
            this.setState({
                bufferLimitReached: true,
            })
        }
        const syncWasSetupBefore = await browser.storage.local.get(
            'PKMSYNCsyncWasSetupBefore',
        )

        const syncExists = syncWasSetupBefore.PKMSYNCsyncWasSetupBefore
            ? true
            : false

        if (syncExists) {
            this.setState({
                hasSyncEverBeenRunning: true,
            })
        }

        const PKMSYNCdateformatLogseq = await browser.storage.local.get(
            'PKMSYNCdateformatLogseq',
        )
        const PKMSYNCdateformatObsidian = await browser.storage.local.get(
            'PKMSYNCdateformatObsidian',
        )

        this.setState({
            dateformatLogseq: PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq,
            dateformatObsidian:
                PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian,
            serverLoadingState: 'success',
            serverOnline: this.serverOnline,
        })
    }

    private async getPathsFromLocalStorage() {
        const data = await browser.storage.local.get('PKMSYNCpkmFolders')

        if (data.PKMSYNCpkmFolders) {
            this.setState({
                logSeqFolder: data.PKMSYNCpkmFolders.logSeqFolder || null,
                obsidianFolder: data.PKMSYNCpkmFolders.obsidianFolder || null,
            })
        }
    }

    private getFolder = async (pkmToSync: string) => {
        const pkmSyncKey = await getPkmSyncKey()

        const getFolderPath = async (pkmToSync: string) => {
            const response = await fetch(
                'http://localhost:11922/set-directory',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pkmSyncType: pkmToSync,
                        syncKey: pkmSyncKey,
                    }),
                },
            )
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const directoryPath = await response.text()
            return directoryPath
        }

        const folderPath = await getFolderPath(pkmToSync)

        console.log('folderPath', folderPath)
        if (pkmToSync === 'logseq') {
            this.setState({ logSeqFolder: folderPath })
        } else if (pkmToSync === 'obsidian') {
            this.setState({ obsidianFolder: folderPath })
        }

        // Save to local storage
        await browser.storage.local.set({
            PKMSYNCpkmFolders: {
                logSeqFolder: this.state.logSeqFolder,
                obsidianFolder: this.state.obsidianFolder,
            },
        })
    }

    private removeFolder = async (pkmToUnsync: string) => {
        // Set state to empty based on which folder you want to remove
        if (pkmToUnsync === 'logseq') {
            this.setState({ logSeqFolder: null })
        } else if (pkmToUnsync === 'obsidian') {
            this.setState({ obsidianFolder: null })
        }

        // Update local storage by getting the current folders first, then updating them
        const data = await browser.storage.local.get('PKMSYNCpkmFolders')
        const currentFolders = data.PKMSYNCpkmFolders || {}

        if (pkmToUnsync === 'logseq') {
            currentFolders.logSeqFolder = null
        } else if (pkmToUnsync === 'obsidian') {
            currentFolders.obsidianFolder = null
        }

        await browser.storage.local.set({ PKMSYNCpkmFolders: currentFolders })
    }

    private renderLogSeqIntegration() {
        return (
            <div>
                <SettingSection
                    icon={'logseqLogo'}
                    title={'Logseq'}
                    originalImage
                    description={
                        <div>
                            <span>
                                Automatically sync pages and annotations to
                                LogSeq.
                            </span>
                        </div>
                    }
                >
                    {this.state.hasSyncEverBeenRunning && (
                        <>
                            {this.state.serverOnline ? (
                                <ServerOnline>
                                    <Icon
                                        icon={'check'}
                                        heightAndWidth="24px"
                                        color="prime1"
                                        hoverOff
                                    />
                                    Sync Helper is Online
                                </ServerOnline>
                            ) : (
                                <ServerOnline>
                                    {this.state.bufferLimitReached ? (
                                        <TooltipBox
                                            tooltipText={
                                                'Sync was not running in a while, so we stopped buffering updates'
                                            }
                                            placement={'bottom'}
                                        >
                                            <SyncStatusContent>
                                                <Icon
                                                    icon={'removeX'}
                                                    heightAndWidth="24px"
                                                    color="warning"
                                                    hoverOff
                                                />
                                                Buffer Limit Reached
                                            </SyncStatusContent>
                                        </TooltipBox>
                                    ) : (
                                        <TooltipBox
                                            tooltipText={
                                                'Sync is not running but we have been buffering your last updates (up to 2000)'
                                            }
                                            placement={'bottom'}
                                        >
                                            <SyncStatusContent>
                                                <Icon
                                                    icon={'removeX'}
                                                    heightAndWidth="24px"
                                                    color="warning"
                                                    hoverOff
                                                />
                                                Sync Helper is Offline
                                            </SyncStatusContent>
                                        </TooltipBox>
                                    )}
                                </ServerOnline>
                            )}{' '}
                        </>
                    )}
                    {this.state.serverLoadingState === 'running' ? (
                        <>
                            <LoadingIndicator size={30} />
                        </>
                    ) : (
                        <>
                            {this.state.logSeqFolder !== null ? (
                                <>
                                    <SelectFolderArea
                                        onClick={async () =>
                                            await this.getFolder('logseq')
                                        }
                                    >
                                        <TextField
                                            icon={'folder'}
                                            value={
                                                this.state.logSeqFolder &&
                                                this.state.logSeqFolder.length
                                                    ? this.state.logSeqFolder
                                                    : 'Click to select folder'
                                            }
                                        />
                                        <PrimaryAction
                                            label={'Change Folder'}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                await this.getFolder('logseq')
                                            }}
                                            icon={'folder'}
                                            size={'medium'}
                                            height={'44px'}
                                            type={'secondary'}
                                            padding={'0 8px 0 4px'}
                                        />
                                        <PrimaryAction
                                            label={'Remove Folder'}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                await this.removeFolder(
                                                    'logseq',
                                                )
                                            }}
                                            icon={'removeX'}
                                            size={'medium'}
                                            height={'44px'}
                                            type={'tertiary'}
                                            padding={'0 8px 0 4px'}
                                        />
                                    </SelectFolderArea>
                                    <SettingsContainer>
                                        <SettingsTitle>Settings</SettingsTitle>
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Date format for page entries{' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <SettingsLink
                                                    href="https://devhints.io/moment"
                                                    target="_blank"
                                                >
                                                    Formatting Help
                                                </SettingsLink>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .dateformatLogseq
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            dateformatLogseq: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCdateformatLogseq: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                    </SettingsContainer>
                                </>
                            ) : this.state.serverOnline ? (
                                <PrimaryAction
                                    label={'Select LogSeq Folder'}
                                    onClick={async (event) => {
                                        event.stopPropagation()
                                        await this.getFolder('logseq')
                                    }}
                                    icon={'folder'}
                                    size={'medium'}
                                    height={'44px'}
                                    type={'secondary'}
                                    padding={'0 8px 0 4px'}
                                />
                            ) : (
                                <>
                                    <PrimaryAction
                                        label={'Download Sync Helper'}
                                        onClick={async (event) => {
                                            window.open(
                                                'https://github.com/WorldBrain/memex-local-sync/releases/latest',
                                                '_blank',
                                            )
                                        }}
                                        icon={'inbox'}
                                        size={'medium'}
                                        height={'44px'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </>
                            )}
                        </>
                    )}
                </SettingSection>
            </div>
        )
    }

    private renderObsidianIntegration() {
        return (
            <div>
                <SettingSection
                    icon={'obsidianLogo'}
                    title={'Obsidian'}
                    originalImage
                    description={
                        <div>
                            <span>
                                Automatically sync pages and annotations to
                                Obsidian.
                            </span>
                        </div>
                    }
                >
                    {this.state.hasSyncEverBeenRunning && (
                        <>
                            {this.state.serverOnline ? (
                                <ServerOnline>
                                    <Icon
                                        icon={'check'}
                                        heightAndWidth="24px"
                                        color="prime1"
                                        hoverOff
                                    />
                                    Sync Helper is Online
                                </ServerOnline>
                            ) : (
                                <ServerOnline>
                                    {this.state.bufferLimitReached ? (
                                        <TooltipBox
                                            tooltipText={
                                                'Sync was not running in a while, so we stopped buffering updates'
                                            }
                                            placement={'bottom'}
                                        >
                                            <SyncStatusContent>
                                                <Icon
                                                    icon={'removeX'}
                                                    heightAndWidth="24px"
                                                    color="warning"
                                                    hoverOff
                                                />
                                                Buffer Limit Reached
                                            </SyncStatusContent>
                                        </TooltipBox>
                                    ) : (
                                        <TooltipBox
                                            tooltipText={
                                                'Sync is not running but we have been buffering your last updates (up to 2000)'
                                            }
                                            placement={'bottom'}
                                        >
                                            <SyncStatusContent>
                                                <Icon
                                                    icon={'removeX'}
                                                    heightAndWidth="24px"
                                                    color="warning"
                                                    hoverOff
                                                />
                                                Sync Helper is Offline
                                            </SyncStatusContent>
                                        </TooltipBox>
                                    )}
                                </ServerOnline>
                            )}
                        </>
                    )}
                    {this.state.serverLoadingState === 'running' ? (
                        <>
                            <LoadingIndicator size={30} />
                        </>
                    ) : (
                        <>
                            {this.state.obsidianFolder !== null ? (
                                <>
                                    <SelectFolderArea
                                        onClick={async () =>
                                            await this.getFolder('obsidian')
                                        }
                                    >
                                        <TextField
                                            icon={'folder'}
                                            value={
                                                this.state.obsidianFolder &&
                                                this.state.obsidianFolder.length
                                                    ? this.state.obsidianFolder
                                                    : 'Click to select folder'
                                            }
                                            disabled
                                        />
                                        <PrimaryAction
                                            label={'Change Folder'}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                await this.getFolder('obsidian')
                                            }}
                                            icon={'folder'}
                                            size={'medium'}
                                            type={'secondary'}
                                            height={'44px'}
                                            padding={'0 8px 0 4px'}
                                        />
                                        <PrimaryAction
                                            label={'Remove Folder'}
                                            onClick={async (event) => {
                                                event.stopPropagation()
                                                await this.removeFolder(
                                                    'obsidian',
                                                )
                                            }}
                                            icon={'removeX'}
                                            size={'medium'}
                                            height={'44px'}
                                            type={'tertiary'}
                                            padding={'0 8px 0 4px'}
                                        />
                                    </SelectFolderArea>
                                    <SettingsContainer>
                                        <SettingsTitle>Settings</SettingsTitle>
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Date format for page entries{' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <SettingsLink
                                                    href="https://devhints.io/moment"
                                                    target="_blank"
                                                >
                                                    Formatting Help
                                                </SettingsLink>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .dateformatObsidian
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            dateformatObsidian: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCdateformatObsidian: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                    </SettingsContainer>
                                </>
                            ) : this.state.serverOnline ? (
                                <PrimaryAction
                                    label={'Select Obsidian Folder'}
                                    onClick={async (event) => {
                                        event.stopPropagation()
                                        await this.getFolder('obsidian')
                                    }}
                                    icon={'folder'}
                                    size={'medium'}
                                    type={'secondary'}
                                    height={'44px'}
                                    padding={'0 8px 0 4px'}
                                />
                            ) : (
                                <>
                                    <PrimaryAction
                                        label={'Download Sync Helper'}
                                        onClick={async (event) => {
                                            window.open(
                                                'https://github.com/WorldBrain/memex-local-sync/releases/latest',
                                                '_blank',
                                            )
                                        }}
                                        icon={'inbox'}
                                        size={'medium'}
                                        height={'44px'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </>
                            )}
                        </>
                    )}
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

    private renderReadwise() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SettingSection
                    icon={'readwise'}
                    title={'Readwise'}
                    originalImage
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
                {this.renderObsidianIntegration()}
                {this.renderLogSeqIntegration()}
                {this.renderReadwise()}
                {/* {this.renderDiscord()} */}
            </div>
        )
    }
}

export default Import

const SettingsContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 20px;
    margin-bottom: 20px;
    margin-top: 30px;
`

const SettingsTitle = styled.div`
    font-size: 18px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.greyScale6};
`

const SettingsEntry = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    grid-gap: 20px;
    justify-content: space-between;
`
const SettingsValueBox = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    grid-gap: 20px;
    justify-content: flex-end;
`

const SettingsLabel = styled.div`
    font-size: 14px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale5};
`
const SettingsLink = styled.a`
    font-size: 14px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.prime2};
`

const ServerOnline = styled.div`
    position: absolute;
    top: 30px;
    right: 30px;
    color: ${(props) => props.theme.colors.greyScale6};
    display: flex;
    align-items: center;
    grid-gap: 5px;
    border-radius: 5px;
    /* border: 1px solid ${(props) => props.theme.colors.greyScale3}; */
    font-size: 14px;

`
const SyncStatusContent = styled.div`

    color: ${(props) => props.theme.colors.greyScale6};
    display: flex;
    align-items: center;
    grid-gap: 5px;
    border-radius: 5px;
    /* border: 1px solid ${(props) => props.theme.colors.greyScale3}; */
    font-size: 14px;

`

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

const SelectFolderArea = styled.div`
    border-radius: 12px;
    display: grid;
    align-items: center;
    cursor: pointer;
    margin-bottom: 20px;
    display: flex;
    grid-gap: 10px;

    & * {
        cursor: pointer;
    }
`
