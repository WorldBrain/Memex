import React from 'react'
import styled, { css } from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Margin from 'src/dashboard-refactor/components/Margin'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { StatefulUIElement } from 'src/util/ui-logic'
import { getListShareUrl } from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    SelectionMenuBtn,
    MenuItemProps,
} from 'src/common-ui/components/selection-menu-btn'
import { isValidEmail } from '@worldbrain/memex-common/lib/utils/email-validation'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
}

// NOTE: This exists to stop click events bubbling up into web page handlers AND to stop page result <a> links
//  from opening when you use the context menu in the dashboard.
//  __If you add new click handlers to this component, ensure you wrap them with this!__
const wrapClick = (
    handler: React.MouseEventHandler,
): React.MouseEventHandler => (e) => {
    e.preventDefault()
    e.stopPropagation()
    return handler(e)
}

export default class SpaceContextMenuContainer extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<Props, 'copyToClipboard'> = {
        copyToClipboard,
    }

    constructor(props: Props) {
        super(props, new Logic(props))
        // if (props.listData.remoteId == null) {
        //     this.processEvent('shareSpace', { privacyStatus: 'private' })
        // }
    }

    private get shouldShowInviteBtn(): boolean {
        const inputValue = this.state.emailInviteInputValue.trim()
        if (!inputValue.length) {
            return false
        }
        if (!isValidEmail(inputValue)) {
            return false
        }
        let alreadyInvited = false
        for (const invite of normalizedStateToArray(this.state.emailInvites)) {
            if (invite.email === inputValue) {
                alreadyInvited = true
                break
            }
        }
        return !alreadyInvited
    }

    private handleWebViewOpen: React.MouseEventHandler = (e) => {
        const { listData } = this.props
        if (listData.remoteId != null) {
            window.open(getListShareUrl({ remoteListId: listData.remoteId }))
        }
    }

    private handleNameChange: React.KeyboardEventHandler = async (event) => {
        const name = (event.target as HTMLInputElement).value
        await this.processEvent('updateSpaceName', { name })
    }

    private handleInviteInputChange: React.KeyboardEventHandler = async (
        event,
    ) => {
        const value = (event.target as HTMLInputElement).value
        await this.processEvent('updateEmailInviteInputValue', { value })
    }

    private handleNameEditInputKeyDown: React.KeyboardEventHandler = async (
        e,
    ) => {
        if (e.key === 'Escape') {
            // Allow escape keydown to bubble up to close the sidebar only if no input state
            if (this.state.nameValue.trim().length) {
                e.stopPropagation()
            }
            await this.processEvent('cancelSpaceNameEdit', null)
            return
        }

        if (e.key === 'Enter') {
            if (this.state.nameValue.trim().length > 0) {
                e.preventDefault()
                e.stopPropagation()
                await this.processEvent('confirmSpaceNameEdit', null)
            }
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    private renderLoadingSpinner = () => (
        <LoadingContainer>
            <LoadingIndicator size={30} />
        </LoadingContainer>
    )

    private renderShareLinks(isPageLink: boolean) {
        if (!this.state.inviteLinks.length) {
            return (
                <ShareSectionContainer onClick={wrapClick}>
                    <LoadingIndicator size={20} />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer onClick={wrapClick}>
                {this.state.inviteLinks.map(
                    ({ link, showCopyMsg, roleID }, linkIndex) => (
                        <ListItem zIndex={10 - linkIndex}>
                            <TooltipBox
                                placement={'bottom'}
                                tooltipText={
                                    roleID === SharedListRoleID.ReadWrite ? (
                                        <span>
                                            Permission to add highlights,
                                            <br /> pages & replies
                                        </span>
                                    ) : (
                                        <span>
                                            Permission to read & reply <br />
                                            to highlights & pages
                                        </span>
                                    )
                                }
                                fullWidthTarget
                            >
                                <LinkAndRoleBox
                                    key={roleID}
                                    viewportBreakpoint="normal"
                                >
                                    <CopyLinkBox>
                                        <LinkBox
                                            left="small"
                                            onClick={wrapClick((e) =>
                                                this.processEvent(
                                                    'copyInviteLink',
                                                    {
                                                        linkIndex,
                                                        linkType: isPageLink
                                                            ? 'page-link'
                                                            : 'space-link',
                                                    },
                                                ),
                                            )}
                                        >
                                            <Link>
                                                {showCopyMsg
                                                    ? 'Copied to clipboard'
                                                    : sharedListRoleIDToString(
                                                          roleID,
                                                      )}
                                            </Link>

                                            <IconContainer id={'iconContainer'}>
                                                <Icon
                                                    heightAndWidth="20px"
                                                    filePath={'copy'}
                                                    onClick={wrapClick(() =>
                                                        this.processEvent(
                                                            'copyInviteLink',
                                                            {
                                                                linkIndex,
                                                                linkType: isPageLink
                                                                    ? 'page-link'
                                                                    : 'space-link',
                                                            },
                                                        ),
                                                    )}
                                                />
                                                <Icon
                                                    heightAndWidth="20px"
                                                    filePath={'goTo'}
                                                    onClick={wrapClick(() => {
                                                        let webUIUrl = link

                                                        if (
                                                            webUIUrl.includes(
                                                                '?',
                                                            ) &&
                                                            isPageLink
                                                        ) {
                                                            webUIUrl =
                                                                webUIUrl +
                                                                '&noAutoOpen=true'
                                                        } else if (isPageLink) {
                                                            webUIUrl =
                                                                webUIUrl +
                                                                '?noAutoOpen=true'
                                                        }
                                                        window.open(
                                                            webUIUrl,
                                                            '_blank',
                                                        )
                                                    })}
                                                />
                                            </IconContainer>
                                        </LinkBox>
                                    </CopyLinkBox>
                                </LinkAndRoleBox>
                            </TooltipBox>
                        </ListItem>
                    ),
                )}
            </ShareSectionContainer>
        )
    }

    private renderPrivateListEmailInvites() {
        return (
            <>
                <SectionTitle>
                    Invite via Email{' '}
                    {this.state.emailInvitesLoadState === 'running' && (
                        <LoadingIndicator size={16} />
                    )}
                </SectionTitle>
                <Container
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <EditableTextField
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        value={this.state.emailInviteInputValue}
                        onChange={this.handleInviteInputChange}
                        disabled={this.props.disableWriteOps}
                        placeholder="Add email address"
                        icon="mail"
                        // onKeyDown={this.handleNameEditInputKeyDown}
                    />

                    {this.shouldShowInviteBtn && (
                        <>
                            <DropdownMenuBtn
                                elementHeight="40px"
                                backgroundColor={'greyScale1_5'}
                                menuItems={[
                                    {
                                        id: SharedListRoleID.Commenter,
                                        name: sharedListRoleIDToString(
                                            SharedListRoleID.Commenter,
                                        ),
                                    },
                                    {
                                        id: SharedListRoleID.ReadWrite,
                                        name: sharedListRoleIDToString(
                                            SharedListRoleID.ReadWrite,
                                        ),
                                    },
                                ]}
                                onMenuItemClick={(item) =>
                                    this.processEvent(
                                        'updateEmailInviteInputRole',
                                        {
                                            role: item.id as SharedListRoleID,
                                        },
                                    )
                                }
                                initSelectedIndex={
                                    this.state.emailInviteInputRole ===
                                    SharedListRoleID.Commenter
                                        ? 0
                                        : 1
                                }
                                keepSelectedState
                            />
                            <PrimaryAction
                                onClick={() =>
                                    this.processEvent('inviteViaEmail', {})
                                }
                                label="Invite"
                                type="secondary"
                                size="medium"
                                fullWidth
                            />
                        </>
                    )}

                    {(this.state.emailInvitesLoadState === 'success' ||
                        this.state.emailInvitesLoadState === 'pristine') &&
                        !this.shouldShowInviteBtn &&
                        normalizedStateToArray(this.state.emailInvites).length >
                            0 && (
                            <EmailListContainer>
                                {normalizedStateToArray(
                                    this.state.emailInvites,
                                ).map((invite) => (
                                    <InviteItemContainer
                                        onMouseEnter={() => {
                                            this.processEvent(
                                                'setEmailInvitesHoverState',
                                                { id: invite.id },
                                            )
                                        }}
                                        onMouseLeave={() => {
                                            this.processEvent(
                                                'setEmailInvitesHoverState',
                                                { id: null },
                                            )
                                        }}
                                        key={invite.id}
                                    >
                                        <InvitedBox>
                                            <InvitedEmail>
                                                {invite.email}
                                            </InvitedEmail>
                                        </InvitedBox>
                                        {this.state.emailInvitesHoverState ===
                                        invite.id ? (
                                            <PrimaryAction
                                                onClick={() =>
                                                    this.processEvent(
                                                        'deleteEmailInvite',
                                                        {
                                                            key: invite.sharedListKey.toString(),
                                                        },
                                                    )
                                                }
                                                /* sharedListKey will be missing between when the user creates an invite and when the server-side write actually completes. */
                                                disabled={
                                                    invite.sharedListKey == null
                                                }
                                                type="tertiary"
                                                label="Remove"
                                                icon={'removeX'}
                                                fontSize="12px"
                                                iconSize="16px"
                                                iconColor="greyScale5"
                                                padding="0px 5px 0px 0px"
                                            />
                                        ) : (
                                            <InvitedPermission>
                                                {sharedListRoleIDToString(
                                                    invite.roleID,
                                                )}
                                            </InvitedPermission>
                                        )}
                                    </InviteItemContainer>
                                ))}
                            </EmailListContainer>
                        )}
                </Container>
            </>
        )
    }

    private renderMainContent() {
        if (this.state.mode === 'followed-space') {
            return (
                <DeleteBox>
                    <PrimaryAction
                        onClick={wrapClick(this.handleWebViewOpen)}
                        label="Go to Space"
                        fontSize={'14px'}
                    />
                </DeleteBox>
            )
        }

        const isPageLink = this.props.listData.type === 'page-link'
        const SET_LIST_PRIVATE_ID = 'private-space-selection-state'

        return (
            <ContextMenuContainer>
                {this.props.isCreator && this.props.listData.remoteId != null && (
                    <DropdownMenuBtn
                        elementHeight="60px"
                        backgroundColor={'greyScale2'}
                        menuItems={[
                            {
                                id: SET_LIST_PRIVATE_ID,
                                name: 'Private',
                                info: 'Only visible to you and people invited',
                            },
                            {
                                id: 'public-space-selection-state',
                                name: 'Shared',
                                info: 'Viewable to anyone with the link',
                            },
                        ]}
                        onMenuItemClick={(item) =>
                            this.processEvent('updateSpacePrivacy', {
                                isPrivate: item.id === SET_LIST_PRIVATE_ID,
                            })
                        }
                        initSelectedIndex={
                            this.props.listData?.isPrivate == null
                                ? 0
                                : this.props.listData?.isPrivate
                                ? 0
                                : 1
                        }
                        keepSelectedState
                    />
                )}
                {this.props.listData.remoteId != null && (
                    <SectionTitle>Invite Links</SectionTitle>
                )}
                {this.renderShareLinks(isPageLink)}

                {this.renderPrivateListEmailInvites()}
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

const EmailListContainer = styled.div`
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-height: 150px;
    overflow-y: scroll;
`

const InviteItemContainer = styled.div`
    height: 40px;
    padding: 0 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-gap: 5px;
    width: fill-available;
    width: -moz-available;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};

    &:last-child {
        border-bottom: none;
    }
`

const InvitedBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    grid-gap: 3px;
`

const InvitedEmail = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
`

const InvitedPermission = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
`

const ButtonBox = styled.div`
    width: fill-available;
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-gap: 5px;
`
const ButtonRow = styled.div`
    width: fill-available;
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
`

const ContextMenuContainer = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    width: fill-available;
    padding: 10px 10px 10px 10px;
    min-height: fit-content;
    height: fit-content;
    justify-content: center;
    align-items: flex-start;
    /* width: 250px; */
`

const SectionTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    grid-gap: 10px;
    align-items: center;
`

const DeleteBox = styled.div`
    display: flex;
    grid-gap: 10px;
    justify-content: center;
    flex-direction: column;
    width: fill-available;
    padding: 15px;
`

const PermissionArea = styled.div`
    z-index: 31;
    position: relative;
`

const EditArea = styled.div`
    color: ${(props) => props.theme.colors.white};
    width: fill-available;
    margin-bottom: 3px;
`

const IconContainer = styled.div`
    display: none;
`

const LoadingContainer = styled.div`
    display: flex;
    height: 150px;
    justify-content: center;
    align-items: center;
    width: fill-available;
    justify-self: center;
    min-width: 250px;
`

const ShareSectionContainer = styled.div`
    margin-bottom: 10px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 90px;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    width: 300px;
`

const TitleBox = styled.div`
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    font-weight: bold;
    color: ${(props) => props.theme.colors.white};
    justify-content: center;
    font-size: 16px;
`

const LinkAndRoleBox = styled.div<{
    viewportBreakpoint: string
    zIndex: number
}>`
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;
    grid-gap: 5px;
    // z-index: ${(props) => props['zIndex']};
    height: 40px;
    margin: 0 -10px 5px -10px;
    padding: 0px 5px;


    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
        `}

    &:hover ${IconContainer} {
            height: fit-content;
            width: fit-content;
            display: flex;
            justify-content: center;
            align-items: center;
            grid-gap: 5px;
            grid-auto-flow: row;
            border-radius: 6px;
        }

`

const LinkBox = styled(Margin)`
    width: fill-available;
    display: flex;
    font-size: 14px;
    border-radius: 3px;
    text-align: left;
    height: 40px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.white};
    justify-content: space-between;
    padding-right: 10px;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
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
    justify-content: space-between;

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
    font-size: 14px;
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    color: ${(props) => props.theme.colors.greyScale5};
    margin-bottom: 5px;
    margin-top: -5px;
    text-align: center;
`

const PermissionText = styled.span<{
    viewportBreakpoint: string
}>`
    color: ${(props) => props.theme.colors.white};
    opacity: 0.8;
    display: flex;
    flex-direction: row;
    white-space: nowrap;
    justify-content: flex-end;
    font-size: 12px;
    z-index: 30;
    margin-bottom: 2px;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            padding-left: 0px;
        `}
`

const EditableTextField = styled(TextField)`
    padding: 2px 10px;
    border-radius: 5px;
    outline: none;
    flex: 2;
    display: flex;
    min-width: 50px;
    margin-right: 0px;
    font-size: 14px;
    height: 40px;
    outline: none;
    border: none;
    width: fill-available;
`

const ErrMsg = styled.div`
    color: red;
    width: 100%;
    text-align: center;
    margin-top: 5px;
    margin-bottom: 5px;
`

const Container = styled.div`
    width: fill-available;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background-color: transparent;
    grid-gap: 2px;
`

const ListItem = styled.div<{ zIndex }>`
    display: flex;
    position: relative;
    z-index: ${(props) => props.zIndex};
    width: 100%;
`
