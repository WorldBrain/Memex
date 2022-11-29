import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { Icon } from 'src/dashboard-refactor/styled-components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { ButtonTooltip } from 'src/common-ui/components'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { StatefulUIElement } from 'src/util/ui-logic'
import EditableMenuItem, {
    Props as EditableMenuItemProps,
} from 'src/dashboard-refactor/lists-sidebar/components/editable-menu-item'
import { getListShareUrl } from 'src/content-sharing/utils'

export interface Props extends Dependencies {
    xPosition?: number
    yPosition?: number
    fixedPositioning?: boolean
    editableProps: Omit<EditableMenuItemProps, 'nameValue' | 'onNameChange'>
    onDeleteSpaceConfirm?: React.MouseEventHandler
    onDeleteSpaceIntent?: React.MouseEventHandler
    onClose: (saveChanges?: boolean) => void
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
    }

    private handleWebViewOpen: React.MouseEventHandler = (e) => {
        const { remoteListId } = this.props
        if (remoteListId != null) {
            window.open(getListShareUrl({ remoteListId }))
        }
    }

    private renderShareLinks() {
        if (!this.state.inviteLinks.length) {
            return (
                <ShareSectionContainer onClick={wrapClick}>
                    <PrimaryAction
                        icon={'link'}
                        label={'Share Space'}
                        onClick={wrapClick((e) =>
                            this.processEvent('shareSpace', null),
                        )}
                        fontSize="14px"
                        width="100%"
                    />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer onClick={wrapClick}>
                {this.state.inviteLinks.map(
                    ({ link, showCopyMsg, roleID }, linkIndex) => (
                        <Margin key={link}>
                            <LinkAndRoleBox viewportBreakpoint="normal">
                                <PermissionArea>
                                    <ButtonTooltip
                                        position={'right'}
                                        tooltipText={
                                            sharedListRoleIDToString(roleID) ===
                                            'Contributor' ? (
                                                <span>
                                                    Add highlights, pages &
                                                    replies
                                                </span>
                                            ) : (
                                                <span>
                                                    View & reply to highlights &
                                                    pages
                                                </span>
                                            )
                                        }
                                    >
                                        <PermissionText
                                            title={null}
                                            viewportBreakpoint="normal"
                                        >
                                            {sharedListRoleIDToString(roleID) +
                                                ' Access'}
                                        </PermissionText>
                                    </ButtonTooltip>
                                </PermissionArea>
                                <CopyLinkBox>
                                    <LinkBox
                                        left="small"
                                        onClick={wrapClick((e) =>
                                            this.processEvent(
                                                'copyInviteLink',
                                                { linkIndex },
                                            ),
                                        )}
                                    >
                                        <Link>
                                            {showCopyMsg
                                                ? 'Copied to clipboard'
                                                : link.split('https://')[1]}
                                        </Link>
                                        <IconContainer id={'iconContainer'}>
                                            <Icon
                                                heightAndWidth="16px"
                                                path={icons.copy}
                                                onClick={wrapClick(() =>
                                                    this.processEvent(
                                                        'copyInviteLink',
                                                        { linkIndex },
                                                    ),
                                                )}
                                            />
                                            <Icon
                                                heightAndWidth="16px"
                                                path={icons.goTo}
                                                onClick={wrapClick(() =>
                                                    window.open(link),
                                                )}
                                            />
                                        </IconContainer>
                                    </LinkBox>
                                </CopyLinkBox>
                            </LinkAndRoleBox>
                        </Margin>
                    ),
                )}
            </ShareSectionContainer>
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

        if (
            this.state.mode === 'confirm-space-delete' &&
            this.props.onDeleteSpaceConfirm != null
        ) {
            return (
                <DeleteBox>
                    <TitleBox>Delete this Space?</TitleBox>
                    <DetailsText>
                        This does not delete the pages in it
                    </DetailsText>
                    <PrimaryAction
                        onClick={wrapClick(this.props.onDeleteSpaceConfirm)}
                        label={<ButtonLabel>Delete</ButtonLabel>}
                    />
                    <SecondaryAction
                        onClick={wrapClick(() =>
                            this.processEvent('cancelDeleteSpace', null),
                        )}
                        label={<ButtonLabel>Cancel</ButtonLabel>}
                    />
                </DeleteBox>
            )
        }

        if (
            this.state.loadState === 'running' ||
            this.state.inviteLinksLoadState === 'running'
        ) {
            return (
                <ContextMenuContainer>
                    <LoadingContainer>
                        <LoadingIndicator size={30} />
                    </LoadingContainer>
                </ContextMenuContainer>
            )
        }

        const deleteHandler =
            this.props.onDeleteSpaceIntent ??
            wrapClick(() => this.processEvent('deleteSpace', null))

        return (
            <ContextMenuContainer>
                {this.props.remoteListId && (
                    <SectionTitle>Sharing Links</SectionTitle>
                )}
                {this.renderShareLinks()}

                <SectionTitle>Edit Space</SectionTitle>
                <EditArea>
                    <EditableMenuItem
                        {...this.props.editableProps}
                        onNameChange={(name) =>
                            this.processEvent('updateSpaceName', { name })
                        }
                        nameValue={this.state.nameValue}
                    />
                </EditArea>
                <MenuButton onClick={deleteHandler}>
                    <Margin right="6px">
                        <Icon
                            hoverOff
                            heightAndWidth="18px"
                            path={icons.trash}
                        />
                    </Margin>
                    Delete
                </MenuButton>
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

const ContextMenuContainer = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    width: fill-available;
    padding: 15px;
    min-height: 200px;
    height: fit-content;
    justify-content: center;
    align-items: flex-start;
`

const SectionTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 600;
    width: 100%;
    display: flex;
    justify-content: flex-start;
`

const DeleteBox = styled.div`
    display: flex;
    grid-gap: 10px;
    justify-content: center;
    flex-direction: column;
    width: fill-available;
`

const PermissionArea = styled.div`
    z-index: auto;
`

const EditArea = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    width: fill-available;
`

const IconContainer = styled.div`
    display: none;
`

const LoadingContainer = styled.div`
    display: flex;
    height: fill-available;
    justify-content: center;
    align-items: center;
    width: fill-available;
`

const ShareSectionContainer = styled.div`
    margin-bottom: 10px;
    width: fill-available;
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

const ModalRoot = styled.div<{ fixedPosition: boolean }>`
    ${(props) =>
        props.fixedPosition
            ? ''
            : `
    border-radius: 12px;
`}
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
    ${(props) =>
        props.x || props.y
            ? ''
            : `
            display: flex;
            justify-content: center;
            `}
`

/* Modal content */

const ModalContent = styled.div<{
    fixedPosition: boolean
}>`
    text-align: center;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
`

const TitleBox = styled.div`
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    font-weight: bold;
    color: ${(props) => props.theme.colors.normalText};
    justify-content: center;
`

const MenuButton = styled.div`
    height: 36px;
    font-family: 'Satoshi', sans-serif;
    font-weight: ${fonts.primary.weight.normal};
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 5px;
    border-radius: 5px;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
    }

    & * {
        cursor: pointer;
    }
    & > div {
        width: auto;
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
    grid-gap: 5px;

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
            outline: 1px solid ${(props) => props.theme.colors.lineGrey};
        }

`

const LinkBox = styled(Margin)`
    width: fill-available;
    display: flex;
    font-size: 14px;
    border-radius: 3px;
    text-align: left;
    height: 30px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.normalText};
    border: 1px solid ${(props) => props.theme.colors.lineGrey};
    background: ${(props) => props.theme.colors.darkhover};
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
    font-size: 14px;
    font-family: 'Satoshi', sans-serif;
    font-weight: ${fonts.primary.weight.normal};
    color: ${(props) => props.theme.colors.normalText};
    margin-bottom: 5px;
    margin-top: -5px;
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
    margin-bottom: 2px;

    ${(props) =>
        (props.viewportBreakpoint === 'small' ||
            props.viewportBreakpoint === 'mobile') &&
        css`
            padding-left: 0px;
        `}
`
