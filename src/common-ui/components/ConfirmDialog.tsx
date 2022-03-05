import React from 'react'
import styled from 'styled-components'

import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

export interface Props {
    titleText: React.ReactChild
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
        } = this.props
        return (
            <Container>
                <TitleText>{titleText}</TitleText>
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

const TitleText = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.darkerText};
    text-align: center;
    font-weight: 800;
    line-height: 26px;
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
`
