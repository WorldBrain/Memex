import React from 'react'
import {
    ModalBox,
    ModalColLeft,
    ModalColRight,
    ModalColRightBig,
} from 'src/common-ui/components/design-library/ModalBox'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import {
    TypographyBodyBlock,
    TypographyHeadingPage,
} from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'

export const NoConnectionScreen = ({ onClose }: { onClose: () => void }) => {
    return (
        <ModalBox
            header={'Problems with your Internet Connection!'}
            actions={null}
            key={`dialog-success`}
        >
            <CenterText>
                <TypographyBodyBlock>
                    Connect to a stable internet connection and reload this tab.
                </TypographyBodyBlock>
            </CenterText>
        </ModalBox>
    )
}

const CenterText = styled.div`
    width: 100%;
    & > div {
        justify-content: center;
    }

    & span {
        text-align: center;
    }
`
