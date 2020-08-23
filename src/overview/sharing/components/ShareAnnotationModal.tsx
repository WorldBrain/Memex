import React, { Component } from 'react'
import styled, { css } from 'styled-components'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { LoadingIndicator } from 'src/common-ui/components'
import {
    TypographyHeadingBig,
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographySubTextNormal,
    TypographyHeadingNormal,
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props
    extends Pick<ModalProps, 'onClose' | 'requiresExplicitStyles'> {
    onClose: () => void
    onClickLetUsKnow: () => void
    onClickViewRoadmap: () => void
    onClickKnownIssues: () => void
}

const ShareIconBox = styled.div`
	display: flex;
	justify-content: flex-start
`

const ShareIconContainer = styled.div`
	display: flex;
	justify-content: flex-start
	align-items: center;
	margin-right: 30px
`

const ShareIconFull = styled.div`
	background-image: url(${icons.share});
	background-position: center center;
	background-repeat: no-repeat;
	width: 30px;
    height: 30px;
    background-size: contain;
    margin-right: 5px;
`

const ShareIconEmpty = styled.div`
	background-image: url(${icons.shareEmpty});
	background-position: center center;
	background-repeat: no-repeat;
	width: 30px;
    height: 30px;
    background-size: contain;
    margin-right: 5px;
`

const ShareIconText = styled.span``

const BetaInfoContainer = styled.div`
    margin-top: 40px;
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
    height: 26px;
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
    margin-bottom: 10px;
    margin-top: 20px;
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

const Button = styled.button`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    line-height: 21px;
    cursor: pointer;

    outline: none;
    border: none;
    background: transparent;
`

export default class ShareAnnotationModal extends Component<Props> {
    render() {
        return (
            <Modal {...this.props} large>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            NEW: Share highlights and notes in collections
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            Shared notes are visible in each collection the parent page is part of.
                        </TypographyTextNormal>
                    </InstructionsBox>
                </InstructionsContainer>

                <LinkContainer>
                    <LinkBox>
                    	<ShareIconBox>
                    		<ShareIconContainer>
                    			<ShareIconFull/>
                    			<ShareIconText>
                    				Shared
                    			</ShareIconText>
                    		</ShareIconContainer>
                    		<ShareIconContainer>
                    			<ShareIconEmpty/>
                    			<ShareIconText>
                    				Private
                    			</ShareIconText>
                    		</ShareIconContainer>
                    	</ShareIconBox>
                    </LinkBox>
                </LinkContainer>
                <BetaInfoContainer>
                    <BlockHeading>🚀 This is a beta feature</BlockHeading>
                    <Text>
                        What needs to change so it fits better into your workflow?
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
                            label={'Known Issues'}
                            onClick={this.props.onClickKnownIssues}
                        />
                    </ButtonsContainer>
                </BetaInfoContainer>
            </Modal>
        )
    }
}
