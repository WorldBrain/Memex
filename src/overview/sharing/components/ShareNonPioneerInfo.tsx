import React, { PureComponent } from 'react'
import {
    TypographyHeadingBig,
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographySubTextNormal,
} from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

interface ShareNonPioneerInfoProps {
    onClickUpgrade: () => void
}

export default class ShareNonPioneerInfo extends PureComponent<
    ShareNonPioneerInfoProps
> {
    render() {
        return (
            <ModalBox>
                <TypographyHeadingBigger>
                    This is a beta feature
                </TypographyHeadingBigger>
                <div>
                    <TypographyTextNormal>
                        For now, this feature is only available to Pioneer
                        supporters
                    </TypographyTextNormal>
                </div>
                <br />
                <TypographySubTextNormal>
                    Memex is built on a strong foundation to take no VC money to
                    protect your data & privacy.
                    <br />
                    Early supporters like you make this journey possible.
                </TypographySubTextNormal>
                <br />
                <PrimaryAction
                    onClick={this.props.onClickUpgrade}
                    label={'Upgrade'}
                />
            </ModalBox>
        )
    }
}

const ModalBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    & span {
        text-align: center;
    }
`
