import React from 'react'
import browser from 'webextension-polyfill'

import { IMPORT_TYPE } from '../constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import ReadwiseSettings from 'src/readwise-integration/ui/containers/readwise-settings'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { getFolder } from 'src/pkm-integrations/utils'
import { MemexLocalBackend } from 'src/pkm-integrations/background/backend'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import Checkbox from 'src/common-ui/components/Checkbox'
import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'
import { downloadMemexDesktop } from '@worldbrain/memex-common/lib/subscriptions/storage'

const localStyles = require('./Import.css')

const customSyncTagDefault = 'Memex Sync'

interface Props {
    isLoading: boolean
    loadingMsg?: string
    isStopped: boolean
    shouldRenderEsts: boolean
    shouldRenderProgress: boolean
    allowTypes: any
    getRootElement: () => HTMLElement
}

const Warning = ({ children }) => (
    <div className={localStyles.warning}>
        <Icon
            icon={'warning'}
            heightAndWidth="24px"
            color="greyScale1"
            hoverOff
        />
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

    serverToTalkTo = LOCAL_SERVER_ROOT

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
        dateformatObsidian: 'YYYY-MM-DD',
        titleformatLogseq: '{{{PageTitle}}}',
        titleformatObsidian: '{{{PageTitle}}}',
        // syncOnlyAnnotatedPagesLogseq: false,
        // syncOnlyAnnotatedPagesObsidian false,
        customTagsLogseq: '',
        customTagsObsidian: '',
        filterTagsLogseq: '',
        filterTagsObsidian: '',
        PKMSYNCremovewarning: false,
    }

    async componentDidMount(): Promise<void> {
        this.setState({
            serverLoadingState: 'loading',
        })
        // Check local storage for saved paths when the component mounts

        const foldersStorage = await browser.storage.local.get(
            'PKMSYNCpkmFolders',
        )
        const folders = foldersStorage.PKMSYNCpkmFolders

        if (folders) {
            this.setState({
                logSeqFolder: folders.logSeqFolder || null,
                obsidianFolder: folders.obsidianFolder || null,
            })
        }

        this.serverOnline = await new MemexLocalBackend({
            url: this.serverToTalkTo,
            storageAPI: browser.storage,
        }).isReachable()

        this.setState({
            serverOnline: this.serverOnline,
        })

        // Check every 3 seconds if the server is running and update the state accordingly
        setInterval(async () => {
            const serverOnline = await new MemexLocalBackend({
                url: this.serverToTalkTo,
                storageAPI: browser.storage,
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

        let PKMSYNCtitleformatLogseq = await browser.storage.local.get(
            'PKMSYNCtitleformatLogseq',
        )
        let PKMSYNCtitleformatObsidian = await browser.storage.local.get(
            'PKMSYNCtitleformatObsidian',
        )

        // Store the current state of the dateformatLogseq to the local storage if it returns null
        if (PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq == null) {
            PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq = this.state.titleformatLogseq
            await browser.storage.local.set({
                PKMSYNCtitleformatLogseq:
                    PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq,
            })
        }

        // Store the current state of the dateformatObsidian to the local storage if it returns null
        if (PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian == null) {
            PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian = this.state.titleformatObsidian
            await browser.storage.local.set({
                PKMSYNCtitleformatObsidian:
                    PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian,
            })
        }

        let PKMSYNCdateformatLogseq = await browser.storage.local.get(
            'PKMSYNCdateformatLogseq',
        )
        let PKMSYNCdateformatObsidian = await browser.storage.local.get(
            'PKMSYNCdateformatObsidian',
        )

        // Store the current state of the dateformatLogseq to the local storage if it returns null
        if (PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq == null) {
            PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq = this.state.dateformatLogseq
            await browser.storage.local.set({
                PKMSYNCdateformatLogseq:
                    PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq,
            })
        }

        // Store the current state of the dateformatObsidian to the local storage if it returns null
        if (PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian == null) {
            PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian = this.state.dateformatObsidian
            await browser.storage.local.set({
                PKMSYNCdateformatObsidian:
                    PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian,
            })
        }

        // fetch and store filter tags

        const filterTagsObsidian = await browser.storage.local.get(
            'PKMSYNCfilterTagsObsidian',
        )
        const filterTagsLogseq = await browser.storage.local.get(
            'PKMSYNCfilterTagsLogseq',
        )

        let PKMSYNCfilterTagsLogseq = await browser.storage.local.get(
            'PKMSYNCfilterTagsLogseq',
        )
        let PKMSYNCfilterTagsObsidian = await browser.storage.local.get(
            'PKMSYNCfilterTagsObsidian',
        )

        if (PKMSYNCfilterTagsLogseq.PKMSYNCfilterTagsLogseq == null) {
            PKMSYNCfilterTagsLogseq.PKMSYNCfilterTagsLogseq = this.state.filterTagsLogseq
            await browser.storage.local.set({
                PKMSYNCfilterTagsLogseq: this.state.filterTagsLogseq,
            })
        }

        // Store the current state of the customTagsObsidian to the local storage if it returns null
        if (PKMSYNCfilterTagsObsidian.PKMSYNCfilterTagsObsidian == null) {
            PKMSYNCfilterTagsObsidian.PKMSYNCfilterTagsObsidian = this.state.filterTagsObsidian
            await browser.storage.local.set({
                PKMSYNCfilterTagsObsidian:
                    PKMSYNCfilterTagsObsidian.PKMSYNCfilterTagsObsidian,
            })
        }

        // fetch and store customSync Tags
        const customTagsObsidian = await browser.storage.local.get(
            'PKMSYNCcustomTagsObsidian',
        )
        const customTagsLogseq = await browser.storage.local.get(
            'PKMSYNCcustomTagsLogseq',
        )

        let PKMSYNCcustomTagsLogseq = await browser.storage.local.get(
            'PKMSYNCcustomTagsLogseq',
        )
        let PKMSYNCcustomTagsObsidian = await browser.storage.local.get(
            'PKMSYNCcustomTagsObsidian',
        )

        if (PKMSYNCcustomTagsLogseq.PKMSYNCcustomTagsLogseq == null) {
            await browser.storage.local.set({
                PKMSYNCcustomTagsLogseq: customSyncTagDefault,
            })
        }
        let PKMSYNCremovewarning = await browser.storage.local.get(
            'PKMSYNCremovewarning',
        )

        if (PKMSYNCremovewarning.PKMSYNCremovewarning == null) {
            await browser.storage.local.set({
                PKMSYNCremovewarning: false,
            })
        }

        // Store the current state of the customTagsObsidian to the local storage if it returns null
        if (PKMSYNCcustomTagsObsidian.PKMSYNCcustomTagsObsidian == null) {
            await browser.storage.local.set({
                PKMSYNCcustomTagsObsidian: customSyncTagDefault,
            })
        }

        this.setState({
            dateformatLogseq:
                PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq != null
                    ? PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq
                    : this.state.dateformatLogseq,
            dateformatObsidian:
                PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian != null
                    ? PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian
                    : this.state.dateformatObsidian,
            titleformatLogseq:
                PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq != null
                    ? PKMSYNCtitleformatLogseq.PKMSYNCtitleformatLogseq
                    : this.state.titleformatLogseq,
            titleformatObsidian:
                PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian != null
                    ? PKMSYNCtitleformatObsidian.PKMSYNCtitleformatObsidian
                    : this.state.titleformatObsidian,
            customTagsObsidian:
                customTagsObsidian.PKMSYNCcustomTagsObsidian ??
                customSyncTagDefault,
            PKMSYNCremovewarning:
                PKMSYNCremovewarning.PKMSYNCremovewarning ?? false,
            customTagsLogseq:
                customTagsLogseq.PKMSYNCcustomTagsLogseq ??
                customSyncTagDefault,
            filterTagsObsidian: filterTagsObsidian.PKMSYNCfilterTagsObsidian,
            filterTagsLogseq: filterTagsLogseq.PKMSYNCfilterTagsLogseq,
            // syncOnlyAnnotatedPagesLogseq:
            //     syncOnlyAnnotatedPagesLogseq.PKMSYNCsyncOnlyAnnotatedPagesLogseq,
            // syncOnlyAnnotatedPagesObsidian:
            //     syncOnlyAnnotatedPagesObsidian.PKMSYNCsyncOnlyAnnotatedPagesObsidian,
            serverLoadingState: 'success',
            serverOnline: this.serverOnline,
        })
    }

    getSystemArchAndOS = async () => {
        let os
        let arch
        await browser.runtime.getPlatformInfo().then(function (info) {
            os = info.os
            arch = info.arch
        })

        if (arch === 'aarch64' || arch === 'arm' || arch === 'arm64') {
            arch = 'arm'
        }
        if (arch === 'x86-64') {
            arch = 'x64'
        }

        return {
            arch,
            os,
        }
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

    private async setFolderForPKM(pkmToSync: string) {
        const data = await getFolder(pkmToSync, { storageAPI: browser.storage })

        this.setState({
            logSeqFolder: data.logSeqFolder || null,
            obsidianFolder: data.obsidianFolder || null,
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
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SettingSection
                    icon={'logseqLogo'}
                    title={'Logseq'}
                    originalImage
                    description={
                        <div>
                            <span>Sync pages and annotations to LogSeq.</span>
                            <a
                                href="https://tutorials.memex.garden/tutorials/obsidian-and-logseq-sync"
                                target="_blank"
                                style={{ marginLeft: '5px' }}
                            >
                                <span>Go to tutorial {'>'} </span>
                            </a>
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
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
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
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
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
                                    <Warning>
                                        Only activate this sync on one of your
                                        devices to the same graph
                                    </Warning>
                                    <SelectFolderArea
                                        onClick={async () =>
                                            await this.setFolderForPKM('logseq')
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
                                                await this.setFolderForPKM(
                                                    'logseq',
                                                )
                                            }}
                                            icon={'folder'}
                                            size={'medium'}
                                            height={'44px'}
                                            type={'tertiary'}
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
                                                File name format{' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <SettingsLink
                                                    href="https://tutorials.memex.garden/tutorials/obsidian-and-logseq-sync"
                                                    target="_blank"
                                                >
                                                    Formatting Help
                                                </SettingsLink>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .titleformatLogseq
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            titleformatLogseq: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCtitleformatLogseq: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Only sync pages & annotations
                                                that have these Spaces (separate
                                                by comma, can include spaces){' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .filterTagsLogseq
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            filterTagsLogseq: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCfilterTagsLogseq: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Date format{' '}
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

                                        <TooltipBox
                                            tooltipText={
                                                <span>
                                                    Add custom tags like the
                                                    initial default "Memex Sync"
                                                    to <br />
                                                    make entries more filterable
                                                    in Logseq.
                                                </span>
                                            }
                                            placement="bottom"
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
                                        >
                                            <SettingsEntry>
                                                <SettingsLabel>
                                                    Sync tags for pages
                                                    (separate by comma, can
                                                    include Spaces){' '}
                                                </SettingsLabel>
                                                <SettingsValueBox>
                                                    <TextField
                                                        value={
                                                            this.state
                                                                .customTagsLogseq
                                                        }
                                                        onChange={(event) => {
                                                            this.setState({
                                                                customTagsLogseq: (event.target as HTMLInputElement)
                                                                    .value,
                                                            })
                                                            browser.storage.local.set(
                                                                {
                                                                    PKMSYNCcustomTagsLogseq: (event.target as HTMLInputElement)
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                        width={'300px'}
                                                    />
                                                </SettingsValueBox>
                                            </SettingsEntry>
                                        </TooltipBox>
                                        <SettingsEntry>
                                            <Checkbox
                                                label="Remove warning block"
                                                isChecked={
                                                    this.state
                                                        .PKMSYNCremovewarning
                                                }
                                                handleChange={async (event) => {
                                                    this.setState({
                                                        PKMSYNCremovewarning: !(event.target as HTMLInputElement)
                                                            .checked,
                                                    })
                                                    browser.storage.local.set({
                                                        PKMSYNCremovewarning: !(event.target as HTMLInputElement)
                                                            .checked,
                                                    })
                                                }}
                                            />
                                        </SettingsEntry>
                                    </SettingsContainer>
                                </>
                            ) : this.state.serverOnline ? (
                                <InstructionsSection>
                                    <InstructionsText>
                                        Select the "pages" folder in your Logseq
                                        graph folder to sync pages and their
                                        annotations to.
                                    </InstructionsText>
                                    <PrimaryAction
                                        label={'Select LogSeq Folder'}
                                        onClick={async (event) => {
                                            event.stopPropagation()
                                            await this.setFolderForPKM('logseq')
                                        }}
                                        icon={'folder'}
                                        size={'medium'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </InstructionsSection>
                            ) : (
                                <InstructionsSection>
                                    <InstructionsText>
                                        Download and/or run the Memex Sync
                                        Helper to get started. The menu tray
                                        icon is visible when its active.
                                    </InstructionsText>
                                    <PrimaryAction
                                        label={'Download Sync Helper'}
                                        onClick={async (event) => {
                                            const url = await downloadMemexDesktop(
                                                await this.getSystemArchAndOS(),
                                            )

                                            window.open(url, '_blank')
                                        }}
                                        icon={'inbox'}
                                        size={'medium'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </InstructionsSection>
                            )}
                        </>
                    )}
                </SettingSection>
            </div>
        )
    }

    private renderObsidianIntegration() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return (
            <div>
                <SettingSection
                    icon={'obsidianLogo'}
                    title={'Obsidian'}
                    originalImage
                    description={
                        <div>
                            <span>Sync pages and annotations to Obsidian.</span>
                            <a
                                href="https://tutorials.memex.garden/tutorials/obsidian-and-logseq-sync"
                                target="_blank"
                                style={{ marginLeft: '5px' }}
                            >
                                <span>Go to tutorial {'>'} </span>
                            </a>
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
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
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
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
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
                                            await this.setFolderForPKM(
                                                'obsidian',
                                            )
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
                                                await this.setFolderForPKM(
                                                    'obsidian',
                                                )
                                            }}
                                            icon={'folder'}
                                            size={'medium'}
                                            type={'tertiary'}
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
                                                File name format{' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <SettingsLink
                                                    href="https://tutorials.memex.garden/tutorials/obsidian-and-logseq-sync"
                                                    target="_blank"
                                                >
                                                    Formatting Help
                                                </SettingsLink>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .titleformatObsidian
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            titleformatObsidian: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCtitleformatObsidian: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Date format{' '}
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
                                        <SettingsEntry>
                                            <SettingsLabel>
                                                Only sync pages & annotations
                                                that have these Spaces (separate
                                                by comma, can include spaces){' '}
                                            </SettingsLabel>
                                            <SettingsValueBox>
                                                <TextField
                                                    value={
                                                        this.state
                                                            .filterTagsObsidian
                                                    }
                                                    onChange={(event) => {
                                                        this.setState({
                                                            filterTagsObsidian: (event.target as HTMLInputElement)
                                                                .value,
                                                        })
                                                        browser.storage.local.set(
                                                            {
                                                                PKMSYNCfilterTagsObsidian: (event.target as HTMLInputElement)
                                                                    .value,
                                                            },
                                                        )
                                                    }}
                                                    width={'300px'}
                                                />
                                            </SettingsValueBox>
                                        </SettingsEntry>
                                        <TooltipBox
                                            tooltipText={
                                                <span>
                                                    Add custom tags like the
                                                    initial default "Memex Sync"
                                                    to <br />
                                                    make entries more filterable
                                                    in Obsidian.
                                                </span>
                                            }
                                            placement="bottom"
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
                                        >
                                            <SettingsEntry>
                                                <SettingsLabel>
                                                    Sync tags for pages
                                                    (separate by comma, can
                                                    include Spaces){' '}
                                                </SettingsLabel>
                                                <SettingsValueBox>
                                                    <TextField
                                                        value={
                                                            this.state
                                                                .customTagsObsidian
                                                        }
                                                        onChange={(event) => {
                                                            this.setState({
                                                                customTagsObsidian: (event.target as HTMLInputElement)
                                                                    .value,
                                                            })
                                                            browser.storage.local.set(
                                                                {
                                                                    PKMSYNCcustomTagsObsidian: (event.target as HTMLInputElement)
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                        width={'300px'}
                                                    />
                                                </SettingsValueBox>
                                            </SettingsEntry>
                                        </TooltipBox>
                                        <SettingsEntry>
                                            <Checkbox
                                                label="Remove warning block"
                                                isChecked={
                                                    this.state
                                                        .PKMSYNCremovewarning
                                                }
                                                handleChange={async (event) => {
                                                    this.setState({
                                                        PKMSYNCremovewarning: (event.target as HTMLInputElement)
                                                            .checked,
                                                    })
                                                    browser.storage.local.set({
                                                        PKMSYNCremovewarning: (event.target as HTMLInputElement)
                                                            .checked,
                                                    })
                                                }}
                                            />
                                        </SettingsEntry>
                                    </SettingsContainer>
                                </>
                            ) : this.state.serverOnline ? (
                                <InstructionsSection>
                                    <InstructionsText>
                                        Select a folder in your Obsidian graph
                                        folder to sync your pages and
                                        annotations to.
                                    </InstructionsText>
                                    <PrimaryAction
                                        label={'Select Obsidian Folder'}
                                        onClick={async (event) => {
                                            event.stopPropagation()
                                            await this.setFolderForPKM(
                                                'obsidian',
                                            )
                                        }}
                                        icon={'folder'}
                                        size={'medium'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </InstructionsSection>
                            ) : (
                                <InstructionsSection>
                                    <InstructionsText>
                                        Download and/or run the Memex Sync
                                        Helper to get started. The menu tray
                                        icon is visible when its active.
                                    </InstructionsText>
                                    <PrimaryAction
                                        label={'Download Sync Helper'}
                                        onClick={async (event) => {
                                            const url = await downloadMemexDesktop(
                                                await this.getSystemArchAndOS(),
                                            )

                                            window.open(url, '_blank')
                                        }}
                                        icon={'inbox'}
                                        size={'medium'}
                                        type={'secondary'}
                                        padding={'0 8px 0 4px'}
                                    />
                                </InstructionsSection>
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

const Instructions = styled.div`
    font-size: 16px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale6};
    margin-bottom: 10px;
`
const SettingsLabel = styled.div`
    font-size: 16px;
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
    font-size: 16px;
    font-weight: 400;
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
