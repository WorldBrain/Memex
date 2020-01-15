import React from 'react'
import {
    ModalBox,
    ModalColLeft,
    ModalColRight,
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
            header={''}
            actions={[<PrimaryAction label={'Finish'} onClick={onClose} />]}
        >
            <ModalColLeft>
                <TypographyHeadingPage>Succeess!</TypographyHeadingPage>
                <TypographyBodyBlock>Device is now synced!</TypographyBodyBlock>
                <TypographyBodyBlock>
                    Pages, tags and notes shared via your phone will now sync
                    with your desktop memex.
                </TypographyBodyBlock>
                <TypographyBodyBlock>
                    View our <ExternalLink label={'Roadmap'} href={''} /> to
                    learn about the full set of upcoming sync and mobile
                    features.
                </TypographyBodyBlock>
            </ModalColLeft>
            <ModalColRight>
                <div>{'Picture Here'}</div>
            </ModalColRight>
        </ModalBox>
    )
}
