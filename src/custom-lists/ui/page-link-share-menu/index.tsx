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
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { TaskState } from 'ui-logic-core/lib/types'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
    onSpaceShare: () => void
    showSpacesTab: () => void
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

export default class PageLinkShareMenuContainer extends StatefulUIElement<
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

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if (prevProps.listData !== this.props.listData) {
            this.processEvent('reloadInviteLinks', {
                listData: this.props.listData,
            })
        }
    }

    private handleWebViewOpen: React.MouseEventHandler = (e) => {
        const { listData } = this.props
        if (listData.remoteId != null) {
            window.open(
                getSinglePageShareUrl({
                    remoteListId: listData.remoteId,
                    remoteListEntryId: listData.remoteId,
                }),
                '_blank',
            )
        }
    }

    private renderShareLinks(isPageLink: boolean) {
        if (!this.state.inviteLinks.length) {
            return (
                <ShareSectionContainer onClick={wrapClick}>
                    <PrimaryAction
                        icon={'link'}
                        label={'Share Space'}
                        onClick={wrapClick((e) =>
                            this.processEvent('shareSpace', null),
                        )}
                        size={'medium'}
                        type={'secondary'}
                        fullWidth
                    />
                </ShareSectionContainer>
            )
        }

        return (
            <ShareSectionContainer onClick={wrapClick}>
                {this.state.inviteLinks.map(
                    ({ link, showCopyMsg, roleID }, linkIndex) => (
                        <ListItem zIndex={10 - linkIndex}>
                            {}
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
                                            <Icon
                                                hoverOff
                                                icon="link"
                                                heightAndWidth="18px"
                                            />
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

    private renderMainContent() {
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

        const isPageLink = this.props.listData.type === 'page-link'

        return (
            <ContextMenuContainer>
                {this.props.pageLinkCreateState === 'running' && (
                    <LoadingStatusContainer>
                        <LoadingIndicator size={24} />
                        <LoadingStatusTextBox>
                            <LoadingStatusTitle>
                                Uploading shared data
                            </LoadingStatusTitle>
                            <LoadingStatusSubtitle>
                                Link not online yet but you can copy it
                            </LoadingStatusSubtitle>
                        </LoadingStatusTextBox>
                    </LoadingStatusContainer>
                )}
                {this.props.pageLinkCreateState === 'success' && (
                    <LoadingStatusContainer padding={'10px 10px'}>
                        <Icon
                            icon={'check'}
                            heightAndWidth={'24px'}
                            hoverOff
                            color="prime1"
                        />
                        <LoadingSuccessBox>
                            <LoadingStatusTitle>
                                Page available online
                            </LoadingStatusTitle>
                            <PrimaryAction
                                label={'Open'}
                                icon={'globe'}
                                onClick={() =>
                                    window.open(
                                        this.state.inviteLinks[0].link,
                                        '_blank',
                                    )
                                }
                                size="small"
                                type="secondary"
                            />
                        </LoadingSuccessBox>
                    </LoadingStatusContainer>
                )}
                <BottomSection>
                    {this.props.listData.remoteId != null && (
                        <SectionTopbar>
                            <SectionTitle>
                                Invite Links (Most Recent)
                            </SectionTitle>
                            <TooltipBox
                                tooltipText={
                                    <span>
                                        Create a new set of invite links for
                                        this page. <br />
                                        Go to "Spaces" to view all.
                                    </span>
                                }
                                placement="bottom-end"
                            >
                                <PrimaryAction
                                    label={'New'}
                                    onClick={(e) => {
                                        this.props.onSpaceShare()
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    size="small"
                                    type="forth"
                                    icon={'plus'}
                                    iconColor="prime1"
                                    padding={'0px 6px 0 0'}
                                />
                            </TooltipBox>
                        </SectionTopbar>
                    )}
                    {this.renderShareLinks(isPageLink)}
                    <PrimaryAction
                        label={'View All'}
                        size="medium"
                        width="100%"
                        type="forth"
                        icon={'longArrowRight'}
                        onClick={() => {
                            this.props.showSpacesTab()
                        }}
                    />
                </BottomSection>
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

const LoadingStatusContainer = styled.div<{ padding: string }>`
    display: flex;
    align-items: center;
    grid-gap: 15px;
    padding: 15px 20px;
    width: fill-available;
    width: -moz-available;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};

    ${(props) =>
        props.padding &&
        css`
            padding: ${props.padding};
        `};
`

const LoadingStatusTextBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
`
const LoadingSuccessBox = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 5px;
    width: fill-available;
    width: -moz-available;
    justify-content: space-between;
    align-items: center;
`

const LoadingStatusTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 400;
    font-size: 14px;
`

const LoadingStatusSubtitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 300;
    font-size: 14px;
`

const BottomSection = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    padding: 10px;
    width: fill-available;
    width: -moz-available;
`

const SectionTopbar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    z-index: 11;
`

const ButtonBox = styled.div`
    width: fill-available;
    width: -moz-available;
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
    min-height: 180px;
    min-width: 330px;
    height: fit-content;
    width: fit-content;
    justify-content: center;
    align-items: flex-start;
    /* width: 250px; */
`

const SectionTitle = styled.div`
    font-size: 14px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale7};
    font-weight: 500;
    width: 100%;
    display: flex;
    padding-left: 5px;
    justify-content: flex-start;
    letter-spacing: 0.6px;
`

const DeleteBox = styled.div`
    display: flex;
    grid-gap: 10px;
    justify-content: center;
    flex-direction: column;
    width: fill-available;
    padding: 15px;
`

const IconContainer = styled.div`
    display: none;
`

const LoadingContainer = styled.div`
    display: flex;
    height: 170px;
    justify-content: center;
    align-items: center;
    width: fill-available;
    width: -moz-available;
    justify-self: center;
    min-width: 250px;
`

const ShareSectionContainer = styled.div`
    margin-bottom: 10px;
    width: fill-available;
    width: -moz-available;
`

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    width: 330px;
    min-height: 180px;
`

const LinkAndRoleBox = styled.div<{
    viewportBreakpoint: string
    zIndex: number
}>`
    width: fill-available;
    width: -moz-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 5px;
    grid-gap: 5px;
    // z-index: ${(props) => props['zIndex']};
    height: 34px;
    margin: 0 -10px 5px -10px;
    padding: 0px 5px;

    & * {
        cursor: pointer;
    }


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
    width: -moz-available;
    display: flex;
    font-size: 14px;
    border-radius: 3px;
    text-align: left;
    height: 40px;
    cursor: pointer;
    color: ${(props) => props.theme.colors.greyScale5};
    justify-content: space-between;
    padding: 0 5px;

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
    align-items: center;
    width: fill-available;
    width: -moz-available;
    padding: 0 5px;
`

const ListItem = styled.div<{ zIndex }>`
    display: flex;
    position: relative;
    z-index: ${(props) => props.zIndex};
    width: 100%;
`
