import React from 'react'
import styled from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { StatefulUIElement } from 'src/util/ui-logic'
import { getListShareUrl } from 'src/content-sharing/utils'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu'
import SpaceEmailInvites from '../space-email-invites'
import { __wrapClick } from '../utils'
import SpaceLinks from '../space-links'

export interface Props extends Dependencies {
    getRootElement: () => HTMLElement
}

const SET_LIST_PRIVATE_ID = 'private-space-selection-state'

export default class SpaceContextMenuContainer extends StatefulUIElement<
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

    private get isFollowedSpace(): boolean {
        return this.props.listData.localId == null
    }

    private handleWebViewOpen: React.MouseEventHandler = (e) => {
        const { listData } = this.props
        if (listData.remoteId != null) {
            window.open(getListShareUrl({ remoteListId: listData.remoteId }))
        }
    }

    private renderMainContent() {
        if (this.isFollowedSpace) {
            return (
                <DeleteBox>
                    <PrimaryAction
                        onClick={__wrapClick(this.handleWebViewOpen)}
                        label="Go to Space"
                        fontSize={'14px'}
                    />
                </DeleteBox>
            )
        }

        return (
            <ContextMenuContainer>
                {this.state.isLocalPDF && (
                    <LocalPDFWarning>
                        The PDF file is not uploaded. Send it separately &
                        recipients must drop it into the web reader.
                    </LocalPDFWarning>
                )}
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
                <SpaceLinks
                    analyticsBG={this.props.analyticsBG}
                    inviteLinks={this.state.inviteLinks}
                    loadState={this.state.inviteLinksLoadState}
                    copyLink={(link) =>
                        this.processEvent('copyInviteLink', { link })
                    }
                    isPageLink={this.props.listData.type === 'page-link'}
                    getRootElement={this.props.getRootElement}
                />
                <SpaceEmailInvites
                    pageLinkLoadingState={this.state.inviteLinksLoadState}
                    {...this.props}
                />
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

const LocalPDFWarning = styled.div`
    background: ${(props) => props.theme.colors.warning}80;
    border: 1px solid ${(props) => props.theme.colors.warning};
    border-radius: 8px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 260px;
    color: ${(props) => props.theme.colors.greyScale7};
    margin-bottom: 10px;
    font-size: 14px;
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

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    width: 300px;
`
