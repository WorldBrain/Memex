import React from 'react'
import styled from 'styled-components'

import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

export interface Props {
    titleText: React.ReactChild
    subTitleText?: React.ReactChild
    negativeLabel?: React.ReactChild
    affirmativeLabel?: React.ReactChild
    handleConfirmation: (affirmative: boolean) => React.MouseEventHandler
}

export default class ConfirmDialog extends React.PureComponent<Props> {
    render() {
        const {
            titleText,
            handleConfirmation,
            affirmativeLabel,
            negativeLabel,
            subTitleText,
        } = this.props
        return (
            <Container>
                <TextContainer>
                    <TitleText>{titleText}</TitleText>
                    <SubTitleText>{subTitleText}</SubTitleText>
                </TextContainer>
                <ConfirmBtnRow>
                    <PrimaryAction
                        label={affirmativeLabel ?? 'Yes'}
                        onClick={handleConfirmation(true)}
                        fontSize="12px"
                    />
                    <SecondaryAction
                        label={negativeLabel ?? 'No'}
                        onClick={handleConfirmation(false)}
                        borderOff
                    />
                </ConfirmBtnRow>
            </Container>
        )
    }
}

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
`

const TitleText = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.darkerText};
    text-align: center;
    font-weight: 800;
    line-height: 20px;
`

const SubTitleText = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.lighterText};
    text-align: center;
    font-weight: 300;
    line-height: 26px;
    white-space: break-spaces;
    text-align: center;
`

const ConfirmBtnRow = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    grid-gap: 20px;
    max-width: 500px;
`
