import React from 'react'
import styled from 'styled-components'
import Logic, { Dependencies, State, Event } from './logic'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { StatefulUIElement } from 'src/util/ui-logic'
import { getListShareUrl } from 'src/content-sharing/utils'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu'
import SpaceInviteLinks from '../space-invite-links'
import { __wrapClick } from '../utils'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
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
        const { listData } = this.props
        if (listData.remoteId != null) {
            window.open(getListShareUrl({ remoteListId: listData.remoteId }))
        }
    }

    private handleNameChange: React.KeyboardEventHandler = async (event) => {
        const name = (event.target as HTMLInputElement).value
        await this.processEvent('updateSpaceName', { name })
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

    private renderMainContent() {
        if (this.state.mode === 'followed-space') {
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
                <SpaceInviteLinks {...this.props} />
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
