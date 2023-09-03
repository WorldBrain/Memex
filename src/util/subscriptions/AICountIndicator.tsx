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
    position?: 'top' | 'bottom'
    isTrial: boolean
    signupDate: number
}

interface State {
    currentCount: number
    totalCount: number
    shouldShow: boolean
    showTooltip: boolean
    openAIKey: string
    showSaveButton: boolean
}

export class AICounterIndicator extends React.Component<Props, State> {
    private tooltipButtonRef = React.createRef<HTMLDivElement>()
    private syncSettings: SyncSettingsStore<'openAI'>

    state: State = {
        currentCount: DEFAULT_COUNTER_STORAGE_KEY.cQ,
        totalCount: DEFAULT_COUNTER_STORAGE_KEY.sQ,
        shouldShow: true,
        showTooltip: false,
        openAIKey: '',
        showSaveButton: false,
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
            return 'https://memex.garden/upgrade'
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

    private daysAgo = (timestamp) => {
        // Get the current date and passed timestamp as Date objects
        const currentDate: any = new Date()
        const givenDate: any = new Date(Number(timestamp))

        // Calculate the difference in milliseconds
        const differenceInMilliseconds: any = currentDate - givenDate
        // Convert the difference from milliseconds to days
        // 1 day = 24 hours = 24 x 60 minutes = 24 x 60 x 60 seconds = 24 x 60 x 60 x 1000 milliseconds
        const differenceInDays =
            30 - differenceInMilliseconds / (24 * 60 * 60 * 1000 * 1000)

        // Return the rounded number of days
        return Math.ceil(differenceInDays)
    }

    daysUntilNextMonth() {
        const currentDate: any = new Date()

        // Get the next month (or advance to January of the next year if current month is December)
        let nextMonth: any = currentDate.getMonth() + 1
        let nextYear: any = currentDate.getFullYear()
        if (nextMonth === 12) {
            nextMonth = 0 // January is month 0 in JavaScript's Date
            nextYear += 1
        }

        const nextMonthFirstDay: any = new Date(nextYear, nextMonth, 1)

        // Calculate the difference in milliseconds
        const differenceInMilliseconds: any = nextMonthFirstDay - currentDate

        // Convert the difference from milliseconds to days
        const differenceInDays =
            differenceInMilliseconds / (24 * 60 * 60 * 1000)

        // Return the rounded number of days
        return Math.ceil(differenceInDays)
    }

    daysRemainingToComplete30() {
        const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000

        const currentDate = Date.now()

        // Calculate the difference in milliseconds between the current date and the initial timestamp
        const elapsedMilliseconds = currentDate - this.props.signupDate

        // Convert the elapsed time to days
        const elapsedDays = Math.floor(
            elapsedMilliseconds / MILLISECONDS_IN_A_DAY,
        )

        // Calculate the days remaining to complete 30 days
        const remainingDays = 30 - elapsedDays

        return remainingDays
    }

    renderTooltip = () => {
        return (
            <PopoutBox
                placement="top-start"
                targetElementRef={this.tooltipButtonRef.current}
                closeComponent={() => this.setState({ showTooltip: false })}
                offsetX={10}
                strategy="fixed"
            >
                <InfoTooltipContainer>
                    <InfoTooltipTitleArea>
                        <TitleAreaContainer>
                            {this.props.isTrial && (
                                <InfoTooltipTitle>
                                    <strong>Trial</strong> ends in{' '}
                                    {this.daysRemainingToComplete30()} days.
                                </InfoTooltipTitle>
                            )}

                            {(this.state.openAIKey == null ||
                                this.state.openAIKey?.length === 0) &&
                                this.state.totalCount < 10000 &&
                                !this.props.isTrial && (
                                    <InfoTooltipTitle>
                                        <strong>{this.leftOverBlocks}</strong>{' '}
                                        AI queries left this month
                                    </InfoTooltipTitle>
                                )}
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
                        </TitleAreaContainer>
                        <InfoTooltipSubTitleBox>
                            {this.leftOverBlocks === 0 && (
                                <InfoTooltipSubTitle>
                                    You can't make any more AI summaries or
                                    queries.
                                    <br />
                                    Resets in {this.daysUntilNextMonth()} days.
                                    <br />
                                    <br />
                                    Add your OpenAI AI key for unlimited queries
                                    at your own cost.
                                </InfoTooltipSubTitle>
                            )}
                            {this.leftOverBlocks > 0 && !this.props.isTrial && (
                                <InfoTooltipSubTitle>
                                    Resets in {this.daysUntilNextMonth()} days.
                                    <br /> <br />
                                    Add your OpenAI AI key for unlimited queries
                                    at your own cost.
                                </InfoTooltipSubTitle>
                            )}
                            {this.props.isTrial && (
                                <InfoTooltipSubTitle>
                                    Make as many AI queries & summaries you
                                    want.
                                    <br />
                                    After the trial: 60 days money-back-guarntee
                                    and a free tier with 25 AI queries per
                                    month.
                                </InfoTooltipSubTitle>
                            )}
                        </InfoTooltipSubTitleBox>
                    </InfoTooltipTitleArea>
                    <OpenAIKeyContainer>
                        <OpenAIKeyTitle>OpenAI API Key</OpenAIKeyTitle>
                        <OpenAIKeySubTitle>
                            Add API key for unlimited queries at your own cost.
                        </OpenAIKeySubTitle>
                        <KeyBox>
                            <TextField
                                placeholder={
                                    this.state.openAIKey?.length > 0
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
                </InfoTooltipContainer>
            </PopoutBox>
        )
    }

    render() {
        const progressPercentNumber =
            (100 - (this.state.currentCount / this.state.totalCount) * 100) *
            3.6

        if (this.props.isTrial) {
            return (
                <ButtonBox>
                    <TooltipBox
                        placement="bottom-end"
                        tooltipText={
                            <TooltipTextContainer>
                                <TooltipTextTop>
                                    Upgrade or add API key.
                                </TooltipTextTop>
                            </TooltipTextContainer>
                        }
                    >
                        <Icon
                            icon="settings"
                            heightAndWidth="22px"
                            onClick={() => this.setState({ showTooltip: true })}
                            containerRef={this.tooltipButtonRef}
                        />
                    </TooltipBox>

                    {this.state.showTooltip && this.renderTooltip()}
                </ButtonBox>
            )
        } else if (
            this.state.totalCount < 10000 &&
            this.state.openAIKey?.length === 0 &&
            !this.props.isTrial
        ) {
            return (
                <>
                    <TooltipBox
                        placement={
                            this.props.position === 'top' ? 'bottom' : 'top'
                        }
                        tooltipText={
                            <TooltipTextContainer>
                                <TooltipTextTop>
                                    <strong>{this.leftOverBlocks}</strong>{' '}
                                    queries left this month
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
                            <InnerContainer>
                                {' '}
                                {this.props.isTrial
                                    ? this.daysRemainingToComplete30()
                                    : this.leftOverBlocks}
                            </InnerContainer>
                        </CounterContainer>
                    </TooltipBox>
                </>
            )
        } else {
            return (
                <>
                    <TooltipBox
                        placement="bottom-end"
                        tooltipText={
                            <TooltipTextContainer>
                                <TooltipTextTop>
                                    Upgrade or add API key.
                                </TooltipTextTop>
                            </TooltipTextContainer>
                        }
                    >
                        <Icon
                            icon="settings"
                            heightAndWidth="22px"
                            onClick={() => this.setState({ showTooltip: true })}
                            containerRef={this.tooltipButtonRef}
                        />
                    </TooltipBox>

                    {this.state.showTooltip && this.renderTooltip()}
                </>
            )
        }
    }
}

const ButtonBox = styled.div`
    display: flex;
    position: relative;

    & > {
        position: absolute;
    }
`

const TitleAreaContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 20px;
    width: 90%;
    justify-content: space-between;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const InfoTooltipSubTitleBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 5px;
    padding: 20px;
`
const InfoTooltipSubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    line-height: 24px;
`

const ORBox = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
`

const OpenAIKeyContainer = styled.div`
    width: 90%;
    padding: 0px 20px 20px 20px;
`

const OpenAIKeyTitle = styled.div`
    font-weight: bold;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    margin-bottom: 5px;
`

const OpenAIKeySubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
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
    text-align: center;
    width: 100%;
    justify-content: center;
`

const TooltipTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
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
    color: ${(props) => props.theme.colors.white};
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    font-weight: 400;
`

const InfoTooltipContainer = styled.div`
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: fit-content;
    grid-gap: 20px;
    width: 400px;
`

const InfoTooltipTitleArea = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    justify-content: space-between;
    flex-direction: column;
`

const InfoTooltipTitle = styled.div`
    font-size: 20px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: pre-wrap;
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
