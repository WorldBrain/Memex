import React from 'react'
import styled from 'styled-components'
import { storiesOf } from '@storybook/react'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { Link } from 'src/common-ui/components/design-library/actions/Link'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import { Tip } from 'src/common-ui/components/design-library/Tip'

import {
    ModalBox,
    ModalColLeft,
    ModalColRight,
} from 'src/common-ui/components/design-library/ModalBox'

const FlexContainer = styled.div`
    display: flex;
    justify-content: space-between;
`
storiesOf('Design Library', module)
    .add('Actions', () => (
        <FlexContainer>
            <PrimaryAction label={'PrimaryAction'} onClick={() => false} />
            <SecondaryAction label={'SecondaryAction'} onClick={() => false} />
            <Link label={'Link'} onClick={() => false} />
            <LesserLink label={'LesserLink'} onClick={() => false} />
            <ExternalLink label={'ExternalLink'} href={''} />
        </FlexContainer>
    ))
    .add('Other', () => (
        <FlexContainer>
            <Tip>The device paired but had a problem syncing data</Tip>
        </FlexContainer>
    ))
    .add('Modal', () => (
        <div>
            <ModalBox
                actions={[
                    <SecondaryAction
                        key={`button-1`}
                        label={'Cancel'}
                        onClick={undefined}
                    />,
                    <PrimaryAction
                        key={`button-2`}
                        label={'Action'}
                        onClick={undefined}
                    />,
                ]}
                header={'Modal Header'}
            >
                <div>{'Content'}</div>
            </ModalBox>
            <ModalBox
                actions={[
                    <SecondaryAction
                        key={`button-1`}
                        label={'Cancel'}
                        onClick={undefined}
                    />,
                    <PrimaryAction
                        key={`button-2`}
                        label={'Action'}
                        onClick={undefined}
                    />,
                ]}
                header={'Modal Header'}
            >
                <ModalColLeft>{'ModalColLeft'}</ModalColLeft>
                <ModalColRight>{'ModalColRight'}</ModalColRight>
            </ModalBox>
        </div>
    ))
