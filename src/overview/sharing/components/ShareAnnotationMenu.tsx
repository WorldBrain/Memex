import React, { PureComponent } from 'react'
import styled from 'styled-components'

import {
    TypographyTextNormal,
    TypographyTextSmall,
} from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'

const COPY_TIMEOUT = 2000

export interface Props {
    shareAllText: string
    getCreatedLink: () => Promise<string>
    /** This logic should include handling derendering this share menu view. */
    onUnshareClick: () => Promise<void>
    onShareAllClick: () => Promise<void>
    onCopyLinkClick: () => void
    getAllSharedStatus: () => Promise<boolean>
}

export interface State {
    linkCopier: 'pristine' | 'running' | 'copied'
    unshareBtn: 'pristine' | 'running' | 'disabled'
    shareAllBtn: 'pristine' | 'running' | 'checked'
    createdLink: string | undefined
}

export class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = {
        linkCopier: 'running',
        unshareBtn: 'disabled',
        shareAllBtn: 'running',
        createdLink: undefined,
    }

    async componentDidMount() {
        const [isAllShared, createdLink] = await Promise.all([
            this.props.getAllSharedStatus(),
            this.props.getCreatedLink(),
        ])

        this.setState({
            createdLink,
            linkCopier: 'pristine',
            unshareBtn: 'pristine',
            shareAllBtn: isAllShared ? 'checked' : 'pristine',
        })
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    private renderShortcutTip({ modifier }: { modifier: 'Shift' | 'Alt' }) {
        return (
            <ShortcutTip>
                <TypographyTextSmall css="font-weight: 'bold';">
                    Tip:{' '}
                </TypographyTextSmall>
                <TypographyTextSmall>{modifier} + click </TypographyTextSmall>
                <TipShareIcon src={icons.share} />
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

    private handleShareClick = async () => {
        const { shareAllBtn } = this.state

        if (shareAllBtn === 'pristine') {
            this.setState({ shareAllBtn: 'running' })
            await this.props.onShareAllClick()
            this.setState({ shareAllBtn: 'checked' })
        } else if (shareAllBtn === 'checked') {
            this.setState({ shareAllBtn: 'running' })
            await this.props.onShareAllClick()
            this.setState({ shareAllBtn: 'pristine' })
        }
    }

    private handleLinkClick = async () => {
        const { linkCopier } = this.state

        if (linkCopier === 'pristine') {
            this.setState({ linkCopier: 'copied' })
            this.props.onCopyLinkClick()

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
        const { shareAllBtn } = this.state

        if (shareAllBtn === 'running') {
            return <LoadingIndicator />
        }

        return (
            <>
                <Checkbox>
                    <CheckboxInner isChecked={shareAllBtn === 'checked'} />
                </Checkbox>
                <TypographyTextNormal>
                    {this.props.shareAllText}
                </TypographyTextNormal>
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
            <Menu>
                <LinkCopier
                    state={this.state.linkCopier}
                    onClick={this.handleLinkClick}
                >
                    {this.renderLinkContent()}
                </LinkCopier>
                {this.renderShortcutTip({ modifier: 'Alt' })}
                <ShareAllBtn
                    state={this.state.shareAllBtn}
                    onClick={this.handleShareClick}
                >
                    {this.renderShareAllContent()}
                </ShareAllBtn>
                {this.renderShortcutTip({ modifier: 'Shift' })}
                <UnshareBtn
                    state={this.state.unshareBtn}
                    onClick={this.handleUnshareClick}
                    disabled={this.state.unshareBtn === 'disabled'}
                >
                    {this.renderUnshareContent()}
                </UnshareBtn>
            </Menu>
        )
    }
}

const Menu = styled.div``

const LinkCopier = styled.button``
const LinkText = styled.span``
const LinkCopyIcon = styled.img``

const ShareAllBtn = styled.button``
// TODO Move these somewhere else for re-use
const Checkbox = styled.div``
const CheckboxInner = styled.div``

const UnshareBtn = styled.button``

const TipShareIcon = styled.img``
const ShortcutTip = styled.div``
