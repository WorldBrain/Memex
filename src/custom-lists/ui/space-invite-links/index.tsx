import React from 'react'
import styled, { css } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import Logic, { Dependencies, State, Event } from './logic'
import Margin from 'src/dashboard-refactor/components/Margin'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { isValidEmail } from '@worldbrain/memex-common/lib/utils/email-validation'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import { __wrapClick } from '../utils'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
}

export default class SpaceInviteLinks extends StatefulUIElement<
    Props,
    State,
    Event
> {
    constructor(props: Props) {
        super(props, new Logic(props))
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

    private handleInviteInputChange: React.KeyboardEventHandler = async (
        event,
    ) => {
        const value = (event.target as HTMLInputElement).value
        await this.processEvent('updateEmailInviteInputValue', { value })
    }

    private handleAddInviteInputKeyDown: React.KeyboardEventHandler = async (
        e,
    ) => {
        if (e.key === 'Enter') {
            if (this.state.emailInviteInputValue.trim().length > 0) {
                e.preventDefault()
                e.stopPropagation()
                await this.processEvent('inviteViaEmail', {})
            }
        }

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()
    }

    private renderShareLinks(isPageLink: boolean) {
        if (!this.state.inviteLinks.length) {
            return (
                <ShareSectionContainer onClick={__wrapClick}>
                    <LoadingIndicator size={20} />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer onClick={__wrapClick}>
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
                                            onClick={__wrapClick((e) =>
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
                                                    onClick={__wrapClick(() =>
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
                                                    onClick={__wrapClick(() => {
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
                        onKeyDown={this.handleAddInviteInputKeyDown}
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
                                {normalizedStateToArray(this.state.emailInvites)
                                    .slice()
                                    .reverse()
                                    .map((invite) => (
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
                                            {this.state
                                                .emailInvitesHoverState ===
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
                                                        invite.sharedListKey ==
                                                        null
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

    render() {
        return (
            <>
                {this.renderShareLinks(
                    this.props.listData.type === 'page-link',
                )}
                {this.renderPrivateListEmailInvites()}
            </>
        )
    }
}

const EmailListContainer = styled.div`
    width: fill-available;
    display: block;
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

const IconContainer = styled.div`
    display: none;
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

const Container = styled.div`
    width: fill-available;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background-color: transparent;
    grid-gap: 2px;
`

const ListItem = styled.div<{ zIndex: number }>`
    display: flex;
    position: relative;
    z-index: ${(props) => props.zIndex};
    width: 100%;
`
