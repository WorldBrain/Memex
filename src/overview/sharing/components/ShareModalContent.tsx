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
import { TaskState } from 'ui-logic-core/lib/types'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'


const Margin20 = styled.div`
    height: 20px;
`

const HeaderText = styled.div`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;

    margin-bottom: 10px;
`

const Text = styled.div`
    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 21px;

    margin-bottom: 10px;
`

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > * {
        margin: 0 5px;
    }  
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

const InstructionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column; 
    align-items: flex-start;
`

const LinkContainer = styled.div`
    margin-bottom: 10px;
    margin-top: 20px;
    display: flex;
    align-items: center;
`

const ShareUrlBox = styled.div`
    background-color: #e0e0e0;
    padding: 3px 10px;
    width: 100%;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
`

const ShareUrl = styled.span`
    font-size: 12px;
`

const LinkBox = styled.div`
    width: 100%;
    height: 26px;
`

const UploadingContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;

    & div {
        margin-left: 10px;
    }
`

const BetaInfoContainer = styled.div`
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    border-radius: 3px;
    padding: 20px;
`



interface ShareToggleProps {
    isActive: boolean
    activeText: string
    inactiveText: string

    onClickToggle: () => void
}

interface ShareModalContentProps {
    isShared: boolean
    collectionName: string
    shareUrl?: string
    listCreationState: TaskState
    entriesUploadState: TaskState

    onClickToggle: () => void
    onClickLetUsKnow: () => void
    onClickViewRoadmap: () => void
    onClickKnownIssues: () => void
}

const COPY_TIMEOUT = 2000

export default class ShareModalContent extends PureComponent<
    ShareModalContentProps
> {
    state = {
        hasCopied: false,
    }

    copyTimeout?: ReturnType<typeof setTimeout>

    onClickCopy() {
        navigator.clipboard.writeText(this.props.shareUrl).catch((e) => {
            console.error(e)
        })

        this.setState({ hasCopied: true })

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        this.copyTimeout = setTimeout(() => {
            this.setState({ hasCopied: false })
        }, COPY_TIMEOUT)
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    render() {
        return (
            <div>
                <InstructionsContainer>
                    <InstructionsBox>
                        <TypographyHeadingBigger>
                            Share "{this.props.collectionName}"
                        </TypographyHeadingBigger>
                        <TypographyTextNormal>
                            Anyone with this link can view your collection
                        </TypographyTextNormal>
                    </InstructionsBox>
                    {!this.props.isShared &&
                        <PrimaryAction 
                            label={'Generate Link'}
                            onClick={this.props.onClickToggle}
                        />
                    }
                    {this.props.listCreationState === 'running' && (
                        <UploadingContainer>
                            <TypographyHeadingNormal>
                                Uploading Collection
                            </TypographyHeadingNormal>
                            <LoadingIndicator />
                        </UploadingContainer>
                    )}

                </InstructionsContainer>

                <LinkContainer>
                    <LinkBox>
                        {this.props.isShared && (
                            <ShareUrlBox onClick={() => this.onClickCopy()}>
                                <ShareUrl>
                                    {this.props.shareUrl}
                                    {this.props.listCreationState ===
                                        'running' && 'Creating list...'}
                                    {this.props.listCreationState === 'error' &&
                                        'Error while sharing list...'}
                                </ShareUrl>
                                {this.props.shareUrl && (
                                    <TypographyHeadingSmall>
                                        {this.state.hasCopied
                                            ? 'Copied to Clipboard'
                                            : 'Copy'}
                                    </TypographyHeadingSmall>
                                )}
                            </ShareUrlBox>
                        )}
                    </LinkBox>
                </LinkContainer>
                <BetaInfoContainer>
                    <Text>
                        This is a beta feature. We want to learn more about what you need to integrate it into your workflow. 
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
            </div>
        )
    }
}
