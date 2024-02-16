import React from 'react'
import ReactDOM from 'react-dom'

import styled, { css } from 'styled-components'
import { TutorialCardContent } from './tutorial-cards-content'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

// card container (hold cycling logic)
// card component (holds card content, isEndOfCycle, isStartOfCycle)

export interface Props {
    content: TutorialCardContent[]
    destroyTutorial: () => void
    finishTutorial: () => void
}
export interface State {
    cardIndex: number
    windowSize: number
}

export default class TutorialContainer extends React.Component<Props, State> {
    state: State = {
        cardIndex: 0,
        windowSize: window.outerWidth,
    }

    prevCard = (_) => {
        this.setState({
            cardIndex: this.state.cardIndex > 0 ? this.state.cardIndex - 1 : 0,
        })
    }
    nextCard = (_) => {
        this.setState({
            cardIndex:
                this.state.cardIndex < this.props.content.length - 1
                    ? this.state.cardIndex + 1
                    : this.props.content.length - 1,
        })
    }

    componentDidMount() {
        window.addEventListener('resize', this.getScreenWidth)
    }

    // componentDidUnmount = () => {
    //     window.removeEventListener('resize', this.getScreenWidth);
    // }

    getScreenWidth = () => {
        this.setState({
            windowSize: window.outerWidth,
        })
    }

    render() {
        return (
            <>
                <TutorialCardContainer
                    top={
                        this.props.content[this.state.cardIndex].component.props
                            .top
                    }
                    bottom={
                        this.props.content[this.state.cardIndex].component.props
                            .bottom
                    }
                    left={
                        this.props.content[this.state.cardIndex].component.props
                            .left
                    }
                    right={
                        this.props.content[this.state.cardIndex].component.props
                            .right
                    }
                    width={
                        this.props.content[this.state.cardIndex].component.props
                            .width
                    }
                    height={
                        this.props.content[this.state.cardIndex].component.props
                            .height
                    }
                >
                    <TopArea firstContainer={this.state.cardIndex === 0}>
                        <CardBody>
                            {this.props.content[this.state.cardIndex].component}
                        </CardBody>
                        <CardFooter>
                            {this.state.cardIndex > 0 ? (
                                <PrimaryAction
                                    onClick={this.prevCard}
                                    label={'Back'}
                                    type={'tertiary'}
                                    size={'medium'}
                                />
                            ) : (
                                <div />
                            )}
                            {this.state.cardIndex <
                            this.props.content.length - 1 ? (
                                this.state.cardIndex > 0 && (
                                    <PrimaryAction
                                        onClick={this.nextCard}
                                        label={'Next'}
                                        type={'primary'}
                                        size={'medium'}
                                        icon={'longArrowRight'}
                                        iconPosition={'right'}
                                        // iconSize={'22px'}
                                    />
                                )
                            ) : (
                                <PrimaryAction
                                    label={'Finish'}
                                    onClick={this.props.finishTutorial}
                                    type={'primary'}
                                    size={'medium'}
                                    icon={'check'}
                                    iconPosition={'left'}
                                />
                            )}
                        </CardFooter>
                    </TopArea>
                    {this.props.content[this.state.cardIndex].component.props
                        .extraArea && (
                        <BottomArea>
                            {
                                this.props.content[this.state.cardIndex]
                                    .component.props.extraArea
                            }
                        </BottomArea>
                    )}
                </TutorialCardContainer>
                {this.props.content[this.state.cardIndex].component.props
                    .showHoverArea && (
                    <HoverArea
                        id={'HoverArea'}
                        onMouseEnter={() => (
                            this.setState({
                                cardIndex: this.state.cardIndex + 1,
                            }),
                            (document.getElementById(
                                'HoverArea',
                            ).style.display = 'none')
                        )}
                    />
                )}
            </>
        )
    }
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}

const HoverArea = styled.div`
    position: fixed;
    right: 0px;
    /* border-bottom-left-radius: 40px;
    border-top-left-radius: 40px; */
    bottom: 0px;
    right: 0px;
    width: 44px;
    height: 38px;
    border-top-left-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.prime1};
    background: ${(props) => props.theme.colors.prime1}60;

    opacity: 0;
    animation: 3s ease-in-out 0.5s MouseAreaAppear infinite;
    animation-iteration-count: infinite;
    display: flex;

    @keyframes MouseAreaAppear {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
`

const BottomArea = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    width: 100%;
`

const TopArea = styled.div<{ firstContainer: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    grid-gap: 50px;

    ${(props) =>
        props.firstContainer &&
        css`
            flex-direction: column;
            align-items: center;
            justify-content: center;
            grid-gap: 0px;
        `}
`

const TutorialCardContainer = styled.div<{
    top: string
    bottom: string
    left: string
    right: string
    width: string
    height: string
}>`
    top: ${(props) => (props.top ? props.top : null)};
    bottom: ${(props) => (props.bottom ? props.bottom : null)};
    left: auto;
    right: ${(props) => (props.right ? props.right : null)};
    width: ${(props) => (props.width ? props.width : 'fit-content')};
    height: ${(props) => props.height && props.height};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    background-color: ${(props) => props.theme.colors.greyScale1};
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    padding: 3em;
    text-align: center;
    grid-gap: 30px;

    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    box-shadow: 0px 4px 15px 5px rgb(0 0 0 / 5%);
    border: 2px solid ${(props) => props.theme.colors.greyScale3};
    animation: 0.3s ease-out 0s 1 slideInFromLeft;
    height: fit-content;
    max-height: 70%;
    justify-content: flex-start;
    overflow: scroll;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;

    @keyframes slideInFromLeft {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
`

const MemexLogoContainer = styled.img`
    align-self: flex-start;
    width: 100px;
    margin-top: -20px;
`

const TutorialTitle = styled.div`
    font-size: 2em;
    border-bottom: 0px;
    align-self: flex-start;
    margin-top: 20px;
`
const ExitButton = styled.div`
    display: flex;
    align-self: flex-end;
`
const CardHeader = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: end;
    width: 100%;
`
const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: stretch;
    flex-grow: 1;
`
const CardFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    grid-gap: 5px;
`

const CloseButton = styled.img`
    height: 16px;
    width: 16px;
    border-radius: 3px;
    padding: 4px;
    cursor: pointer;

    &:hover {
        background-color: #f0f0f0;
    }
`
