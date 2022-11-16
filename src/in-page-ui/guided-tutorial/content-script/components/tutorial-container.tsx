import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { reactEventHandler } from 'src/util/ui-logic'
import * as icons from 'src/common-ui/components/design-library/icons'

import { ThemeProvider } from 'styled-components'
import styled from 'styled-components'
import { theme } from 'src/common-ui/components/design-library/theme'
import { tutorialContents, TutorialCardContent } from './tutorial-cards-content'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { windowWhen } from 'rxjs/operator/windowWhen'

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
                    screenWidth={this.state.windowSize}
                    showHoverArea={
                        this.props.content[this.state.cardIndex].component.props
                            .showHoverArea
                    }
                    position={
                        this.props.content[this.state.cardIndex].component.props
                            .position
                    }
                >
                    <TopArea>
                        <CardBody>
                            {this.props.content[this.state.cardIndex].component}
                        </CardBody>
                        <CardFooter>
                            {this.state.cardIndex > 0 ? (
                                <PrimaryAction
                                    onClick={this.prevCard}
                                    label={'Back'}
                                    backgroundColor={'darkhover'}
                                    fontColor={'normalText'}
                                />
                            ) : (
                                <div />
                            )}
                            {this.state.cardIndex <
                            this.props.content.length - 1 ? (
                                <PrimaryAction
                                    onClick={this.nextCard}
                                    label={'Next'}
                                    backgroundColor={'purple'}
                                    fontColor={'backgroundColor'}
                                    // icon={'longArrowRight'}
                                    // iconPosition={'right'}
                                    // iconSize={'22px'}
                                />
                            ) : (
                                <PrimaryAction
                                    label={'Finish'}
                                    onClick={this.props.finishTutorial}
                                    backgroundColor={'purple'}
                                    fontColor={'backgroundColor'}
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
    top: 70px;
    right: 0px;
    width: 60px;
    height: 300px;
    /* border-bottom-left-radius: 40px;
    border-top-left-radius: 40px; */
    top: 130px;
    right: 0px;
    width: 24px;
    height: 400px;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.purple};
    background: ${(props) => props.theme.colors.purple}60;

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
    border-top: 1px solid ${(props) => props.theme.colors.lightHover};
    width: 100%;
`

const TopArea = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`

const TutorialCardContainer = styled.div<{
    top: string
    bottom: string
    left: string
    right: string
    width: string
    height: string
    screenWidth: string
}>`
    top: ${(props) => (props.top ? props.top : null)};
    bottom: ${(props) => (props.bottom ? props.bottom : null)};
    left: ${(props) =>
        props.left
            ? (props.screenWidth - props.width.replace('px', '')) / 2 + 'px'
            : null};
    right: ${(props) => (props.right ? props.right : null)};
    width: ${(props) => (props.width ? props.width : '650px')};
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
    min-height: 60px;
    grid-gap: 30px;

    font-family: 'Satoshi', sans-serif;
    box-shadow: 0px 4px 15px 5px rgb(0 0 0 / 5%);
    border: 2px solid ${(props) => props.theme.colors.lineGrey};
    animation: 0.3s ease-out 0s 1 slideInFromLeft;

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
