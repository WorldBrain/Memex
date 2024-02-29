import React from 'react'
import styled, { css } from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Margin from 'src/dashboard-refactor/components/Margin'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { StatefulUIElement } from 'src/util/ui-logic'
import SpaceEmailInvites from '../space-email-invites'
import SpaceLinks from '../space-links'
import { helpIcon } from 'src/common-ui/components/design-library/icons'
import { TaskState } from 'ui-logic-core/lib/types'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'

export interface Props extends Dependencies {
    showSpacesTab?: (pageUrl) => void
    getRootElement: () => HTMLElement
}

export default class PageLinkShareMenuContainer extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<Props, 'copyToClipboard'> = {
        copyToClipboard: async (text) => {
            await copyToClipboard(text)
            return true
        },
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

    renderTutorialBox() {
        if (this.state.showTutorial === false) {
            return
        }
        console.log('shouldreteurn tutorial')
        return (
            <TutorialBox
                tutorialId={'sharePages'}
                getRootElement={this.props.getRootElement}
                onTutorialClose={() => this.processEvent('showTutorial', false)}
                isHeadless={true}
            />
        )
    }

    private renderMainContent() {
        if (this.state.loadState === 'running') {
            return (
                <ContextMenuContainer>
                    <LoadingContainer>
                        <LoadingIndicator size={30} />
                    </LoadingContainer>
                </ContextMenuContainer>
            )
        }

        if (!this.state.selectedPageLinkList) {
            return (
                <ContextMenuContainer>
                    <BigNewButtonBox>
                        <PrimaryAction
                            label={'New'}
                            onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                await this.processEvent('createPageLink', null)
                            }}
                            size="medium"
                            width="fill-available"
                            type="forth"
                            icon={'plus'}
                            iconColor="prime1"
                            padding={'0px 6px 0 0'}
                        />
                    </BigNewButtonBox>
                    <TitleSection>
                        <Title>Share links to annotated pages</Title>
                        <Subtitle>
                            Receivers can open them without an account or extra
                            software.
                        </Subtitle>
                    </TitleSection>
                    <TutorialButtonContainer>
                        <TutorialBox
                            tutorialId={'sharePages'}
                            getRootElement={this.props.getRootElement}
                            onTutorialClose={() =>
                                this.processEvent('showTutorial', false)
                            }
                        />
                    </TutorialButtonContainer>
                </ContextMenuContainer>
            )
        }

        return (
            <ContextMenuContainer>
                <BottomSection>
                    {this.state.selectedPageLinkList.remoteId != null && (
                        <SectionTopbar>
                            <SectionTitle>
                                Invite Links (Most Recent)
                                <TooltipBox
                                    tooltipText={
                                        <span>
                                            You can create multiple invite links
                                            for a page that each create a new
                                            sharing context.
                                        </span>
                                    }
                                    placement="bottom"
                                    width="140px"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <Icon
                                        icon={helpIcon}
                                        heightAndWidth={'16px'}
                                        hoverOff
                                        onClick={() => {
                                            this.processEvent(
                                                'showTutorial',
                                                true,
                                            )
                                        }}
                                    />
                                    {this.renderTutorialBox()}
                                </TooltipBox>
                            </SectionTitle>
                            <TooltipBox
                                tooltipText={
                                    <span>
                                        View previously generated invite link
                                        sets
                                    </span>
                                }
                                placement="bottom-end"
                                getPortalRoot={this.props.getRootElement}
                            >
                                <PrimaryAction
                                    label={'All'}
                                    size="small"
                                    type="forth"
                                    icon={'arrowRight'}
                                    onClick={() => {
                                        this.props.showSpacesTab(
                                            this.props.fullPageUrl,
                                        )
                                    }}
                                />
                            </TooltipBox>
                            <TooltipBox
                                tooltipText={
                                    <span>
                                        Create a new set of invite links for
                                        this page. <br />
                                        Go to "Spaces" to view all.
                                    </span>
                                }
                                placement="bottom-end"
                                getPortalRoot={this.props.getRootElement}
                            >
                                <PrimaryAction
                                    label={'New'}
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        await this.processEvent(
                                            'createPageLink',
                                            null,
                                        )
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
                    <BottomBox>
                        <SpaceLinks
                            isPageLink
                            analyticsBG={this.props.analyticsBG}
                            inviteLinks={this.state.inviteLinks}
                            loadState={this.state.inviteLinksLoadState}
                            copyLink={(link) =>
                                this.processEvent('copyInviteLink', { link })
                            }
                            getRootElement={this.props.getRootElement}
                        />
                        <SpaceEmailInvites
                            {...this.props}
                            listData={this.state.selectedPageLinkList}
                            pageLinkLoadingState={
                                this.state.pageLinkCreateState
                            }
                        />
                    </BottomBox>
                </BottomSection>
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

const BottomBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    width: fill-available;
    width: -moz-available;
    padding: 0px 15px 15px 15px;
`

const LocalPDFWarning = styled.div`
    background: ${(props) => props.theme.colors.warning}80;
    border: 1px solid ${(props) => props.theme.colors.warning};
    border-radius: 8px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 300px;
    color: ${(props) => props.theme.colors.greyScale7};
    margin-bottom: 10px;
    font-size: 14px;
`

const LoadingStatusContainer = styled.div<{ padding?: string }>`
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
    width: fill-available;
    width: -moz-available;
`

const SectionTopbar = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0px 15px 0px 15px;
    height: 30px;
    align-items: center;
    grid-gap: 5px;
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
    grid-gap: 0px;
    flex-direction: column;
    width: fill-available;
    color: ${(props) => props.theme.colors.greyScale5};
    grid-gap: 10px;
    min-height: 130px;
    -width: 340px;
    height: fill-available;
    width: fill-available;
    justify-content: center;
    align-items: center;
    position: relative;
    /* width: 250px; */
`

const SectionTitle = styled.div`
    font-size: 14px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale4};
    font-weight: 400;
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    font-family: 'Satoshi', sans-serif;
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
    min-height: 130px;
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

const TitleSection = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    width: fill-available;
    width: -moz-available;
    height: 90px;
    justify-content: center;
    align-items: center;
    padding: 5px 35px 15px 35px;
`
const Title = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale7};
    font-weight: 400;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
`
const Subtitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
`
const BigNewButtonBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: fill-available;
    width: -moz-available;
    padding: 0 15px;
`

const TutorialButtonContainer = styled.div`
    position: absolute;
    right: 5px;
    bottom: 5px;
`
