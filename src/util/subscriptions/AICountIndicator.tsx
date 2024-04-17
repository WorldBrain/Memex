import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import React from 'react'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import {
    createSyncSettingsStore,
    SyncSettingsStore,
} from 'src/sync-settings/util'
import styled, { css } from 'styled-components'
import browser, { Storage } from 'webextension-polyfill'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_COUNTER_STORAGE_KEY,
    DEFAULT_POWERUP_LIMITS,
} from './constants'
import { TaskState } from 'ui-logic-core/lib/types'
import {
    CustomerPowerUps,
    PowerupOptions,
    PremiumPlans,
} from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import UpgradeModal from 'src/authentication/upgrade-modal'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'

export interface Props {
    syncSettingsBG: RemoteSyncSettingsInterface
    isTrial: boolean
    signupDate: number
    addedKey: () => void
    getRootElement: () => HTMLElement
    checkIfKeyValid: (apiKey: string) => Promise<void>
    isKeyValid: boolean
    createCheckOutLink: (
        billingPeriod: 'monthly' | 'yearly',
        selectedPremiumPlans: PremiumPlans[],
        doNotOpen: boolean,
    ) => Promise<'success' | 'error'>
    authBG: AuthRemoteFunctionsInterface
}

interface State {
    currentCount: number
    shouldShow: boolean
    showTooltip: boolean
    openAIKey: string
    showSaveButton: boolean
    checkKeyValidLoadState: TaskState
    keyChanged: boolean
    powerUps: CustomerPowerUps
    totalCount: number
    renderUpgradeModal: boolean
}

export class AICounterIndicator extends React.Component<Props, State> {
    private tooltipButtonRef = React.createRef<HTMLDivElement>()
    private syncSettings: SyncSettingsStore<'openAI'>

    state: State = {
        currentCount: DEFAULT_COUNTER_STORAGE_KEY.cQ,
        shouldShow: true,
        showTooltip: false,
        openAIKey: '',
        showSaveButton: false,
        checkKeyValidLoadState: 'pristine',
        keyChanged: false,
        powerUps: {
            AIpowerup: false,
            Unlimited: false,
            AIpowerupOwnKey: false,
            bookmarksPowerUp: false,
            lifetime: false,
        },
        totalCount: 0,
        renderUpgradeModal: false,
    }

    constructor(props: Props) {
        super(props)
        this.syncSettings = createSyncSettingsStore({
            syncSettingsBG: props.syncSettingsBG,
        })
    }

    async componentDidMount() {
        const result = await browser.storage.local.get(COUNTER_STORAGE_KEY)
        if (result[COUNTER_STORAGE_KEY] != null) {
            this.setState({
                currentCount: result[COUNTER_STORAGE_KEY].cQ,
                powerUps: result[COUNTER_STORAGE_KEY].pU,
            })
        }

        const totalCount = DEFAULT_POWERUP_LIMITS.AIpowerup

        this.setState({
            totalCount: totalCount,
        })

        browser.storage.onChanged.addListener(this.counterStorageListener)
        const openAIKey = await this.syncSettings.openAI.get('apiKey')

        if (openAIKey) {
            this.setState({
                openAIKey: openAIKey,
            })
        } else {
            this.setState({
                openAIKey: '',
            })
        }
    }
    async componentWillUnmount() {
        if (this.state.shouldShow) {
            browser.storage.onChanged.removeListener(
                this.counterStorageListener,
            )
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.isKeyValid !== prevProps.isKeyValid) {
            if (this.props.isKeyValid === true) {
                this.setState({ checkKeyValidLoadState: 'success' })
            } else if (this.props.isKeyValid === false) {
                this.setState({ checkKeyValidLoadState: 'error' })
            }
        }
    }

    private whichCheckOutURL = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.garden/upgrade'
        } else {
            return 'https://memex.garden/upgradeStaging'
        }
    }

    private counterStorageListener = (
        changes: Record<string, Storage.StorageChange>,
    ) => {
        if (changes[COUNTER_STORAGE_KEY]?.newValue != null) {
            this.setState({
                currentCount: changes[COUNTER_STORAGE_KEY].newValue.cQ,
            })
        }

        return undefined
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

    private get leftOverBlocks(): number {
        return this.state.totalCount - this.state.currentCount
    }

    renderUpgradeModal = () => {
        if (this.state.renderUpgradeModal) {
            return (
                <UpgradeModal
                    powerUpType="AI"
                    getRootElement={this.props.getRootElement}
                    componentVariant="Modal"
                    createCheckOutLink={this.props.createCheckOutLink}
                    closeComponent={() => {
                        this.setState({
                            renderUpgradeModal: false,
                        })
                    }}
                    browserAPIs={browser}
                    limitReachedNotif={null}
                    authBG={this.props.authBG}
                />
            )
        }
    }

    renderUpgradeInfo = () => {
        let shouldShow =
            this.props.isTrial ||
            (this.state.powerUps.AIpowerup === false &&
                this.state.powerUps.AIpowerupOwnKey === false)

        if (this.state.powerUps.AIpowerup) {
            shouldShow = false
        }

        return (
            shouldShow && (
                <TitleAreaContainer>
                    <TopTitle>
                        {/* Is in Trial */}
                        {this.props.isTrial && (
                            <InfoTooltipTitle>
                                <strong>Trial</strong> ends in{' '}
                                {this.daysRemainingToComplete30()} days.
                            </InfoTooltipTitle>
                        )}

                        {/* Is NOT in Trial anymore, has no key and no AI powerup */}
                        {!this.props.isTrial &&
                            (this.state.openAIKey == null ||
                                this.state.openAIKey?.length === 0) &&
                            this.state.powerUps.AIpowerup === false && (
                                <InfoTooltipTitle>
                                    <strong>{this.leftOverBlocks}</strong> AI
                                    queries left this month
                                </InfoTooltipTitle>
                            )}
                        {/*Is NOT in Trial anymore, has Key and no AI ownkey powerup */}
                        {!this.props.isTrial &&
                            this.state.openAIKey != null &&
                            !this.state.powerUps.AIpowerup &&
                            !this.state.powerUps.AIpowerupOwnKey && (
                                <InfoTooltipTitle>
                                    You have to upgrade to use your own API key
                                </InfoTooltipTitle>
                            )}

                        {/* Is in Trial, has no key and no AI powerup */}
                        <PrimaryAction
                            label="Upgrade"
                            icon={'longArrowRight'}
                            padding="0px 5px 0 10px"
                            onClick={() => {
                                this.setState({
                                    renderUpgradeModal: true,
                                })
                            }}
                            size="small"
                            type="primary"
                            iconPosition="right"
                        />
                    </TopTitle>
                </TitleAreaContainer>
            )
        )
    }

    renderKeyEntry = () => {
        if (this.state.showTooltip) {
            return (
                <InfoTooltipContainer>
                    <OpenAIKeyContainer>
                        <KeyBox>
                            <TextField
                                placeholder={
                                    this.state.openAIKey?.length > 0
                                        ? this.state.openAIKey
                                        : 'Enter API Key'
                                }
                                value={this.state.openAIKey.trim()}
                                onChange={(e) => {
                                    this.setState({
                                        openAIKey: (e.target as HTMLInputElement).value.trim(),
                                        keyChanged: true,
                                    })
                                }}
                                onKeyDown={async (e) => {
                                    e.stopPropagation()
                                    if (e.key === 'Enter') {
                                        this.setState({
                                            checkKeyValidLoadState: 'running',
                                        })
                                        await this.props.checkIfKeyValid(
                                            this.state.openAIKey.trim(),
                                        )
                                        this.setState({
                                            keyChanged: false,
                                        })
                                    }
                                    if (e.key === ' ') {
                                        e.preventDefault()
                                    }
                                }}
                            />

                            {this.state.keyChanged && (
                                <PrimaryAction
                                    onClick={async () => {
                                        this.setState({
                                            checkKeyValidLoadState: 'running',
                                        })
                                        await this.props.checkIfKeyValid(
                                            this.state.openAIKey.trim(),
                                        )
                                        this.setState({
                                            keyChanged: false,
                                        })
                                    }}
                                    label={
                                        this.state.checkKeyValidLoadState ===
                                        'running'
                                            ? 'Checking'
                                            : 'Check Key'
                                    }
                                    fullWidth
                                    type="secondary"
                                    size="small"
                                />
                            )}
                            {this.props.isKeyValid == true && (
                                <Icon
                                    heightAndWidth="20px"
                                    icon="checkRound"
                                    color="prime1"
                                    hoverOff
                                />
                            )}
                        </KeyBox>
                        {this.state.checkKeyValidLoadState === 'error' && (
                            <ErrorBox>
                                <ErrorBoxTitle>Invalid API Key</ErrorBoxTitle>
                                <ErrorBoxSubTitle>
                                    Check if there are no typos or if the key is
                                    expired
                                </ErrorBoxSubTitle>
                            </ErrorBox>
                        )}
                    </OpenAIKeyContainer>
                </InfoTooltipContainer>
            )
        }
    }

    render() {
        return (
            <Container>
                <PrimaryAction
                    label="Add API Key"
                    type="forth"
                    size="small"
                    padding="5px 10px"
                    fullWidth
                    icon="key"
                    onClick={() =>
                        this.setState({ showTooltip: !this.state.showTooltip })
                    }
                    innerRef={this.tooltipButtonRef}
                />
                {this.renderKeyEntry()}
                {this.renderUpgradeInfo()}
                {this.renderUpgradeModal()}
            </Container>
        )
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const ButtonBox = styled.div`
    display: flex;
    position: relative;

    & > {
        position: absolute;
    }
`

const ORBox = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
`

const OpenAIKeyContainer = styled.div`
    margin-top: 10px;
    width: 100%;
    box-sizing: border-box;
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
    flex-direction: column;
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
`

const InfoTooltipTitleArea = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    justify-content: space-between;
    flex-direction: column;
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
const ErrorBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 15px 15px 0 15px;
    grid-gap: 10px;
`
const ErrorBoxTitle = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    color: ${(props) => props.theme.colors.warning};
`
const ErrorBoxSubTitle = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
`

const TitleAreaContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 10px 0 0 0;
    width: 100%;
    grid-gap: 5px;
    box-sizing: border-box;
    justify-content: space-between;
`

const InfoTooltipSubTitleBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 5px;
    width: 100%;
    max-width: 290px;
`
const InfoTooltipSubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 12px;
    line-height: 18px;
    font-weight: 400;
`

const InfoTooltipTitle = styled.div`
    font-size: 16px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: pre-wrap;
`

const TopTitle = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    grid-gap: 15px;
    width: 100%;
`
