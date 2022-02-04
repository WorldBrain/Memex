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
                    <TitleBox>
                        <CardSubTitle>{this.props.subtitle}</CardSubTitle>
                    </TitleBox>
                    {this.props.keyboardShortcut && (
                        <ShortcutLabel>
                            {this.props.keyboardShortcut}
                        </ShortcutLabel>
                    )}
                </CardBodyHeader>
                <TutorialText>{this.props.text}</TutorialText>
            </React.Fragment>
        )
    }
}

const CardNumber = styled.div`
    background: #f0f0f0;
    border-radius: 40px;
    color: #545454;
    text-align: center;
    vertical-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    padding: 5px;
    height: 30px;
    width: 30px;
    margin-right: 10px;
`
const ShortcutLabel = styled.div`
    border: 1px solid #f29d9d;
    border-radius: 3px;
    padding: 2px 5px;
    font-size: 12px;
    width: fit-content;
    background-color: #f29d9d60;
`

const CardSubTitle = styled.div`
    font-size: 1.7em;
    font-weight: bold;
    text-align: left;
    padding: 5px 0 0 0;
    line-height: 30x;
    border-bottom: 0px;
    width: 100%;
`

const TutorialText = styled.div`
    border-bottom: 0px;
    align-self: flex-start;
    color: ${(props) => props.theme.colors.darkgrey};
    font-size: 16px;
    text-align: left;
    font-weight: normal;
    line-height: 25px;
`

const TitleBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
`

const CardBodyHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`
