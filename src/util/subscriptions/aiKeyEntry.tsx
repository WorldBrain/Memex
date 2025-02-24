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
import browser, { Browser, Storage } from 'webextension-polyfill'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_COUNTER_STORAGE_VALUE,
    DEFAULT_POWERUP_LIMITS,
} from '@worldbrain/memex-common/lib/subscriptions/constants'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { CustomerPowerUps } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import UpgradeModal from 'src/authentication/upgrade-modal'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'

export interface Props {
    syncSettingsBG: RemoteSyncSettingsInterface
    addedKey: () => void
    getRootElement: () => HTMLElement
    checkIfKeyValid: (apiKey: string) => Promise<void>
    isKeyValid: boolean
    authBG: AuthRemoteFunctionsInterface
    browserAPIs: Browser
}

interface State {
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

export class AIKeyEntry extends React.Component<Props, State> {
    private tooltipButtonRef = React.createRef<HTMLDivElement>()
    private syncSettings: SyncSettingsStore<'openAI'>

    state: State = {
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
    async componentWillUnmount() {}

    componentDidUpdate(prevProps) {
        if (this.props.isKeyValid !== prevProps.isKeyValid) {
            if (this.props.isKeyValid === true) {
                this.setState({ checkKeyValidLoadState: 'success' })
            } else if (this.props.isKeyValid === false) {
                this.setState({ checkKeyValidLoadState: 'error' })
            }
        }
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
                {!this.state.showTooltip && (
                    <PrimaryAction
                        label={
                            this.state.openAIKey != null
                                ? 'Change API Key'
                                : 'Add API Key'
                        }
                        type="forth"
                        size="small"
                        padding="5px 10px"
                        fullWidth
                        icon="key"
                        onClick={() =>
                            this.setState({
                                showTooltip: !this.state.showTooltip,
                            })
                        }
                        innerRef={this.tooltipButtonRef}
                    />
                )}
                {this.renderKeyEntry()}
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
    width: 100%;
    grid-gap: 5px;
    box-sizing: border-box;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 5px 5px 5px;
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
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 13px;
    line-height: 18px;
    font-weight: 300;
`

const InfoTooltipTitle = styled.div`
    font-size: 15px;
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
