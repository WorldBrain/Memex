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
const InstructionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    & div {
        display: flex;
        justify-content: center;
    }

    & span {
        text-align: center;
    }
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const TypographyTextNormalAlert = styled(TypographyTextNormal)`
    color: red;
`

export default class DisplayNameSetup extends PureComponent<
    DisplayNameSetupProps
> {
    render() {
        return (
            <div>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            Setup your display name
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            This is how people know who the shared content is
                            from.
                            <br />
                        </TypographyTextNormal>
                        <TypographyTextNormalAlert>
                            <strong>
                                You can't edit this name in the next 2 weeks
                            </strong>
                        </TypographyTextNormalAlert>
                    </InstructionsBox>
                </InstructionsContainer>

                <InputContainer>
                    <NameInput
                        value={this.props.name || ''}
                        onChange={(e) => this.props.onChange(e.target.value)}
                    />

                    <PrimaryAction
                        label={'Save'}
                        onClick={this.props.onClickNext}
                    />
                </InputContainer>
            </div>
        )
    }
}
