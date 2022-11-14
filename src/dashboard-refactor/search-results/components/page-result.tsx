import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import {
    PageData,
    PageInteractionProps,
    PageResult,
    PagePickerProps,
} from '../types'
import TagPicker from 'src/tags/ui/TagPicker'
import { PageNotesCopyPaster } from 'src/copy-paster'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import Margin from 'src/dashboard-refactor/components/Margin'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import TagsSegment from 'src/common-ui/components/result-item-tags-segment'
import AllNotesShareMenu, {
    Props as ShareMenuProps,
} from 'src/overview/sharing/AllNotesShareMenu'
import { ButtonTooltip } from 'src/common-ui/components'
import ListsSegment, {
    AddSpacesButton,
} from 'src/common-ui/components/result-item-spaces-segment'
import type { ListDetailsGetter } from 'src/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import BlockContent from '@worldbrain/memex-common/lib/common-ui/components/block-content'

export interface Props
    extends PageData,
        PageResult,
        PageInteractionProps,
        PagePickerProps {
    getListDetailsById: ListDetailsGetter
    onTagClick?: (tag: string) => void
    isSearchFilteredByList: boolean
    filteredbyListID: number
    shareMenuProps: Omit<
        ShareMenuProps,
        'annotationsBG' | 'contentSharingBG' | 'customListsBG'
    >
}

export default class PageResultView extends PureComponent<Props> {
    private get fullUrl(): string {
        return this.props.type === 'pdf'
            ? this.props.fullPdfUrl!
            : this.props.fullUrl
    }

    private get domain(): string {
        let fullUrl: URL
        try {
            fullUrl = new URL(this.fullUrl)
        } catch (err) {
            return ''
        }

        if (fullUrl.protocol.startsWith('http')) {
            return decodeURIComponent(fullUrl.hostname.replace('www.', ''))
        } else if (fullUrl.protocol === 'file:') {
            return decodeURIComponent(fullUrl.pathname)
        }
        return ''
    }

    private get hasTags(): boolean {
        return this.props.tags.length > 0
    }

    private get hasNotes(): boolean {
        return (
            this.props.hasNotes ||
            this.props.noteIds[this.props.notesType].length > 0
        )
    }

    private get hasLists(): boolean {
        const userLists = this.props.lists.filter(
            (listId) =>
                !Object.values(SPECIAL_LIST_IDS).includes(listId) &&
                listId !== this.props.filteredbyListID,
        )
        return userLists.length > 0
    }

    private get displayLists(): Array<{
        id: number
        name: string
        isShared: boolean
    }> {
        return this.props.lists.map((id) => ({
            id,
            ...this.props.getListDetailsById(id),
        }))
    }

    private renderSpacePicker() {
        // space picker is separated out to make the Add to Space button contain the call to render the picker
        if (this.props.isListPickerShown) {
            return (
                <div onMouseLeave={this.props.onListPickerBtnClick}>
                    <HoverBox padding={'10px 0 0 0'} withRelativeContainer>
                        <CollectionPicker
                            selectEntry={(listId) =>
                                this.props.onListPickerUpdate({
                                    added: listId,
                                    deleted: null,
                                    selected: [],
                                })
                            }
                            unselectEntry={(listId) =>
                                this.props.onListPickerUpdate({
                                    added: null,
                                    deleted: listId,
                                    selected: [],
                                })
                            }
                            createNewEntry={this.props.createNewList}
                            initialSelectedListIds={() => this.props.lists}
                            onClickOutside={this.props.onListPickerBtnClick}
                        />
                    </HoverBox>
                </div>
            )
        }
    }
    private renderPopouts() {
        if (this.props.isTagPickerShown) {
            return (
                <HoverBox top="-40px" left="0" withRelativeContainer>
                    <TagPicker
                        onUpdateEntrySelection={this.props.onTagPickerUpdate}
                        initialSelectedEntries={() => this.props.tags}
                        onClickOutside={this.props.onTagPickerBtnClick}
                    />
                </HoverBox>
            )
        }

        if (this.props.isCopyPasterShown) {
            return (
                <HoverBox padding={'0px'} right="0" withRelativeContainer>
                    <PageNotesCopyPaster
                        normalizedPageUrls={[this.props.normalizedUrl]}
                        onClickOutside={this.props.onCopyPasterBtnClick}
                    />
                </HoverBox>
            )
        }

        if (this.props.isShareMenuShown) {
            return (
                <HoverBox
                    padding={'0px'}
                    width="330px"
                    right="0"
                    withRelativeContainer
                >
                    <AllNotesShareMenu {...this.props.shareMenuProps} />
                </HoverBox>
            )
        }

        return null
    }

    private renderRemoveFromListBtn() {
        if (
            !this.props.isSearchFilteredByList ||
            this.props.hoverState == null
        ) {
            return false
        }

        return (
            <RemoveFromListBtn onClick={this.props.onRemoveFromListBtnClick}>
                <ButtonTooltip
                    tooltipText={
                        this.props.filteredbyListID === SPECIAL_LIST_IDS.INBOX
                            ? 'Remove from Inbox'
                            : 'Remove from Space'
                    }
                    position="left"
                >
                    <Icon heightAndWidth="12px" path={icons.close} />
                </ButtonTooltip>
            </RemoveFromListBtn>
        )
    }

    private calcFooterActions(): ItemBoxBottomAction[] {
        if (this.props.hoverState === null) {
            return [
                {
                    key: 'expand-notes-btn',
                    image: this.hasNotes
                        ? icons.commentFull
                        : icons.commentEmpty,
                    ButtonText:
                        this.props.noteIds[this.props.notesType].length > 0 &&
                        this.props.noteIds[
                            this.props.notesType
                        ].length.toString(),
                    imageColor: 'purple',
                },
            ]
        }

        if (this.props.hoverState === 'footer') {
            return [
                {
                    key: 'delete-page-btn',
                    image: icons.trash,
                    onClick: this.props.onTrashBtnClick,
                    tooltipText: 'Delete Page & all related content',
                },
                {
                    key: 'copy-paste-page-btn',
                    image: icons.copy,
                    onClick: this.props.onCopyPasterBtnClick,
                    tooltipText: 'Copy Page',
                },
                // {
                //     key: 'share-page-btn',
                //     image: this.props.isShared ? icons.shared : icons.link,
                //     onClick: this.props.onShareBtnClick,
                //     tooltipText: 'Share Page and Notes',
                // },
                {
                    key: 'add-spaces-btn',
                    image: icons.plus,
                    imageColor: 'purple',
                    ButtonText: 'Spaces',
                    iconSize: '14px',
                    onClick: this.props.onListPickerBtnClick,
                },
                {
                    key: 'expand-notes-btn',
                    image: this.hasNotes
                        ? icons.commentFull
                        : icons.commentEmpty,
                    ButtonText:
                        this.props.noteIds[this.props.notesType].length > 0 &&
                        this.props.noteIds[
                            this.props.notesType
                        ].length.toString(),
                    imageColor: 'purple',
                    onClick: this.props.onNotesBtnClick,
                    tooltipText: (
                        <span>
                            <strong>Add/View Notes</strong>
                            <br />
                            shift+click to open inline
                        </span>
                    ),
                },
            ]
        }

        return [
            {
                key: 'delete-page-btn',
                isDisabled: true,
                image: icons.trash,
            },
            {
                key: 'copy-paste-page-btn',
                isDisabled: true,
                image: icons.copy,
            },
            {
                key: 'add-spaces-btn',
                image: icons.plus,
                imageColor: 'purple',
                iconSize: '14px',
                ButtonText: 'Spaces',
            },
            // {
            //     key: 'share-page-btn',
            //     isDisabled: true,
            //     image: this.props.isShared ? icons.shared : icons.link,
            // },
            // {
            //     key: 'list-page-btn',
            //     isDisabled: true,
            //     image: this.hasLists
            //         ? icons.collectionsFull
            //         : icons.collectionsEmpty,
            // },
            {
                key: 'expand-notes-btn',
                image: this.hasNotes ? icons.commentFull : icons.commentEmpty,
                ButtonText:
                    this.props.noteIds[this.props.notesType].length > 0 &&
                    this.props.noteIds[this.props.notesType].length.toString(),
                imageColor: 'purple',
            },
        ]
    }

    render() {
        const hasTitle = this.props.fullTitle && this.props.fullTitle.length > 0

        return (
            <ItemBox
                firstDivProps={{
                    onMouseLeave: this.props.onUnhover,
                    onDragStart: this.props.onPageDrag,
                    onDragEnd: this.props.onPageDrop,
                }}
            >
                <StyledPageResult>
                    {this.renderRemoveFromListBtn()}
                    <PageContentBox
                        onMouseOver={this.props.onMainContentHover}
                        onMouseLeave={
                            this.props.isListPickerShown
                                ? this.props.onListPickerBtnClick
                                : undefined
                        }
                        href={this.fullUrl}
                        target="_blank"
                        tabIndex={-1}
                        hasSpaces={this.hasLists}
                    >
                        <BlockContent
                            type={this.props.type}
                            normalizedUrl={this.props.normalizedUrl}
                            originalUrl={this.props.fullUrl}
                            fullTitle={this.props.fullTitle}
                            pdfUrl={this.props.fullPdfUrl}
                            favIcon={this.props.favIconURI}
                        />
                    </PageContentBox>
                    {this.hasLists && (
                        <ListsSegment
                            lists={this.displayLists}
                            onMouseEnter={this.props.onListsHover}
                            showEditBtn={this.props.hoverState === 'lists'}
                            onListClick={undefined}
                            onEditBtnClick={this.props.onListPickerBtnClick}
                            renderSpacePicker={this.renderSpacePicker.bind(
                                this,
                            )}
                            filteredbyListID={this.props.filteredbyListID}
                            padding={'0px 20px 10px 20px'}
                        />
                    )}
                    <ItemBoxBottom
                        firstDivProps={{
                            onMouseEnter: this.props.onFooterHover,
                        }}
                        creationInfo={{ createdWhen: this.props.displayTime }}
                        actions={this.calcFooterActions()}
                    />
                </StyledPageResult>
                <PopoutContainer>{this.renderPopouts()}</PopoutContainer>
            </ItemBox>
        )
    }
}

const DomainContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 3px;
`

const PDFIcon = styled.div`
    border: 1px solid rgb(184, 184, 184);
    border-radius: 5px;
    padding: 0 8px;
    font-weight: 500;
    color: black;
    margin-right: 10px;
`

const PopoutContainer = styled.div``

const StyledPageResult = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 12px;

    &:hover {
        outline: 2px solid ${(props) => props.theme.colors.lineGrey};
    }
`

const RemoveFromListBtn = styled.div`
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    outline: none;
    border: none;
    display: flex;
    height: 20px;
    width: 20px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`

const FavIconPlaceholder = styled.div`
    border-radius: 2px;
`

const FavIconBox = styled.div`
    width: 20px;
    height: 20px;
    margin-right: 5px;
`
const FavIconImg = styled.img`
    width: 100%;
    height: 100%;
    border-radius: 2px;
`

const PageContentBox = styled.a<{ hasSpaces: boolean }>`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-decoration: none;
    border-radius: 10px;
`

const AddSpaceButtonContainer = styled.div`
    margin-left: 1rem;
`

const ResultContent = styled(Margin)`
    display: grid;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
    grid-auto-flow: column;
    grid-gap: 15px;
    height: 34px;
`

const PageTitle = styled(Margin)`
    font-size: 16px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.normalText};
    justify-content: flex-start;
    line-break: ${(props) => (props.isUrl ? 'anywhere' : 'unset')};
`
const PageUrl = styled.span`
    font-size: 14px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.darkerText};
    display: flex;
    height: 20px;
    align-items: center;
`

const EditIconContainerWithText = styled.div`
    height: 20px;
    width: fit-content;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding: 0 3px 0 1px;
    grid-gap: 3px;
    font-size: 12px;
    opacity: 0.8;
    color: ${(props) => props.theme.colors.normalText};

    & * {
        cursor: pointer;
    }
`
