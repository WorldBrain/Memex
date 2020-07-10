import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { LoadingIndicator } from 'src/common-ui/components'

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

const LinkContainer = styled.div`
    margin-bottom: 10px;
`

const ShareToggleButton = styled.button`
    display: block;
    position: relative;

    height: 21px;
    width: 77px;
    outline: none;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    background: transparent;

    cursor: pointer;
`

const ShareToggleKnob = styled.div`
    width: 19px;
    height: 19px;
    border-radius: 50%;

    position: absolute;
    top: 0px;
    left: 0px;

    transition: 0.3s;
    background-color: #888888;

    ${(props) =>
        props.enabled &&
        css`
            background-color: #5cd9a6;
            transform: translate(58px);
        `}
`

const ShareToggleText = styled.div`
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.01em;

    transition: 0.3s;

    transform: translate(7px);
    color: #b8b8b8;

    ${(props) =>
        props.enabled &&
        css`
            transform: translate(-5px);
            color: #494949;
        `}
`

const UploadingContainer = styled.div`
    height: 75px;
    margin-bottom: 10px;
`

interface ShareToggleProps {
    isActive: boolean
    activeText: string
    inactiveText: string

    onClickToggle: () => void
}

class ShareToggle extends PureComponent<ShareToggleProps> {
    render() {
        return (
            <ShareToggleButton onClick={this.props.onClickToggle}>
                <ShareToggleText enabled={this.props.isActive}>
                    {this.props.isActive
                        ? this.props.activeText
                        : this.props.inactiveText}
                </ShareToggleText>
                <ShareToggleKnob enabled={this.props.isActive} />
            </ShareToggleButton>
        )
    }
}

interface ShareModalContentProps {
    isPublic: boolean
    collectionName: string
    shareUrl?: string
    isUploading: boolean

    onClickToggle: () => void
    onClickLetUsKnow: () => void
    onClickViewRoadmap: () => void
}

export default class ShareModalContent extends PureComponent<
    ShareModalContentProps
> {
    render() {
        return (
            <div>
                <HeaderText>Share "{this.props.collectionName}"</HeaderText>
                <Text>Anyone with this link can view your collection</Text>

                <LinkContainer>
                    <ShareToggle
                        isActive={this.props.isPublic}
                        activeText={'shared'}
                        inactiveText={'private'}
                        onClickToggle={this.props.onClickToggle}
                    />
                    <div>
                        {this.props.isPublic
                            ? this.props.shareUrl || <LoadingIndicator />
                            : 'turn on sharing to generate link'}
                    </div>
                </LinkContainer>

                <UploadingContainer>
                    {this.props.isUploading && (
                        <div>
                            <LoadingIndicator />
                            <div>Uploading</div>
                            <div>You can close this screen</div>
                        </div>
                    )}
                </UploadingContainer>

                <Text>
                    This feature is intentionally simple. We want to find out
                    more about how you want to share your web knowledge and
                    filter your incoming information streams.
                </Text>

                <ButtonsContainer>
                    <Button onClick={this.props.onClickLetUsKnow}>
                        Let us know >>
                    </Button>
                    <Button onClicke={this.props.onClickViewRoadmap}>
                        View the Roadmap >>
                    </Button>
                </ButtonsContainer>
            </div>
        )
    }
}
