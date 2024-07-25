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
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

export interface Props extends Dependencies {
    disableWriteOps?: boolean
    onDeleteSpaceConfirm?: () => void
    getRootElement: () => HTMLElement
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

export default class SpaceEditMenuContainer extends StatefulUIElement<
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

    private handleNameChange: React.ChangeEventHandler<
        HTMLInputElement
    > = async (event) => {
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
        if (
            this.state.mode === 'confirm-space-delete' &&
            this.props.isCreator
        ) {
            return (
                <DeleteBox>
                    <TitleBox>Delete this Space?</TitleBox>
                    <DetailsText>
                        This does NOT delete the pages in it
                    </DetailsText>
                    <ButtonRow>
                        <PrimaryAction
                            onClick={wrapClick((reactEvent) =>
                                this.processEvent('onDeleteSpaceConfirm', {
                                    reactEvent,
                                }),
                            )}
                            label={'Delete'}
                            icon={'trash'}
                            type={'secondary'}
                            size={'medium'}
                        />
                        <PrimaryAction
                            onClick={wrapClick((reactEvent) =>
                                this.processEvent('cancelDeleteSpace', null),
                            )}
                            label={'Cancel'}
                            type={'tertiary'}
                            size={'medium'}
                        />
                    </ButtonRow>
                </DeleteBox>
            )
        }

        const isPageLink = this.props.listData.type === 'page-link'
        return (
            <ContextMenuContainer>
                {this.props.listData.type !== 'special-list' &&
                    this.props.isCreator && (
                        <>
                            <SectionTitle>
                                {isPageLink
                                    ? 'Edit Page Link Name'
                                    : 'Edit Space Name'}
                            </SectionTitle>
                            <EditArea>
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
                                        value={this.state.nameValue}
                                        onChange={this.handleNameChange}
                                        disabled={this.props.disableWriteOps}
                                        onKeyDown={
                                            this.handleNameEditInputKeyDown
                                        }
                                        onKeyUp={(event) => {
                                            event.stopPropagation()
                                        }}
                                        autoFocus
                                    />
                                </Container>
                                {this.props.errorMessage && (
                                    <ErrMsg>{this.props.errorMessage}</ErrMsg>
                                )}
                            </EditArea>
                        </>
                    )}
                <ButtonBox>
                    {this.props.isCreator && (
                        <PrimaryAction
                            onClick={wrapClick((reactEvent) =>
                                this.processEvent('intendToDeleteSpace', {
                                    reactEvent,
                                }),
                            )}
                            disabled={this.props.disableWriteOps}
                            icon={'trash'}
                            size={'medium'}
                            type={'tertiary'}
                            label={
                                this.props.listData.type === 'page-link'
                                    ? 'Delete Page Link'
                                    : 'Delete Space'
                            }
                        />
                    )}
                    <>
                        {this.state?.showSaveButton &&
                            this.state.nameValue.length > 0 && (
                                <TooltipBox
                                    tooltipText={
                                        <span>
                                            <KeyboardShortcuts
                                                keys={['MOD_KEY', 'Enter']}
                                                getRootElement={() =>
                                                    this.props.getRootElement()
                                                }
                                            />
                                        </span>
                                    }
                                    placement="bottom-end"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <Icon
                                        filePath="check"
                                        color="prime1"
                                        heightAndWidth="24px"
                                        onClick={() =>
                                            this.processEvent(
                                                'confirmSpaceNameEdit',
                                                null,
                                            )
                                        }
                                    />
                                </TooltipBox>
                            )}
                    </>
                </ButtonBox>
            </ContextMenuContainer>
        )
    }

    render() {
        return <MenuContainer>{this.renderMainContent()}</MenuContainer>
    }
}

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
`

const DeleteBox = styled.div`
    display: flex;
    grid-gap: 10px;
    justify-content: center;
    flex-direction: column;
    width: fill-available;
    padding: 15px;
`

const EditArea = styled.div`
    color: ${(props) => props.theme.colors.white};
    width: fill-available;
    margin-bottom: 3px;
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
