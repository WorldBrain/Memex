import React, { PureComponent } from 'react'
import styled from 'styled-components'

import {
    TypographyTextNormal,
    TypographyTextSmall,
} from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator, ButtonTooltip } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'

const COPY_TIMEOUT = 2000

export interface Props {
    shareAllText: string
    shareAllBtn: 'pristine' | 'running' | 'checked'
    getCreatedLink: () => Promise<string>
    onClickOutside?: () => void
    /** This logic should include handling derendering this share menu view. */
    onUnshareClick: () => Promise<void>
    onShareAllClick: () => Promise<void>
    onCopyLinkClick: (createdLink: string) => void
}

export interface State {
    linkCopier: 'pristine' | 'running' | 'copied'
    unshareBtn: 'pristine' | 'running' | 'disabled'
    createdLink: string | undefined
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = {
        linkCopier: 'running',
        unshareBtn: 'disabled',
        createdLink: undefined,
    }

    async componentDidMount() {
        const createdLink = await this.props.getCreatedLink()

        this.setState({
            createdLink,
            linkCopier: 'pristine',
            unshareBtn: 'pristine',
        })
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    handleClickOutside = () => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside()
        }
    }

    private renderShortcutTip({ modifier }: { modifier: 'Shift' | 'Alt' }) {
        return (
            <ShortcutTip>
                <TypographyTextSmall css="font-weight: 'bold'; margin-right: '10px'">
                    <strong>Tip: </strong>
                </TypographyTextSmall>
                <TypographyTextSmall>{modifier} + click </TypographyTextSmall>
                <TipShareIcon src={icons.shareWhite} />
            </ShortcutTip>
        )
    }

    private handleUnshareClick = async () => {
        const { unshareBtn } = this.state

        if (unshareBtn === 'pristine') {
            this.setState({ unshareBtn: 'running' })
            await this.props.onUnshareClick()
        }
    }

    private handleLinkClick = async () => {
        const { linkCopier } = this.state

        if (linkCopier === 'pristine') {
            this.setState({ linkCopier: 'copied' })
            this.props.onCopyLinkClick(this.state.createdLink)

            this.copyTimeout = setTimeout(() => {
                this.setState({ linkCopier: 'pristine' })
            }, COPY_TIMEOUT)
        }
    }

    private renderUnshareContent() {
        const { unshareBtn } = this.state

        if (unshareBtn === 'running') {
            return <LoadingIndicator />
        }

        return <TypographyTextSmall>Unshare annotation</TypographyTextSmall>
    }

    private renderShareAllContent() {
        const { shareAllBtn } = this.props

        if (shareAllBtn === 'running') {
            return (
                <>
                    <CheckBoxBox>
                        <LoadingIndicator />
                    </CheckBoxBox>
                    <ShareAllText>{this.props.shareAllText}</ShareAllText>
                </>
            )
        }

        return (
            <>
                <CheckBoxBox>
                    <Checkbox>
                        <CheckboxInner isChecked={shareAllBtn === 'checked'} />
                    </Checkbox>
                </CheckBoxBox>
                <ShareAllText>{this.props.shareAllText}</ShareAllText>
            </>
        )
    }

    private renderLinkContent() {
        const { linkCopier } = this.state

        if (linkCopier === 'running') {
            return <LoadingIndicator />
        } else if (linkCopier === 'copied') {
            return (
                <TypographyTextNormal>Copied to Clipboard</TypographyTextNormal>
            )
        } else if (linkCopier === 'pristine') {
            return (
                <>
                    <LinkText>{this.state.createdLink}</LinkText>
                    <LinkCopyIcon src={icons.copy} />
                </>
            )
        }
    }

    render() {
        return (
            <ClickAway onClickAway={this.handleClickOutside}>
                <Menu>
                    <SectionTitle>Link to Page</SectionTitle>
                    <SectionDescription>
                        A link to all shared notes on this page.
                    </SectionDescription>
                    <ShareAllBox
                        tooltipText={this.renderShortcutTip({
                            modifier: 'Alt',
                        })}
                        position="bottom"
                    >
                        <LinkCopierBox>
                            <LinkCopier
                                state={this.state.linkCopier}
                                onClick={this.handleLinkClick}
                            >
                                {this.renderLinkContent()}
                            </LinkCopier>
                            <RemoveIcon src={icons.trash} />
                        </LinkCopierBox>
                    </ShareAllBox>
                    <Spacing />
                    <SectionTitle>Share all Notes</SectionTitle>
                    <SectionDescription>
                        Add all notes on page to shared collections
                    </SectionDescription>
                    <ShareAllBox
                        tooltipText={this.renderShortcutTip({
                            modifier: 'Shift',
                        })}
                        position="bottom"
                    >
                        <ShareAllBtn onClick={this.props.onShareAllClick}>
                            {this.renderShareAllContent()}
                        </ShareAllBtn>
                    </ShareAllBox>
                    {/*<UnshareBtn
                            state={this.state.unshareBtn}
                            onClick={this.handleUnshareClick}
                            disabled={this.state.unshareBtn === 'disabled'}
                        >
                            {this.renderUnshareContent()}
                        </UnshareBtn>
                        */}
                </Menu>
            </ClickAway>
        )
    }
}

export default ShareAnnotationMenu

const Menu = styled.div`
    padding: 10px 15px;
`

const Spacing = styled.div`
    height: 15px;
`

const SectionTitle = styled.div`
    font-weight: bold;
    font-size: 14px;
    color: #3a2f45;
`

const SectionDescription = styled.div`
    font-size: 12px;
    color: #3a2f45;
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
`

const RemoveIcon = styled.img`
    width: 24px;
    height: 24px;
    margin-left: 10px;
    border-radius: 3px;
    padding: 3px;
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }
`

const LinkCopier = styled.button`
    width: 100%
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0;
    border-radius: 3px;
    height: 30px;
    padding: 0 10px;
    outline: none;
    cursor: pointer;
    overflow: hidden;
`
const LinkText = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 90%;
`
const LinkCopyIcon = styled.img``

// TODO Move these somewhere else for re-use

const ShareAllBox = styled(ButtonTooltip)`
    width: 100%;
`

const ShareAllBtn = styled.button`
    width: 100%
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border: 0;
    border-radius: 3px;
    height: 34px;
    padding: 0 10px;
    outline: none;
    background: none;
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }
`

const CheckBoxBox = styled.div`
    width: 34px;
    height: 34px;
    align-items: center;
    display: flex;
    justify-content: center;
`

const Checkbox = styled.div`
    border: 1px solid red;
    width: 14px;
    height: 14px;
    outline: none;
`
const CheckboxInner = styled.div`
    border: 1px solid black;
    width: 14px;
    height: 14px;
    outline: none;
`

const UnshareBtn = styled.button``

const ShareAllText = styled(TypographyTextNormal)`
    margin-left: 10px;
`

const TipShareIcon = styled.img`
    height: 15px;
    width: auto;
    margin-left: 5px;
`
const ShortcutTip = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;
    font-size: 8px;

    & * {
        color: #fff;
    }
`
