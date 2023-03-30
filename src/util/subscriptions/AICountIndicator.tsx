import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import React from 'react'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    createSyncSettingsStore,
    SyncSettingsStore,
} from 'src/sync-settings/util'
import styled, { css } from 'styled-components'
import browser, { Storage } from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY, DEFAULT_COUNTER_STORAGE_KEY } from './constants'

export interface Props {
    syncSettingsBG: RemoteSyncSettingsInterface
}

interface State {
    currentCount: number
    totalCount: number
    shouldShow: boolean
    showTooltip: boolean
    openAIKey: string
    showSaveButton: boolean
    allowForKey: boolean
}

export class AICounterIndicator extends React.Component<Props, State> {
    private tooltipButtonRef = React.createRef<HTMLDivElement>()
    private syncSettings: SyncSettingsStore<'openAI'>

    state: State = {
        currentCount: DEFAULT_COUNTER_STORAGE_KEY.cQ,
        totalCount: DEFAULT_COUNTER_STORAGE_KEY.sQ,
        shouldShow: false,
        showTooltip: false,
        openAIKey: '',
        showSaveButton: false,
        allowForKey: false,
    }

    constructor(props: Props) {
        super(props)
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: props.syncSettingsBG,
        })
    }

    private get leftOverBlocks(): number {
        return this.state.totalCount - this.state.currentCount
    }

    async componentDidMount() {
        const result = await browser.storage.local.get(COUNTER_STORAGE_KEY)
        if (result[COUNTER_STORAGE_KEY].sQ != null) {
            this.setState({
                totalCount: parseInt(result[COUNTER_STORAGE_KEY].sQ),
                currentCount: result[COUNTER_STORAGE_KEY].cQ,
            })
        }

        if (result[COUNTER_STORAGE_KEY].s > 10000) {
            this.setState({ allowForKey: true })
        }

        this.setState({ shouldShow: true })
        browser.storage.onChanged.addListener(this.counterStorageListener)
        const openAIKey = await this.syncSettings.openAI.get('apiKey')

        if (openAIKey) {
            this.setState({
                openAIKey: openAIKey,
            })
        } else {
            await this.syncSettings.openAI.set('apiKey', '')
            this.setState({
                openAIKey: openAIKey,
            })
        }

        // await browser.storage.local.get(OPEN_AI_API_KEY).then((result) => {
        //     if (
        //         result[OPEN_AI_API_KEY].sQ != null &&
        //         result[COUNTER_STORAGE_KEY].sQ < 10000
        //     ) {
        //         this.setState({
        //             shouldShow: true,
        //             totalCount: parseInt(result[COUNTER_STORAGE_KEY].sQ),
        //             currentCount: result[COUNTER_STORAGE_KEY].cQ,
        //         })
        //         browser.storage.onChanged.addListener((changes) =>
        //             this.counterStorageListenerExecution(changes),
        //         )
        //     }
        // })
    }

    private whichCheckOutURL = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.garden/upgradeNotification'
        } else {
            return 'https://memex.garden/upgradeStaging'
        }
    }

    async componentWillUnmount() {
        if (this.state.shouldShow) {
            browser.storage.onChanged.removeListener(
                this.counterStorageListener,
            )
        }
    }

    private counterStorageListener = (
        changes: Record<string, Storage.StorageChange>,
    ) => {
        if (changes[COUNTER_STORAGE_KEY]?.newValue != null) {
            this.setState({
                currentCount: changes[COUNTER_STORAGE_KEY].newValue.cQ,
                totalCount: parseInt(changes[COUNTER_STORAGE_KEY].newValue.sQ),
            })
        }

        return undefined
    }

    renderTooltip = () => {
        return (
            <PopoutBox
                placement="top-start"
                targetElementRef={this.tooltipButtonRef.current}
                closeComponent={() => this.setState({ showTooltip: false })}
                offsetX={10}
            >
                <InfoTooltipContainer>
                    {this.state.openAIKey.length === 0 && (
                        <>
                            <InfoTooltipTitleArea>
                                <InfoTooltipTitleBox>
                                    <InfoTooltipTitle>
                                        You have{' '}
                                        <strong>{this.leftOverBlocks}</strong>{' '}
                                        AI requests left
                                    </InfoTooltipTitle>
                                    <InfoTooltipSubTitle>
                                        Resets on the 1st of every month
                                    </InfoTooltipSubTitle>
                                </InfoTooltipTitleBox>
                                <PrimaryAction
                                    label="Upgrade"
                                    icon={'longArrowRight'}
                                    padding="0px 5px 0 10px"
                                    onClick={() => {
                                        window.open(
                                            this.whichCheckOutURL(),
                                            '_blank',
                                        )
                                    }}
                                    size="medium"
                                    type="primary"
                                    iconPosition="right"
                                />
                            </InfoTooltipTitleArea>
                            {this.state.allowForKey && <ORBox>- or - </ORBox>}
                        </>
                    )}
                    {this.state.allowForKey && (
                        <OpenAIKeyContainer>
                            <OpenAIKeyTitle>OpenAI API Key</OpenAIKeyTitle>
                            <OpenAIKeySubTitle>
                                Add your own API key to get unlimited AI
                                requests.
                            </OpenAIKeySubTitle>
                            <KeyBox>
                                <TextField
                                    placeholder={
                                        this.state.openAIKey.length > 0
                                            ? this.state.openAIKey
                                            : 'Enter API Key'
                                    }
                                    value={this.state.openAIKey}
                                    onChange={(e) => {
                                        this.setState({
                                            openAIKey: (e.target as HTMLInputElement)
                                                .value,
                                            showSaveButton: true,
                                        })
                                    }}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            await this.syncSettings.openAI.set(
                                                'apiKey',
                                                this.state.openAIKey,
                                            )
                                            this.setState({
                                                showSaveButton: false,
                                            })
                                        }
                                    }}
                                />
                                {this.state.showSaveButton && (
                                    <PrimaryAction
                                        onClick={async () => {
                                            await this.syncSettings.openAI.set(
                                                'apiKey',
                                                this.state.openAIKey,
                                            )
                                            this.setState({
                                                showSaveButton: false,
                                            })
                                        }}
                                        label="Save"
                                        type="secondary"
                                        size="medium"
                                    />
                                )}
                            </KeyBox>
                            {/* <ModelSwitchBox>
                            <ModelSwitchTitle>
                                Model to use for queries
                            </ModelSwitchTitle>
                            <ModelButton
                                isActive={this.state.selectedModel === 'GPT-4'}
                                onClick={() => {
                                    this.setState({
                                        selectedModel: 'GPT-4',
                                    })
                                    this.props.syncSettingsBG.openAI.set(
                                        'openAIkey',
                                        this.state.openAIKey,
                                    )
                                }}
                            >
                                GPT-4
                            </ModelButton>
                            <ModelButton
                                isActive={this.state.selectedModel === 'GPT-4'}
                                onClick={() => {
                                    this.setState({
                                        selectedModel: 'GPT-4',
                                    })
                                    this.props.syncSettingsBG.openAI.set(
                                        'openAIkey',
                                        this.state.openAIKey,
                                    )
                                }}
                            >
                                GPT-3.5
                            </ModelButton>
                        </ModelSwitchBox> */}
                        </OpenAIKeyContainer>
                    )}
                </InfoTooltipContainer>
            </PopoutBox>
        )
    }

    render() {
        const progressPercentNumber =
            (100 - (this.state.currentCount / this.state.totalCount) * 100) *
            3.6

        if (!this.state.shouldShow) {
            return null
        } else {
            return this.state.totalCount < 10000 &&
                this.state.openAIKey?.length === 0 ? (
                <TooltipBox
                    placement="top"
                    tooltipText={
                        <TooltipTextContainer>
                            <TooltipTextTop>
                                You have <strong>{this.leftOverBlocks}</strong>{' '}
                                pages left
                            </TooltipTextTop>
                            <TooltipTextBottom>
                                Click for more info
                            </TooltipTextBottom>
                        </TooltipTextContainer>
                    }
                >
                    <CounterContainer
                        progress={progressPercentNumber}
                        ref={this.tooltipButtonRef}
                        onClick={() => this.setState({ showTooltip: true })}
                    >
                        <InnerContainer> {this.leftOverBlocks}</InnerContainer>
                    </CounterContainer>
                    {this.state.showTooltip && this.renderTooltip()}
                </TooltipBox>
            ) : (
                <TooltipBox
                    placement="top"
                    tooltipText={
                        <TooltipTextContainer>
                            <TooltipTextTop>Change your API key</TooltipTextTop>
                        </TooltipTextContainer>
                    }
                >
                    <Icon
                        icon="settings"
                        heightAndWidth="22px"
                        onClick={() => this.setState({ showTooltip: true })}
                        containerRef={this.tooltipButtonRef}
                    />
                    {this.state.showTooltip && this.renderTooltip()}
                </TooltipBox>
            )
        }
    }
}

const ORBox = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
`

const OpenAIKeyContainer = styled.div`
    width: 100%;
`

const OpenAIKeyTitle = styled.div`
    font-weight: bold;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    margin-bottom: 5px;
`

const OpenAIKeySubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    margin-bottom: 10px;
`

const KeyBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
`

const ModelSwitchBox = styled.div``

const ModelSwitchTitle = styled.div``

const ModelButton = styled.div``

const TooltipTextTop = styled.div`
    display: flex;
    grid-gap: 3px;
`

const TooltipTextBottom = styled.div`
    display: flex;
`

const TooltipTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    white-space: nowrap;
    width: fit-content;
`

const InfoTooltipTitleBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 5px;
`
const InfoTooltipSubTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
`

const CounterContainer = styled.div<{
    progress: number
}>`
    --gradient-angle: ${(props) => props.progress}deg;
    --backgroundColor: ${(props) => props.theme.colors.prime1};
    --black: ${(props) => props.theme.colors.greyScale2};
    background: conic-gradient(
        var(--backgroundColor) var(--gradient-angle),
        var(--black) 0
    );
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 28px;
    width: 28px;

    ${(props) =>
        props.progress === 0 &&
        css`
            background: ${(props) => props.theme.colors.warning};
        `}

    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const InnerContainer = styled.div`
    border-radius: 50px;
    background-color: ${(props) => props.theme.colors.black};
    color: ${(props) => props.theme.colors.greyScale6};
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 10px;
`

const InfoTooltipContainer = styled.div`
    padding: 20px;
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: fit-content;
    grid-gap: 20px;
    width: 320px;
`

const InfoTooltipTitleArea = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    justify-content: space-between;
    flex-direction: column;
    grid-gap: 15px;
`

const InfoTooltipTitle = styled.div`
    font-size: 20px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
`

const InfoTooltipContentArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    grid-gap: 15px;
`

const InfoTooltipContentSubArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    grid-gap: 8px;
`

const InfoTooltipContentSubAreaTitle = styled.div`
    font-size: 14px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.greyScale7};
`

const InfoTooltipContentSubAreaBulletPoint = styled.div<{
    orientation: string
}>`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 5px;

    ${(props) =>
        props.orientation === 'flex-start' &&
        css`
            align-items: flex-start;
            margin-left: -4px;
        `}
`
