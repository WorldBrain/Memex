import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { props } from 'lodash/fp'
import React from 'react'
import styled, { css } from 'styled-components'
import browser from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY } from './constants'

export class BlockCounterIndicator extends React.Component {
    state = {
        currentCount: undefined,
        totalCount: undefined,
        shouldShow: false,
        showTooltip: false,
    }

    private tooltipButtonRef = React.createRef<HTMLDivElement>()

    async componentDidMount() {
        await browser.storage.local.get(COUNTER_STORAGE_KEY).then((result) => {
            if (
                result[COUNTER_STORAGE_KEY].s != null &&
                result[COUNTER_STORAGE_KEY].s != 'u'
            ) {
                this.setState({
                    shouldShow: true,
                    totalCount: parseInt(result[COUNTER_STORAGE_KEY].s),
                    currentCount: result[COUNTER_STORAGE_KEY].c,
                })
                browser.storage.onChanged.addListener((changes) =>
                    this.counterStorageListenerExecution(changes),
                )
            }
        })
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
            browser.storage.onChanged.removeListener((changes) =>
                this.counterStorageListenerExecution(changes),
            )
        }
    }

    counterStorageListenerExecution = (changes) => {
        console.log(changes[COUNTER_STORAGE_KEY]?.newValue)

        if (changes[COUNTER_STORAGE_KEY]?.newValue != null) {
            this.setState({
                currentCount: changes[COUNTER_STORAGE_KEY].newValue.c,
                totalCount: parseInt(changes[COUNTER_STORAGE_KEY].newValue.s),
            })
        }

        return undefined
    }

    renderTooltip = (leftOverBlocks) => {
        return (
            <PopoutBox
                placement="left-start"
                targetElementRef={this.tooltipButtonRef.current}
                closeComponent={() => this.setState({ showTooltip: false })}
                offsetX={10}
            >
                <InfoTooltipContainer>
                    <InfoTooltipTitleArea>
                        <InfoTooltipTitleBox>
                            <InfoTooltipTitle>
                                You have <strong>{leftOverBlocks}</strong> pages
                                left
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
                                window.open(this.whichCheckOutURL(), '_blank')
                            }}
                            size="medium"
                            type="primary"
                            iconPosition="right"
                        />
                    </InfoTooltipTitleArea>
                    <InfoTooltipContentArea>
                        {leftOverBlocks === 0 && (
                            <>
                                <InfoTooltipContentSubArea>
                                    <InfoTooltipContentSubAreaTitle>
                                        What can and cannot do anymore before
                                        you upgrade:
                                    </InfoTooltipContentSubAreaTitle>
                                    <InfoTooltipContentSubAreaBulletPoint
                                        orientation={'flex-start'}
                                    >
                                        <Icon
                                            icon="block"
                                            heightAndWidth="20px"
                                            hoverOff
                                            color="prime1"
                                        />
                                        Bookmark, annotate, summarise, organise
                                        & Twitter references.
                                    </InfoTooltipContentSubAreaBulletPoint>
                                    <InfoTooltipContentSubAreaBulletPoint
                                        orientation={'flex-start'}
                                    >
                                        <Icon
                                            icon="checkRound"
                                            heightAndWidth="20px"
                                            hoverOff
                                            color="prime1"
                                        />
                                        Search, export, view & reply to other
                                        peoples highlights & add more
                                        annotations to previously saved pages.
                                    </InfoTooltipContentSubAreaBulletPoint>
                                </InfoTooltipContentSubArea>
                            </>
                        )}
                        <InfoTooltipContentSubArea>
                            <InfoTooltipContentSubAreaTitle>
                                What counts towards the page quota?{' '}
                            </InfoTooltipContentSubAreaTitle>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                Bookmark, annotate or add a page to a Space
                            </InfoTooltipContentSubAreaBulletPoint>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                Summarise a page or a piece of text
                            </InfoTooltipContentSubAreaBulletPoint>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                Open the Twitter references of a page
                            </InfoTooltipContentSubAreaBulletPoint>
                        </InfoTooltipContentSubArea>
                        <InfoTooltipContentSubArea>
                            <InfoTooltipContentSubAreaTitle>
                                What does not count?
                            </InfoTooltipContentSubAreaTitle>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                Generally, every interacted page counts{' '}
                                <strong>just once.</strong>
                            </InfoTooltipContentSubAreaBulletPoint>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                If you add more than one highlight, text summary
                                or Space
                            </InfoTooltipContentSubAreaBulletPoint>
                            <InfoTooltipContentSubAreaBulletPoint>
                                <Icon
                                    icon="bulletPoint"
                                    heightAndWidth="16px"
                                    hoverOff
                                    color="prime1"
                                />
                                Read & Reply to annotations by others
                            </InfoTooltipContentSubAreaBulletPoint>
                        </InfoTooltipContentSubArea>
                    </InfoTooltipContentArea>
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
        const leftOverBlocks = this.state.totalCount - this.state.currentCount

        if (!this.state.shouldShow) {
            return null
        } else {
            return (
                <TooltipBox
                    placement="left"
                    tooltipText={
                        <TooltipTextContainer>
                            <TooltipTextTop>
                                You have <strong>{leftOverBlocks}</strong> pages
                                left
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
                        <InnerContainer> {leftOverBlocks}</InnerContainer>
                    </CounterContainer>
                    {this.state.showTooltip &&
                        this.renderTooltip(leftOverBlocks)}
                </TooltipBox>
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
    font-size: 12px;
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
    width: 400px;
    height: fit-content;
    grid-gap: 20px;
`

const InfoTooltipTitleArea = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    justify-content: space-between;
`

const InfoTooltipTitle = styled.div`
    font-size: 24px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
