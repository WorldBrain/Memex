import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'

import styled from 'styled-components'
import { TutorialStepContent } from './tutorial-cards-content'

interface Props extends TutorialStepContent {
    cardIndex: number
}

export default class TutorialStep extends React.Component<Props> {
    closeTutorial = () => window.close()

    render() {
        return (
            <React.Fragment>
                <CardBodyHeader>
                    <CardNumber>{this.props.cardIndex + 1}</CardNumber>{' '}
                    <CardSubTitle>{this.props.subtitle}</CardSubTitle>
                    <ShortcutLabel>{this.props.keyboardShortcut}</ShortcutLabel>
                </CardBodyHeader>
                <TutorialText>{this.props.text}</TutorialText>
            </React.Fragment>
        )
    }
}

const CardNumber = styled.div``
const ShortcutLabel = styled.div``
const CardSubTitle = styled.div`
    font-size: 1.5em;
    border-bottom: 0px;
`
const TutorialText = styled.div`
    border-bottom: 0px;
    align-self: flex-start;
`

const CardBodyHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: end;
`
