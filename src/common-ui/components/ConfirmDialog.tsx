import React from 'react'
import styled from 'styled-components'

import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

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
                        label={negativeLabel ?? 'No'}
                        onClick={handleConfirmation(false)}
                        type={'primary'}
                        size={'medium'}
                        width={'210px'}
                    />
                    <PrimaryAction
                        label={affirmativeLabel ?? 'Yes'}
                        onClick={handleConfirmation(true)}
                        type={'forth'}
                        size={'medium'}
                        width={'210px'}
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
    font-size: 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    text-align: center;
    font-weight: 500;
    line-height: 30px;
`

const SubTitleText = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale5};
    text-align: center;
    font-weight: 300;
    line-height: 24px;
    white-space: break-spaces;
    text-align: center;
`

const ConfirmBtnRow = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    align-items: center;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 30px;
    grid-gap: 20px;
    max-width: 400px;
`
