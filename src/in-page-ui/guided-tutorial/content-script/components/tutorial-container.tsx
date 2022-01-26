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

// card container (hold cycling logic)
// card component (holds card content, isEndOfCycle, isStartOfCycle)

export interface Props {
    content: TutorialCardContent[]
    destroyTutorial: () => void
    finishTutorial: () => void
}
export interface State {
    cardIndex: number
}

export default class TutorialContainer extends React.Component<Props, State> {
    state: State = { cardIndex: 0 }

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

    render() {
        return (
            <TutorialCardContainer>
                <CardHeader>
                    <ExitButton>
                        <CloseButton
                            onClick={this.props.destroyTutorial}
                            // onClick={this.handleEvent({ type: 'onClose' })}
                            src={icons.close}
                        />
                    </ExitButton>
                    <MemexLogoContainer src={icons.logoHorizontal} />
                    <TutorialTitle>
                        {this.props.content[this.state.cardIndex].title}
                    </TutorialTitle>
                </CardHeader>
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
`

const TutorialCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    position: fixed;
    left: 0px;
    background: #ffffff;
    border-radius: 3px;
    color: black !important;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    padding: 3em;
    text-align: center;
    width: 300px;
    height: 500px;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
    top: 50%;
    margin-top: -250px;
    animation: 1s ease-in-out 0s 1 slideInFromLeft;

    @keyframes slideInFromLeft {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(0);
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
`
const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: stretch;
    flex-grow: 1;
    padding: 40px 0 0 0;
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
