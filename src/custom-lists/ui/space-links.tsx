import React from 'react'
import styled, { css } from 'styled-components'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { sharedListRoleIDToString } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/util'
import { __wrapClick } from './utils'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { trackCopyInviteLink } from '@worldbrain/memex-common/lib/analytics/events'

export interface Props {
    isPageLink: boolean
    loadState: TaskState
    inviteLinks: InviteLink[]
    copyLink: (link: string) => void
    analyticsBG?: AnalyticsCoreInterface
}

interface State {
    showCopyMessageIdx: number | null
}

export default class SpaceLinks extends React.PureComponent<Props> {
    state: State = { showCopyMessageIdx: null }

    private showCopyMessage(idx: number) {
        this.setState({ showCopyMessageIdx: idx }, () =>
            setTimeout(() => this.setState({ showCopyMessageIdx: null }), 2000),
        )
    }

    private async trackClick(inviteType: 'reader' | 'contributer') {
        if (!this.props.analyticsBG) {
            return
        }

        try {
            await trackCopyInviteLink(this.props.analyticsBG, {
                inviteType,
                linkType: this.props.isPageLink ? 'page-link' : 'space-link',
                source: 'extension',
            })
        } catch (error) {
            console.error(`Error tracking space create event', ${error}`)
        }
    }

    render() {
        if (this.props.loadState === 'running') {
            return (
                <ShareSectionContainer onClick={__wrapClick}>
                    <LoadingIndicator size={20} />
                </ShareSectionContainer>
            )
        }
        return (
            <ShareSectionContainer onClick={__wrapClick}>
                {this.props.inviteLinks.map(({ link, roleID }, linkIdx) => (
                    <ListItem zIndex={10 - linkIdx}>
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
                                        onClick={__wrapClick(async (e) => {
                                            this.showCopyMessage(linkIdx)
                                            this.props.copyLink(link)
                                            await this.trackClick('reader')
                                        })}
                                    >
                                        <Link>
                                            {this.state.showCopyMessageIdx ===
                                            linkIdx
                                                ? 'Copied to clipboard'
                                                : sharedListRoleIDToString(
                                                      roleID,
                                                  )}
                                        </Link>

                                        <IconContainer id={'iconContainer'}>
                                            <Icon
                                                heightAndWidth="20px"
                                                filePath={'copy'}
                                                onClick={__wrapClick(
                                                    async () => {
                                                        this.showCopyMessage(
                                                            linkIdx,
                                                        )
                                                        this.props.copyLink(
                                                            link,
                                                        )
                                                        await this.trackClick(
                                                            'reader',
                                                        )
                                                    },
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
                                                        this.props.isPageLink
                                                    ) {
                                                        webUIUrl =
                                                            webUIUrl +
                                                            '&noAutoOpen=true'
                                                    } else if (
                                                        this.props.isPageLink
                                                    ) {
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
                ))}
            </ShareSectionContainer>
        )
    }
}

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

const ListItem = styled.div<{ zIndex: number }>`
    display: flex;
    position: relative;
    z-index: ${(props) => props.zIndex};
    width: 100%;
`
