import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import React from 'react'
import styled, { css } from 'styled-components'
import browser from 'webextension-polyfill'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_POWERUP_LIMITS,
} from '@worldbrain/memex-common/lib/subscriptions/constants'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { DEFAULT_TRIAL_PERIOD } from '@worldbrain/memex-common/lib/subscriptions/constants'

interface Props {
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
    isSidebarOpen: boolean
    isTrial?: boolean
    signupDate?: number
    getRootElement: () => HTMLElement
    events: AnnotationsSidebarInPageEventEmitter
    forceRibbonShow: (force: boolean) => void
}

export class BlockCounterIndicator extends React.Component<Props> {
    state = {
        currentCount: undefined,
        totalCount: undefined,
        shouldShow: false,
        showTooltip: false,
    }

    private tooltipButtonRef = React.createRef<HTMLDivElement>()

    async componentDidMount() {
        await browser.storage.local.get(COUNTER_STORAGE_KEY).then((result) => {
            if (!result[COUNTER_STORAGE_KEY].pU.bookmarksPowerUp) {
                this.setState({
                    shouldShow: true,
                    totalCount: DEFAULT_POWERUP_LIMITS.bookmarksPowerUp,
                    currentCount: result[COUNTER_STORAGE_KEY].c,
                })
                browser.storage.onChanged.addListener((changes) =>
                    this.counterStorageListenerExecution(changes),
                )
            }
        })
    }
    async componentWillUnmount() {
        if (this.state.shouldShow) {
            browser.storage.onChanged.removeListener((changes) =>
                this.counterStorageListenerExecution(changes),
            )
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
        const remainingDays = DEFAULT_TRIAL_PERIOD - elapsedDays

        return remainingDays
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
                            {this.props.isTrial ? (
                                <InfoTooltipTitle>
                                    <strong>Trial</strong> ends in{' '}
                                    {this.daysRemainingToComplete30()} days.
                                </InfoTooltipTitle>
                            ) : (
                                <InfoTooltipTitle>
                                    <strong>{leftOverBlocks}</strong> pages left
                                    this month
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
                            {leftOverBlocks === 0 && (
                                <InfoTooltipSubTitle>
                                    You can't save, annotate or organise any NEW
                                    pages.
                                    <br /> You can still annotate and organise
                                    pages you have already saved.
                                    <br />
                                    <br />
                                    Resets in {this.daysUntilNextMonth()} days.
                                </InfoTooltipSubTitle>
                            )}
                            {leftOverBlocks > 0 && !this.props.isTrial && (
                                <InfoTooltipSubTitle>
                                    Pages you save, annotate or add to Spaces.{' '}
                                    <br />
                                    Counts only once per page - forever!
                                    <br /> <br /> Resets in{' '}
                                    {this.daysUntilNextMonth()} days.
                                </InfoTooltipSubTitle>
                            )}
                            {this.props.isTrial && (
                                <InfoTooltipSubTitle>
                                    Use everything as much as you want.
                                    <br />
                                    <br />
                                    After the trial: 60 days
                                    money-back-guarantee and a free tier with 25
                                    saved pages & $
                                    {DEFAULT_POWERUP_LIMITS.AIpowerup} AI page
                                    sessions per month.
                                    <br />
                                    Each saved page counts only once - forever.
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
            (100 -
                (this.state.currentCount / parseInt(this.state.totalCount)) *
                    100) *
            3.6
        const leftOverBlocks = Math.max(
            0,
            this.state.totalCount - this.state.currentCount,
        )
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        if (!this.state.shouldShow) {
            return null
        } else {
            return (
                <>
                    {this.state.showTooltip &&
                        this.renderTooltip(leftOverBlocks)}
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
                                {this.props.isTrial ? (
                                    <TooltipTextTop>
                                        <strong>Trial</strong> ends in{' '}
                                        {this.daysRemainingToComplete30()} days.
                                    </TooltipTextTop>
                                ) : (
                                    <TooltipTextTop>
                                        You have{' '}
                                        <strong>{leftOverBlocks}</strong> pages
                                        left this month
                                    </TooltipTextTop>
                                )}

                                <TooltipTextBottom>
                                    Click for more info
                                </TooltipTextBottom>
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
                                {' '}
                                {this.props.isTrial
                                    ? this.daysRemainingToComplete30()
                                    : leftOverBlocks}
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
