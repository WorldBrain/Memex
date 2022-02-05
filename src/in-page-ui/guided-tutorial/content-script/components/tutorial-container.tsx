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
            <TutorialCardContainer
                top={
                    this.props.content[this.state.cardIndex].component.props.top
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
            >
                <CardBody>
                    {this.props.content[this.state.cardIndex].component}
                </CardBody>
                <CardFooter>
                    {this.state.cardIndex > 0 ? (
                        <BackButton onClick={this.prevCard}>Go Back</BackButton>
                    ) : (
                        <div />
                    )}
                    {this.state.cardIndex < this.props.content.length - 1 ? (
                        <PrimaryAction
                            onClick={this.nextCard}
                            label={'Next Step'}
                        />
                    ) : (
                        <PrimaryAction
                            label={'Finish'}
                            onClick={this.props.finishTutorial}
                        />
                    )}
                </CardFooter>
            </TutorialCardContainer>
        )
    }
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}

const BackButton = styled.div`
    font-size: 14px;
    font-weight: bold;
    margin-right: 20px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.lighterText};
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
    width: ${(props) => (props.width ? props.width : '300px')};
    height: ${(props) => (props.height ? props.height : '500px')};
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    position: fixed;
    background: #ffffff;
    border-radius: 12px;
    color: black !important;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    padding: 3em;
    text-align: center;

    font-family: 'Inter', sans-serif;
    box-shadow: 0px 4px 15px 5px rgb(0 0 0 / 5%);
    border: 4px solid ${(props) => props.theme.colors.purple};
    animation: 1s ease-in-out 0s 1 slideInFromLeft;

    @keyframes slideInFromLeft {
        0% {
            transform: translateX(
                ${(props) => (props.width ? props.width : '300px')}
            );
        }
        100% {
            transform: translateX(0%);
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
