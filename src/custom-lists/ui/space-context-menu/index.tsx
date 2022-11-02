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
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
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

    private containerElRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    getContainerRect(): DOMRect | null {
        return this.containerElRef?.current?.getBoundingClientRect() ?? null
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
                        label={
                            <ButtonLabel>
                                {' '}
                                <Icon
                                    color="backgroundColor"
                                    heightAndWidth="16px"
                                    path={icons.link}
                                    hoverOff
                                />{' '}
                                Share Space
                            </ButtonLabel>
                        }
                        onClick={wrapClick((e) =>
                            this.processEvent('shareSpace', null),
                        )}
                        fontSize="14px"
                    />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer onClick={wrapClick}>
                {this.state.inviteLinks.map(
                    ({ link, showCopyMsg, roleID }, linkIndex) => (
                        <Margin horizontal="5px" bottom="3px" key={link}>
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
                <LoadingContainer>
                    <LoadingIndicator size={30} />
                </LoadingContainer>
            )
        }

        const deleteHandler =
            this.props.onDeleteSpaceIntent ??
            wrapClick(() => this.processEvent('deleteSpace', null))

        return (
            <>
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
                {this.props.remoteListId && (
                    <SectionTitle>Sharing Links</SectionTitle>
                )}
                {this.renderShareLinks()}
            </>
        )
    }

    render() {
        return (
            <ModalRoot
                ref={this.containerElRef}
                fixedPosition={this.props.fixedPositioning}
            >
                {!this.props.fixedPositioning && (
                    <Overlay
                        onClick={wrapClick((e) => this.props.onClose(true))}
                    />
                )}
                <ModalContent
                    // onMouseLeave={closeModal}
                    x={this.props.xPosition}
                    y={this.props.yPosition}
                    fixedPosition={this.props.fixedPositioning}
                >
                    <MenuContainer>{this.renderMainContent()}</MenuContainer>
                </ModalContent>
            </ModalRoot>
        )
    }
}

const SectionTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 600;
    margin-top: 10px;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    padding-left: 15px;
`

const DeleteBox = styled.div`
    padding: 20px;
    display: flex;
    grid-gap: 10px;
    justify-content: center;
    flex-direction: column;
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
    height: 126px;
    justify-content: center;
    align-items: center;
`

const ShareSectionContainer = styled.div`
    padding: 10px;
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
    z-index: 1000;
    border-radius: 12px;
    height: 100%;
    width: 100%;
    position: relative;
    width: 100%;
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
    x: number
    y: number
    fixedPosition: boolean
}>`
    z-index: 999;
    position: fixed;
    text-align: center;
    border-radius: 4px;
    width: 300px;
    bottom: ${(props) => (props.x && props.y ? props.y + 'px' : 'unset')};
    right: ${(props) => (props.x && props.y ? props.x + 'px' : 'unset')};
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
`

const Overlay = styled.div`
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 995;
    border-radius: 5px;
    backdrop-filter: ${(props) =>
        props.x && props.y ? 'backdrop-filter: blur(3px)' : 'unset'};
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 350px;
    position: absolute;
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
    border: 1px solid ${(props) => props.theme.colors.lineGrey};
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
    height: 100%;
    padding-left: 15px;
    align-items: center;
    padding-right: 10px;
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
    margin: 5px 5px;
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
    padding-right: 10px;
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
