import React from 'react'
import styled from 'styled-components'

import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

export interface Props {
    titleText: React.ReactChild
    handleConfirmation: (affirmative: boolean) => React.MouseEventHandler
}

export default class ConfirmDialog extends React.PureComponent<Props> {
    render() {
        const { titleText, handleConfirmation } = this.props
        return (
            <Container>
                <TitleText>{titleText}</TitleText>
                <ConfirmBtnRow>
                    <PrimaryAction
                        label="Yes"
                        onClick={handleConfirmation(true)}
                    />
                    <SecondaryAction
                        label="No"
                        onClick={handleConfirmation(false)}
                    />
                </ConfirmBtnRow>
            </Container>
        )
    }
}

const TitleText = styled.h1``

const ConfirmBtnRow = styled.div`
    display: flex;
    flex-direction: row;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
`
