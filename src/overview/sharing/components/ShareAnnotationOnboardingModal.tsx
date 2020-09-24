import React, { Component } from 'react'
import styled from 'styled-components'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import {
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographyHeadingNormal,
} from 'src/common-ui/components/design-library/typography'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    onClose: () => void
    onClickLetUsKnow: () => void
    onClickViewRoadmap: () => void
    onClickSharingTutorial: () => void
}

const ShareIconBox = styled.div`
    display: flex;
    justify-content: flex-start;
`

const ShareIconContainer = styled.div`
	display: flex;
	justify-content: flex-start
	align-items: center;
	margin-right: 30px
`

const ShareIconFull = styled.div`
    background-image: url(${icons.shared});
    background-position: center center;
    background-repeat: no-repeat;
    width: 30px;
    height: 30px;
    background-size: contain;
    margin-right: 5px;
`

const ShareIconEmpty = styled.div`
    background-image: url(${icons.lock});
    background-position: center center;
    background-repeat: no-repeat;
    width: 30px;
    height: 25px;
    background-size: contain;
    margin-right: 5px;
`

const ShareIconText = styled.span``

const BetaInfoContainer = styled.div`
    margin-top: 40px;
    width: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    border-radius: 3px;
    padding: 20px;
    justify-content: center;
`

const BlockHeading = styled(TypographyHeadingNormal)`
    margin-bottom: 10px;
    font-size: 18px;
`

const LinkBox = styled.div`
    width: 100%;
    margin-top: 30px;
    justify-content: center;
    display: flex;
`

const InstructionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 45px;
`

const LinkContainer = styled.div`
    display: flex;
    align-items: center;
`

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > * {
        margin: 0 5px;
    }
`

const Text = styled.div`
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 21px;
    text-align: center;
    margin-bottom: 30px;
    font-family: 'Poppins', sans-serif;
`

export default class ShareAnnotationOnboardingModal extends Component<Props> {
    render() {
        return (
            <Modal {...this.props} large>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            NEW: Share Annotations
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            Once shared, anyone with the link can view them.<br/>
                            They are also added to all shared collection the page is part of.
                        </TypographyTextNormal>
                    </InstructionsBox>
                </InstructionsContainer>

                <LinkBox>
                    <ShareIconBox>
                        <ShareIconContainer>
                            <ShareIconFull />
                            <ShareIconText>Shared</ShareIconText>
                        </ShareIconContainer>
                        <ShareIconContainer>
                            <ShareIconEmpty />
                            <ShareIconText>Private</ShareIconText>
                        </ShareIconContainer>
                    </ShareIconBox>
                </LinkBox>
                <BetaInfoContainer>
                    <BlockHeading>🚀 This is a beta feature</BlockHeading>
                    <Text>
                        What needs to change so it fits better into your
                        workflow?
                    </Text>

                    <ButtonsContainer>
                        <PrimaryAction
                            label={'Share Feedback'}
                            onClick={this.props.onClickLetUsKnow}
                        />
                        <SecondaryAction
                            label={'View Roadmap'}
                            onClick={this.props.onClickViewRoadmap}
                        />
                        <SecondaryAction
                            label={'Tutorial'}
                            onClick={this.props.onClickSharingTutorial}
                        />
                    </ButtonsContainer>
                </BetaInfoContainer>
            </Modal>
        )
    }
}
