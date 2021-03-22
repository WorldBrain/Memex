import React, { PureComponent } from 'react'
import styled from 'styled-components'

import analytics from 'src/analytics'
import { LoadingIndicator } from 'src/common-ui/components'
import {
    TypographyTextNormal,
    TypographyHeadingBigger,
    TypographyHeadingNormal,
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'
import { TaskState } from 'ui-logic-core/lib/types'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { Modal } from 'src/common-ui/components'

const Text = styled.div`
    font-family: 'Poppins', sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    line-height: 21px;
    text-align: center;
    margin-bottom: 30px;
    font-family: 'Poppins', sans-serif;
`

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > * {
        margin: 0 5px;
    }
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

const ShareModalBox = styled.div`
    width: 100%;
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
    justify-content: center;
`

const BlockHeading = styled(TypographyHeadingNormal)`
    margin-bottom: 10px;
    font-size: 18px;
`

interface Props {
    isShared: boolean
    listName: string
    shareUrl?: string
    listCreationState: TaskState
    onGenerateLinkClick: () => void
    onClose: () => void
}

const COPY_TIMEOUT = 2000

export default class ShareListModalContent extends PureComponent<Props> {
    state = {
        hasCopied: false,
    }

    copyTimeout?: ReturnType<typeof setTimeout>

    onClickCopy() {
        navigator.clipboard.writeText(this.props.shareUrl).catch((e) => {
            console.error(e)
        })

        analytics.trackEvent({
            category: 'ContentSharing',
            action: 'copyCollectionLink',
        })

        this.setState({ hasCopied: true })

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        this.copyTimeout = setTimeout(() => {
            this.setState({ hasCopied: false })
        }, COPY_TIMEOUT)
    }

    private openUrl = (url: string, target?: string) => () =>
        window.open(url, target)

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    render() {
        return (
            <Modal large onClose={this.props.onClose}>
                <ShareModalBox>
                    <InstructionsContainer>
                        <InstructionsBox>
                            <TypographyHeadingBigger>
                                Share "{this.props.listName}"
                            </TypographyHeadingBigger>
                            <TypographyTextNormal>
                                Anyone with this link can view your collection
                            </TypographyTextNormal>
                        </InstructionsBox>
                        {!this.props.isShared && (
                            <PrimaryAction
                                label="Generate Link"
                                onClick={this.props.onGenerateLinkClick}
                            />
                        )}
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
                                        {this.props.listCreationState ===
                                            'error' &&
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
                        <BlockHeading>🚀 This is a beta feature</BlockHeading>
                        <Text>
                            What needs to change so it fits better into your
                            workflow?
                        </Text>

                        <ButtonsContainer>
                            <PrimaryAction
                                label="Share Feedback"
                                onClick={this.openUrl(
                                    'https://worldbrain.io/feedback',
                                )}
                            />
                            <SecondaryAction
                                label="View Roadmap"
                                onClick={this.openUrl(
                                    'https://worldbrain.io/roadmap',
                                )}
                            />
                            <SecondaryAction
                                label="Tutorial"
                                onClick={this.openUrl(
                                    'https://worldbrain.io/tutorials/memex-social',
                                )}
                            />
                        </ButtonsContainer>
                    </BetaInfoContainer>
                </ShareModalBox>
            </Modal>
        )
    }
}
