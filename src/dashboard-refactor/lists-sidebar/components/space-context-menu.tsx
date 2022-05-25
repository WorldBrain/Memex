import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { Icon } from 'src/dashboard-refactor/styled-components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import EditableMenuItem from './editable-menu-item'
import { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import ListShareModalLogic from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/logic'
import { Props as ListSidebarItemProps } from './sidebar-item-with-menu'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { ButtonTooltip } from 'src/common-ui/components'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

export interface Props extends ListSidebarItemProps {
    fixedPositioning?: boolean
    contentSharingBG: ContentSharingInterface
    buttonRef?: React.RefObject<HTMLButtonElement>
}

export interface State {
    xPosition: number
    yPosition: number
}

const Modal = ({
    children,
    show,
    closeModal,
    xPosition,
    yPosition,
}: {
    children: JSX.Element
    show: boolean
    closeModal: React.MouseEventHandler
} & State) => {
    return (
        <ModalRoot style={{ display: show ? 'block' : 'none' }}>
            <Overlay onClick={closeModal} />

            <ModalContent
                // onMouseLeave={closeModal}
                x={xPosition}
                y={yPosition}
            >
                {children}
            </ModalContent>
        </ModalRoot>
    )
}

const renderCopyableLink = ({
    link,
    roleID,
    linkIndex,
    showCopyMsg,
    copyLink,
}: InviteLink & {
    linkIndex: number
    copyLink: ({ event }: { event: { linkIndex: number } }) => Promise<void>
}) => {
    const viewportBreakpoint = 'normal'

    return (
        <Margin bottom="3px" key={link}>
            <LinkAndRoleBox viewportBreakpoint={viewportBreakpoint}>
                <CopyLinkBox>
                    <LinkBox
                        left="small"
                        onClick={() => copyLink({ event: { linkIndex } })}
                    >
                        <Link>
                            {showCopyMsg
                                ? 'Copied to clipboard'
                                : link.split('https://')[1]}
                        </Link>
                        <IconContainer id={'iconContainer'}>
                            <Icon
                                heightAndWidth="14px"
                                path={icons.copy}
                                onClick={
                                    () =>
                                        copyLink({
                                            event: { linkIndex },
                                        })
                                    // this.processEvent('copyLink', { linkIndex })
                                }
                            />
                            <Icon
                                heightAndWidth="14px"
                                path={icons.goTo}
                                onClick={
                                    () => window.open(link)
                                    // this.processEvent('copyLink', { linkIndex })
                                }
                            />
                        </IconContainer>
                    </LinkBox>
                </CopyLinkBox>
                <PermissionArea>
                    <ButtonTooltip
                        position={'bottomSingleLine'}
                        tooltipText={
                            sharedListRoleIDToString(roleID) ===
                            'Contributor' ? (
                                <span>Add highlights, pages & replies</span>
                            ) : (
                                <span>View & reply to highlights & pages</span>
                            )
                        }
                    >
                        <PermissionText
                            title={null}
                            viewportBreakpoint={viewportBreakpoint}
                        >
                            {sharedListRoleIDToString(roleID) + ' Access'}
                        </PermissionText>
                    </ButtonTooltip>
                </PermissionArea>
            </LinkAndRoleBox>
        </Margin>
    )
}

export default class SpaceContextMenuButton extends PureComponent<
    Props,
    State
> {
    private buttonRef: React.RefObject<HTMLInputElement>

    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()

        if (this.props.fixedPositioning) {
            this.setState({ xPosition: 15, yPosition: 20 })
        } else {
            const rect = this.buttonRef?.current?.getBoundingClientRect()
            this.setState({ xPosition: rect.x - 35, yPosition: rect.y - 6 })
        }
        this.props.onMoreActionClick(this.props.listId)
    }

    constructor(props) {
        super(props)
        this.buttonRef = React.createRef()
        this.state = { xPosition: 0, yPosition: 0 }
    }

    render() {
        if (this.props.onMoreActionClick) {
            return (
                <>
                    <MoreIconBackground
                        onClick={this.handleMoreActionClick}
                        ref={this.buttonRef}
                    >
                        <Icon heightAndWidth="14px" path={icons.dots} />
                    </MoreIconBackground>

                    {this.props.isMenuDisplayed && (
                        <ClickAway onClickAway={this.handleMoreActionClick}>
                            <SpaceContextMenu {...this.props} {...this.state} />
                        </ClickAway>
                    )}
                </>
            )
        }
        return null
    }
}

export class SpaceContextMenu extends PureComponent<
    Props & State,
    {
        inviteLinks: InviteLink[]
        showSuccessMsg: boolean
        nameValue: string
        isLoading: boolean
        mode: 'confirm' | null
    }
> {
    constructor(props) {
        super(props)
        this.state = {
            mode: null,
            inviteLinks: [],
            isLoading: true,
            showSuccessMsg: false,
            nameValue: this.props.listData.name,
        }
    }

    private closeModal: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onMoreActionClick(this.props.listId)
    }

    async componentDidMount() {
        if (this.props.listData.remoteId == null) {
            this.setState({ isLoading: false })
            return
        }

        const listIDs = await this.props.contentSharingBG.getExistingKeyLinksForList(
            {
                listReference: {
                    id: this.props.listData.remoteId,
                    type: 'shared-list-reference',
                },
            },
        )

        if (listIDs.links.length > 0) {
            this.setState({
                isLoading: false,
                inviteLinks: listIDs.links,
            })
        }

        if (!listIDs.links.length) {
            this.setState({ isLoading: false })
        }
    }

    private addLinks = async () => {
        this.setState({ isLoading: true })

        if (!this.props.listData.remoteId && this.props.shareList) {
            await this.props.shareList()
        }

        const [commenterLink, contributorLink] = await Promise.all([
            this.props.contentSharingBG.generateKeyLink({
                key: { roleID: SharedListRoleID.Commenter },
                listReference: {
                    id: this.props.listData.remoteId,
                    type: 'shared-list-reference',
                },
            }),
            this.props.contentSharingBG.generateKeyLink({
                key: { roleID: SharedListRoleID.ReadWrite },
                listReference: {
                    id: this.props.listData.remoteId,
                    type: 'shared-list-reference',
                },
            }),
        ])

        this.setState({
            inviteLinks: [
                {
                    link: commenterLink.link,
                    roleID: SharedListRoleID.Commenter,
                },
                {
                    link: contributorLink.link,
                    roleID: SharedListRoleID.ReadWrite,
                },
            ],
            showSuccessMsg: true,
            isLoading: false,
        })

        await copyToClipboard(contributorLink.link)

        setTimeout(
            () => this.setState({ showSuccessMsg: false }),
            ListShareModalLogic.SUCCESS_MSG_TIMEOUT,
        )
    }

    private copyLink = async ({ event }) => {
        const inviteLink = this.state.inviteLinks[event.linkIndex]

        if (inviteLink == null) {
            throw new Error('Link to copy does not exist - cannot copy')
        }

        await copyToClipboard(inviteLink.link)

        const showInviteLinkCopyMsg = (showCopyMsg: boolean) =>
            this.setState({
                inviteLinks: [
                    ...this.state.inviteLinks.slice(0, event.linkIndex),
                    { ...inviteLink, showCopyMsg },
                    ...this.state.inviteLinks.slice(event.linkIndex + 1),
                ],
            })

        showInviteLinkCopyMsg(true)

        setTimeout(
            () => showInviteLinkCopyMsg(false),
            ListShareModalLogic.COPY_MSG_TIMEOUT,
        )
    }

    private handleDeleteClick: React.MouseEventHandler = (e) => {
        this.setState({ mode: 'confirm' })
        this.props.onDeleteClick?.(e)
    }

    render() {
        if (!this.props.isMenuDisplayed) {
            return false
        }

        if (
            this.state.mode === 'confirm' &&
            this.props.onDeleteConfirm != null
        ) {
            return (
                <Modal show closeModal={this.closeModal} {...this.props}>
                    <MenuContainer>
                        <TitleBox>Delete this Space?</TitleBox>
                        <DetailsText>
                            This does not delete the pages in it
                        </DetailsText>
                        <PrimaryAction
                            onClick={this.props.onDeleteConfirm}
                            label={<ButtonLabel>Delete</ButtonLabel>}
                        />
                        <SecondaryAction
                            onClick={() => this.setState({ mode: null })}
                            label={<ButtonLabel>Cancel</ButtonLabel>}
                        />
                    </MenuContainer>
                </Modal>
            )
        }

        return (
            <Modal show closeModal={this.closeModal} {...this.props}>
                <MenuContainer>
                    {this.state.isLoading ? (
                        <LoadingContainer>
                            <LoadingIndicator size={30} />
                        </LoadingContainer>
                    ) : (
                        <>
                            {!this.state.inviteLinks.length ? (
                                <ShareSectionContainer
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                >
                                    <PrimaryAction
                                        label={
                                            <ButtonLabel>
                                                {' '}
                                                <Icon
                                                    color="white"
                                                    heightAndWidth="12px"
                                                    path={icons.link}
                                                    hoverOff
                                                />{' '}
                                                Share this Space
                                            </ButtonLabel>
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            this.addLinks()
                                        }}
                                    />
                                </ShareSectionContainer>
                            ) : (
                                <ShareSectionContainer
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                >
                                    {this.state.inviteLinks.map(
                                        (link, linkIndex) =>
                                            renderCopyableLink({
                                                ...link,
                                                linkIndex,
                                                copyLink: this.copyLink,
                                            }),
                                    )}
                                </ShareSectionContainer>
                            )}
                        </>
                    )}
                    <MenuButton onClick={this.handleDeleteClick}>
                        <Margin horizontal="10px">
                            <Icon heightAndWidth="14px" path={icons.trash} />
                        </Margin>
                        Delete
                    </MenuButton>
                    <EditArea>
                        <EditableMenuItem
                            // key={i}
                            changeListName={this.props.changeListName}
                            onRenameStart={this.props.onRenameClick}
                            nameValueState={{
                                value: this.state.nameValue,
                                setValue: (value) =>
                                    this.setState({
                                        nameValue: value,
                                    }),
                            }}
                            {...this.props.editableProps}
                        />
                    </EditArea>
                </MenuContainer>
            </Modal>
        )
    }
}

const PermissionArea = styled.div`
    z-index: auto;
`

const EditArea = styled.div`
    border-top: 1px solid #f0f0f0;
    color: ${(props) => props.theme.colors.normalText};
    width: fill-available;
    padding-bottom: 5px;
`

const IconContainer = styled.div`
    display: none;
    grid-gap: 5px;
    grid-auto-flow: column;

    & > div {
        background: white;
    }
`

const IconBackground = styled.div`
    border-radius: 3px;
    background: white;
    padding: 2px;
`

const MoreIconBackground = styled.div`
    border-radius: 3px;
    padding: 2px;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const LoadingContainer = styled.div`
    display: flex;
    height: 126px;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
`

const ShareSectionContainer = styled.div`
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
`

const ButtonLabel = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;

    & * {
        cursor: pointer;
    }
`

const ModalRoot = styled.div`
    z-index: 1000;
    width: 100%;
    border-radius: 12px;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    padding-top: 80px;
    width: 500px;
`

/* Modal content */

const ModalContent = styled.div<{ x: number; y: number }>`
    z-index: 999;
    position: absolute;
    top: ${(props) => props.y}px;
    left: ${(props) => props.x}px;
    text-align: center;
    border-radius: 4px;
    width: 300px;
`

const Overlay = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 995;
    border-radius: 5px;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 350px;
    position: absolute;
    background-color: ${colors.white};
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    z-index: 1;
`

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.hasActivity ||
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver ||
        props.dropReceivingState?.wasPageDropped
            ? 'flex'
            : 'None'};

    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    padding-left: 5px;
`

const TitleBox = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
    padding-left: 15px;
    align-items: center;
    padding-right: 10px;
`

const SidebarItem = styled.div<Props>`
 height: 30px;
 width: 100%;
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 align-items: center;
 background-color: transparent;
 &:hover {
    background-color: ${(props) => props.theme.colors.lightHover};
 }



 ${({ isMenuDisplayed, dropReceivingState }) =>
     css`
         background-color: ${isMenuDisplayed ||
         (dropReceivingState?.canReceiveDroppedItems &&
             dropReceivingState?.isDraggedOver)
             ? `${colors.onHover}`
             : `transparent`};
     `};



 &:hover ${IconBox} {

 display: ${(props) =>
     !(
         props.hasActivity ||
         props.newItemsCount ||
         props.dropReceivingState?.isDraggedOver
     )
         ? 'flex'
         : 'None'};
 }

 &:hover ${TitleBox} {
 width: 70%;
 }



 ${({ selectedState }: Props) =>
     selectedState?.isSelected &&
     css`
         background-color: ${colors.onSelect};
     `}



 ${({ dropReceivingState }: Props) =>
     dropReceivingState?.wasPageDropped &&
     css`
         animation: ${blinkingAnimation} 0.2s 2;
     `}



 cursor: ${({ dropReceivingState }: Props) =>
     !dropReceivingState?.isDraggedOver
         ? `pointer`
         : dropReceivingState?.canReceiveDroppedItems
         ? `pointer`
         : `not-allowed`};

`
const MenuSection = styled.div`
    width: 100%;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 12px;
    line-height: 18px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px 0 0;
    &: ${SidebarItem} {
        background-color: red;
    }
    & > div {
        width: auto;
    }
`
const MenuButton = styled.div`
    height: 34px;
    font-family: 'Inter', sans-serif;
    font-weight: ${fonts.primary.weight.normal};
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px;
    margin-top: 5px;
    margin-bottom: 5px;
    &: ${SidebarItem} {
        background-color: red;
    }
    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }
    & > div {
        width: auto;
    }
`

// probably want to use timing function to get this really looking good. This is just quick and dirty

const blinkingAnimation = keyframes`
 0% {
    background-color: ${(props) => props.theme.colors.lightHover};
 }
 50% {
 background-color: transparent;
 }
 100% {
    background-color: ${(props) => props.theme.colors.lightHover};
 }

`

const LinkAndRoleBox = styled.div<{
    viewportBreakpoint: string
}>`
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
        `}

    &:hover {
        #iconContainer {
            display: grid;
        }
    }
`

const LinkBox = styled(Margin)`
    width: fill-available;
    display: flex;
    background-color: ${(props) => props.theme.colors.lineGrey};
    font-size: 14px;
    border-radius: 3px;
    text-align: left;
    height: 30px;
    cursor: pointer;
    padding-right: 10px;
    color: ${(props) => props.theme.colors.lighterText};
`

const Link = styled.span`
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 5px 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow-x: scroll;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const CopyLinkBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

const DetailsText = styled.span`
    opacity: 0.8;
    font-size: 12px;
`

const PermissionText = styled.span<{
    viewportBreakpoint: string
}>`
    color: ${(props) => props.theme.colors.normalText};
    opacity: 0.8;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    justify-content: flex-end;
    font-size: 12px;
    z-index: 0;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            padding-left: 0px;
        `}
`
