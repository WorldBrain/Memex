import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { reactEventHandler } from 'src/util/ui-logic'

import * as logic from './tutorial-card.logic'

import { ThemeProvider } from 'styled-components'
import styled from 'styled-components'
import { theme } from 'src/common-ui/components/design-library/theme'
import { tutorialContents, TutorialCardContent } from './tutorial-cards-content'

// card container (hold cycling logic)
// card component (holds card content, isEndOfCycle, isStartOfCycle)

export interface Props {
    content: TutorialCardContent[]
}
export interface State {
    cardIndex: number
}

export default class TutorialContainer extends React.Component<Props, State> {
    static propTypes = {
        // onConfirm: PropTypes.func.isRequired,
        // onClose: PropTypes.func.isRequired,
    }

    state: State = { cardIndex: 0 }
    handleEvent = null

    componentWillMount() {
        this.handleEvent = reactEventHandler(this, logic.processEvent)
    }

    closeTutorial = () => window.close()
    finishTutorial = () => window.close()
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
                        <button
                            onClick={this.closeTutorial}
                            // onClick={this.handleEvent({ type: 'onClose' })}
                        >
                            X
                        </button>
                    </ExitButton>
                    <MemexLogoContainer>@ memex</MemexLogoContainer>
                    <TutorialTitle>
                        {this.props.content[this.state.cardIndex].title}
                    </TutorialTitle>
                </CardHeader>
                <CardBody>
                    {this.props.content[this.state.cardIndex].component}
                </CardBody>
                <CardFooter>
                    {this.state.cardIndex > 0 ? (
                        <button onClick={this.prevCard}>Go Back</button>
                    ) : (
                        <div />
                    )}
                    {this.state.cardIndex < this.props.content.length - 1 ? (
                        <button onClick={this.nextCard}>Next Step</button>
                    ) : (
                        <button onClick={this.finishTutorial}>Finish</button>
                    )}
                </CardFooter>
            </TutorialCardContainer>
        )
    }
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}

const TutorialCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    position: absolute;
    left: 0;
    top: 30%;
    background: #ffffff;
    border-radius: 3px;
    color: black !important;
    font-size: 11px;
    font-weight: 500;
    max-width: 160px;
    line-height: 1.4;
    padding: 0.5em 1em;
    text-align: center;
    width: 200px;
    height: 300px;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
`

const MemexLogoContainer = styled.div`
    align-self: flex-start;
`

const TutorialTitle = styled.div`
    font-size: 2em;
    border-bottom: 0px;
    align-self: flex-start;
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
`
const CardFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`
