import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { LoadingIndicator } from 'src/common-ui/components'
import {
    TypographyHeadingBig,
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographySubTextNormal,
    TypographyHeadingNormal,
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { formBackground } from 'src/common-ui/components/design-library/colors'

interface DisplayNameSetupProps {
    name: string
    onChange: (newName: string) => void
    onClickNext: () => void
}

const NameInput = styled.input`
    background-color: ${formBackground};
    border-radius: 3px;
    outline: none;
    border: none;
    width: 300px;
    height: 35px;
    margin: 0 0 20px 0;
    text-align: center;
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`


export default class DisplayNameSetup extends PureComponent<
    DisplayNameSetupProps
> {
    state = {
        buttonLabel: 'Update'
    }

    private ChangeInput = (e) => {
        this.setState({
            buttonLabel: 'Update'
        })
        this.props.onChange(e.target.value)
    }

    private confirmSave = () => {
        this.setState({
            buttonLabel: 'Saved!'
        })
        this.props.onClickNext()
    }

    render() {
        return (
            <div>
                <InputContainer>
                    <NameInput
                        value={this.props.name || ''}
                        onChange={(e) => this.ChangeInput(e)}
                    />

                    <PrimaryAction
                        label={this.state.buttonLabel}
                        onClick={() => this.confirmSave()}
                    />
                </InputContainer>
            </div>
        )
    }
}
