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
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'

export const Success = ({ onClose }: { onClose: () => void }) => {
    return (
        <ModalBox
            header={'SUCCESS! - Your devices are now synced!'}
            actions={null}
            key={`dialog-success`}
        >
            <ModalColLeft>
                <TypographyBodyBlock>
                    Pages, tags and notes saved via your phone will now sync
                    with your Desktop memex.
                </TypographyBodyBlock>
                <TypographyBodyBlock>
                    View our{' '}
                    <ExternalLink
                        label={'Roadmap'}
                        href={
                            'https://www.notion.so/262a367f7a2a48ff8115d2c71f700c14'
                        }
                    />{' '}
                    to learn about the full set of upcoming sync and mobile
                    features.
                </TypographyBodyBlock>
            </ModalColLeft>
            <ModalColRightBig>
                <img src={'/img/share_dialogue.png'} />
            </ModalColRightBig>
        </ModalBox>
    )
}
