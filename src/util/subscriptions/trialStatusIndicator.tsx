import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import React from 'react'
import styled, { css } from 'styled-components'
import browser, { Browser } from 'webextension-polyfill'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_POWERUP_LIMITS,
} from '@worldbrain/memex-common/lib/subscriptions/constants'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { DEFAULT_TRIAL_PERIOD } from '@worldbrain/memex-common/lib/subscriptions/constants'
import { enforceTrialPeriod } from '@worldbrain/memex-common/lib/subscriptions/storage'

interface Props {
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
    isSidebarOpen: boolean
    signupDate?: number
    getRootElement: () => HTMLElement
    events: AnnotationsSidebarInPageEventEmitter
    forceRibbonShow: (force: boolean) => void
    browserAPIs: Browser
}

export class TrialStatusIndicator extends React.Component<Props> {
    state = {
        trialDaysLeft: null,
        shouldShow: false,
        showTooltip: false,
    }

    private tooltipButtonRef = React.createRef<HTMLDivElement>()

    async componentDidMount() {
        const trialDaysLeft = await enforceTrialPeriod(
            this.props.browserAPIs,
            this.props.signupDate,
        )
        const result = await browser.storage.local.get(COUNTER_STORAGE_KEY)
        if (!result[COUNTER_STORAGE_KEY]?.pU?.bookmarksPowerUp) {
            this.setState({
                shouldShow: true,
                trialDaysLeft: trialDaysLeft,
            })
        } else {
            this.setState({
                shouldShow: false,
                trialDaysLeft: null,
            })
        }
    }

    counterStorageListenerExecution = (changes) => {
        if (changes[COUNTER_STORAGE_KEY]?.newValue != null) {
            this.setState({
                currentCount: changes[COUNTER_STORAGE_KEY].newValue.c,
                totalCount: DEFAULT_POWERUP_LIMITS.bookmarksPowerUp,
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

    renderTooltip = (leftOverBlocks) => {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <PopoutBox
                placement={
                    topRight ? 'bottom' : bottomRight ? 'top' : 'left-start'
                }
                targetElementRef={this.tooltipButtonRef.current}
                closeComponent={() => {
                    this.props.forceRibbonShow(false)
                    this.setState({ showTooltip: false })
                }}
                offsetX={20}
                getPortalRoot={this.props.getRootElement}
            >
                <InfoTooltipContainer>
                    <InfoTooltipTitleArea>
                        <TitleAreaContainer>
                            {this.state.trialDaysLeft <= 0 &&
                                this.state.shouldShow && (
                                    <InfoTooltipTitle>
                                        You reached the end of your free trial.
                                    </InfoTooltipTitle>
                                )}
                            {this.state.shouldShow && (
                                <InfoTooltipTitle>
                                    {this.state.trialDaysLeft} days left in your
                                    trial
                                </InfoTooltipTitle>
                            )}
                            <PrimaryAction
                                label="Upgrade"
                                icon={'longArrowRight'}
                                padding="0px 5px 0 10px"
                                onClick={() => {
                                    this.props.events.emit('showPowerUpModal', {
                                        limitReachedNotif: 'Bookmarks',
                                    })
                                }}
                                size="medium"
                                type="primary"
                                iconPosition="right"
                            />
                        </TitleAreaContainer>
                        <InfoTooltipSubTitleBox>
                            {this.state.trialDaysLeft <= 0 &&
                                this.state.shouldShow && (
                                    <InfoTooltipSubTitle>
                                        You can still annotate & organise pages
                                        you have already saved.
                                    </InfoTooltipSubTitle>
                                )}
                            {this.state.shouldShow && (
                                <InfoTooltipSubTitle>
                                    After that you'll have to upgrade the
                                    powerups for annotating AND/OR using the AI
                                    copilot
                                </InfoTooltipSubTitle>
                            )}
                        </InfoTooltipSubTitleBox>
                    </InfoTooltipTitleArea>
                </InfoTooltipContainer>
            </PopoutBox>
        )
    }

    render() {
        const progressPercentNumber =
            (100 - (this.state.trialDaysLeft / DEFAULT_TRIAL_PERIOD) * 100) *
            3.6
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        console.log('trialDaysLeft', this.state.trialDaysLeft)

        if (!this.state.shouldShow) {
            return null
        } else {
            return (
                <>
                    {this.state.showTooltip &&
                        this.renderTooltip(this.state.trialDaysLeft)}
                    <TooltipBox
                        placement={
                            this.props.isSidebarOpen
                                ? 'left'
                                : topRight
                                ? 'bottom'
                                : bottomRight
                                ? 'top'
                                : 'left'
                        }
                        offsetX={15}
                        tooltipText={
                            <TooltipTextContainer>
                                {this.state.trialDaysLeft <= 0 &&
                                    this.state.shouldShow && (
                                        <InfoTooltipSubTitle>
                                            You reached the end
                                            <br />
                                            of your free trial.
                                        </InfoTooltipSubTitle>
                                    )}
                                {this.state.shouldShow && (
                                    <InfoTooltipSubTitle>
                                        {this.state.trialDaysLeft} left in your
                                        trial
                                    </InfoTooltipSubTitle>
                                )}
                            </TooltipTextContainer>
                        }
                        getPortalRoot={this.props.getRootElement}
                    >
                        <CounterContainer
                            progress={progressPercentNumber}
                            ref={this.tooltipButtonRef}
                            onClick={() => {
                                this.props.forceRibbonShow(true)
                                this.setState({ showTooltip: true })
                            }}
                        >
                            <InnerContainer>
                                {this.state.trialDaysLeft}
                            </InnerContainer>
                        </CounterContainer>
                    </TooltipBox>
                </>
            )
        }
    }
}
const TooltipTextTop = styled.div`
    display: flex;
    grid-gap: 3px;
`

const TooltipTextBottom = styled.div`
    display: flex;
    width: 100%;
    text-align: center;
`

const TooltipTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    white-space: nowrap;
    width: fit-content;
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
    width: 420px;
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

const InfoTooltipTitle = styled.div`
    font-size: 24px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`
