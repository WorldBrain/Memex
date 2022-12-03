import React, { PureComponent, createRef } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import type {
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
import AllNotesShareMenu, {
    Props as ShareMenuProps,
} from 'src/overview/sharing/AllNotesShareMenu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import type { ListDetailsGetter } from 'src/annotations/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import BlockContent from '@worldbrain/memex-common/lib/common-ui/components/block-content'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

export interface Props
    extends PageData,
        PageResult,
        PageInteractionProps,
        PagePickerProps {
    getListDetailsById: ListDetailsGetter
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

    spacePickerButtonRef = React.createRef<HTMLElement>()
    spacePickerBarRef = React.createRef<HTMLElement>()
    copyPasteronPageButtonRef = React.createRef<HTMLElement>()

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

    private spacePickerRef = createRef<HTMLElement>()
    private settingsButtonRef = createRef<HTMLElement>()
    private tutorialButtonRef = createRef<HTMLElement>()

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

    private get listPickerBtnClickHandler(): React.MouseEventHandler<any> {
        if (this.props.listPickerShowStatus === 'footer') {
            return this.props.onListPickerFooterBtnClick
        }
        return this.props.onListPickerBarBtnClick
    }

    private renderSpacePicker() {
        if (this.props.listPickerShowStatus === 'lists-bar') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerBarRef.current}
                    placement={'bottom-start'}
                    offsetX={10}
                    bigClosingScreen
                >
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
                        onClickOutside={this.listPickerBtnClickHandler}
                    />
                </PopoutBox>
            )
        }

        if (this.props.listPickerShowStatus === 'footer') {
            return (
                <PopoutBox
                    targetElementRef={this.spacePickerButtonRef.current}
                    placement={'bottom-end'}
                    offsetX={10}
                    bigClosingScreen
                >
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
                        onClickOutside={this.listPickerBtnClickHandler}
                    />
                </PopoutBox>
            )
        }
    }

    private renderCopyPaster() {
        if (this.props.isCopyPasterShown) {
            return (
                <PopoutBox
                    targetElementRef={this.copyPasteronPageButtonRef.current}
                    placement={'bottom'}
                    offsetX={10}
                    bigClosingScreen
                    strategy={'fixed'}
                >
                    <PageNotesCopyPaster
                        normalizedPageUrls={[this.props.normalizedUrl]}
                        onClickOutside={this.props.onCopyPasterBtnClick}
                    />
                </PopoutBox>
            )
        }
    }

    private renderPopouts() {
        if (this.props.isShareMenuShown) {
            return <AllNotesShareMenu {...this.props.shareMenuProps} />
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
                <TooltipBox
                    tooltipText={
                        this.props.filteredbyListID === SPECIAL_LIST_IDS.INBOX
                            ? 'Remove from Inbox'
                            : 'Remove from Space'
                    }
                    placement="left"
                >
                    <Icon heightAndWidth="12px" path={icons.close} />
                </TooltipBox>
            </RemoveFromListBtn>
        )
    }

    private calcFooterActions(): ItemBoxBottomAction[] {
        if (this.props.hoverState === null) {
            return [
                {
                    key: 'expand-notes-btn',
                    image: this.hasNotes ? 'commentFull' : 'commentEmpty',
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
                    image: 'trash',
                    onClick: this.props.onTrashBtnClick,
                    tooltipText: 'Delete Page & all related content',
                    componentToOpen: null,
                },
                {
                    key: 'copy-paste-page-btn',
                    image: 'copy',
                    onClick: this.props.onCopyPasterBtnClick,
                    buttonRef: this.copyPasteronPageButtonRef,
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
                    image: 'plus',
                    imageColor: 'purple',
                    ButtonText: 'Spaces',
                    iconSize: '14px',
                    onClick: this.props.onListPickerFooterBtnClick,
                    buttonRef: this.spacePickerButtonRef,
                },
                {
                    key: 'expand-notes-btn',
                    image: this.hasNotes ? 'commentFull' : 'commentEmpty',
                    ButtonText:
                        this.props.noteIds[this.props.notesType].length > 0 &&
                        this.props.noteIds[
                            this.props.notesType
                        ].length.toString(),
                    imageColor: 'purple',
                    onClick: this.props.onNotesBtnClick,
                    componentToOpen: null,
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
                image: 'trash',
            },
            {
                key: 'copy-paste-page-btn',
                isDisabled: true,
                image: 'copy',
                buttonRef: this.copyPasteronPageButtonRef,
            },
            {
                key: 'add-spaces-btn',
                image: 'plus',
                imageColor: 'purple',
                iconSize: '14px',
                ButtonText: 'Spaces',
                buttonRef: this.spacePickerButtonRef,
                // onClick: this.props.onListPickerFooterBtnClick,
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
                image: this.hasNotes ? 'commentFull' : 'commentEmpty',
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
                onMouseOver={this.props.onMainContentHover}
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
                        // onMouseLeave={
                        //     this.props.listPickerShowStatus !== 'hide'
                        //         ? this.listPickerBtnClickHandler
                        //         : undefined
                        // }
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
                            onEditBtnClick={this.props.onListPickerBarBtnClick}
                            renderSpacePicker={
                                this.props.listPickerShowStatus === 'lists-bar'
                                    ? this.renderSpacePicker
                                    : null
                            }
                            filteredbyListID={this.props.filteredbyListID}
                            padding={'0px 20px 10px 20px'}
                            spacePickerButtonRef={this.spacePickerBarRef}
                        />
                    )}
                    <ItemBoxBottom
                        firstDivProps={{
                            onMouseEnter: this.props.onFooterHover,
                            onMouseOver: this.props.onFooterHover,
                        }}
                        creationInfo={{ createdWhen: this.props.displayTime }}
                        actions={this.calcFooterActions()}
                    />
                    {this.renderSpacePicker()}
                    {this.renderCopyPaster()}
                </StyledPageResult>
            </ItemBox>
        )
    }
}

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

const PageContentBox = styled.a<{ hasSpaces: boolean }>`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-decoration: none;
    border-radius: 10px;
`
