import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { TaskState } from 'ui-logic-core/lib/types'
import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'

const COPY_TIMEOUT = 2000

export interface Props {
    children: React.ReactNode
    // shareAllState: TaskState
    // unshareAllState: TaskState
    // checkboxCopy: React.ReactNode
    linkTitleCopy?: React.ReactNode
    linkSubtitleCopy?: React.ReactNode
    // checkboxTitleCopy?: React.ReactNode
    // checkboxSubtitleCopy?: React.ReactNode
    getLink: () => Promise<string>
    onClickOutside?: () => void
    /** This logic should include handling derendering this share menu view. */
    // onUnshareClick?: () => Promise<void>
    // onShareAllClick: () => Promise<void>
    // onUnshareAllClick: () => Promise<void>
    onCopyLinkClick: (createdLink: string) => Promise<void>
}

export interface State {
    loadState: TaskState
    copyState: TaskState
    showCopySuccess: boolean
    link?: string
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = {
        loadState: 'running',
        copyState: 'pristine',
        showCopySuccess: false,
    }

    async componentDidMount() {
        try {
            const createdLink = await this.props.getLink()
            this.setState({
                link: createdLink,
                loadState: 'success',
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
        }
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

    // private renderShortcutTip({ modifier }: { modifier: 'Shift' | 'Alt' }) {
    //     return (
    //         <ShortcutTip>
    //             <TypographyTextSmall css="font-weight: 'bold'; margin-right: '10px'">
    //                 <strong>Tip:</strong>
    //                 {'\xa0'}
    //             </TypographyTextSmall>
    //             <TypographyTextSmall>{modifier} + click </TypographyTextSmall>
    //             <TipShareIcon src={icons.shareWhite} />
    //         </ShortcutTip>
    //     )
    // }

    // private handleUnshareClick = async () => {
    //     if (this.props.unshareAllState === 'pristine') {
    //         await this.props.onUnshareClick()
    //     }
    // }

    private handleLinkClick = async () => {
        if (this.state.copyState === 'pristine') {
            this.setState({ copyState: 'running' })
            try {
                await this.props.onCopyLinkClick(this.state.link)
                this.setState({ copyState: 'success' })

                this.copyTimeout = setTimeout(() => {
                    this.setState({ loadState: 'pristine' })
                }, COPY_TIMEOUT)
            } catch (e) {
                this.setState({ copyState: 'error' })
                throw e
            }
        }
    }

    // private renderUnshareIcon() {
    //     if (!this.props.onUnshareClick) {
    //         return null
    //     }

    //     if (this.props.unshareAllState === 'running') {
    //         return <LoadingIndicator />
    //     }

    //     return (
    //         <RemoveIcon src={icons.trash} onClick={this.handleUnshareClick} />
    //     )
    // }

    // private renderShareAllContent() {
    //     const { shareAllState: shareAllBtn } = this.props

    //     return (
    //         <>
    //             <CheckBoxBox>
    //                 {shareAllBtn === 'pristine' || shareAllBtn === 'running' ? (
    //                     <LoadingIndicator />
    //                 ) : (
    //                     <Checkbox>
    //                         <CheckboxInner
    //                             isChecked={shareAllBtn === 'checked'}
    //                         />
    //                     </Checkbox>
    //                 )}
    //             </CheckBoxBox>
    //             <ShareAllText>{this.props.checkboxCopy}</ShareAllText>
    //         </>
    //     )
    // }

    private renderLinkContent() {
        const { loadState, copyState } = this.state

        if (loadState === 'running') {
            return <LoadingIndicator />
        } else if (copyState === 'success') {
            return (
                <TypographyTextNormal>Copied to Clipboard</TypographyTextNormal>
            )
        } else {
            return (
                <>
                    <TypographyTextNormal>
                        {this.state.link}
                    </TypographyTextNormal>
                    <img src={icons.copy} />
                </>
            )
        }
    }

    render() {
        return (
            <ClickAway onClickAway={this.handleClickOutside}>
                <Menu>
                    <TopArea>
                        <SectionTitle>{this.props.linkTitleCopy}</SectionTitle>
                        <SectionDescription>
                            {this.props.linkSubtitleCopy}
                        </SectionDescription>
                        {/*<ShareAllBox
                            // tooltipText={this.renderShortcutTip({
                            //     modifier: 'Alt',
                            // })}
                            position="bottom"
                        >*/}
                        <LinkCopierBox>
                            <LinkCopier
                                state={this.state.loadState}
                                onClick={this.handleLinkClick}
                            >
                                {this.renderLinkContent()}
                            </LinkCopier>
                            {/* {this.renderUnshareIcon()} */}
                        </LinkCopierBox>
                        {/*</ShareAllBox>*/}
                    </TopArea>
                    {this.props.children}
                    {/* <SectionTitle>{this.props.checkboxTitleCopy}</SectionTitle>
                    <SectionDescription>
                        {this.props.checkboxSubtitleCopy}
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
                    </ShareAllBox> */}
                </Menu>
            </ClickAway>
        )
    }
}

export default ShareAnnotationMenu

const Menu = styled.div`
    & * {
        font-family: 'Poppins', sans-serif;
        line-height: 22px;
    }
`

const TopArea = styled.div`
    padding: 10px 15px;
`
const SectionTitle = styled.div`
    font-weight: bold;
    font-size: 14px;
    color: #3a2f45;
`

const SectionDescription = styled.div`
    font-size: 12px;
    color: #3a2f45;
    padding-bottom: 5px;
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
    width: 100%;
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

    & > span {
        overflow: hidden;
        width: 90%;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`
const LinkText = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 90%;
    font-size: 8px;
    color: black;
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

    & span {
        color: #fff;
    }

    & div {
        color: #fff;
    }
`
