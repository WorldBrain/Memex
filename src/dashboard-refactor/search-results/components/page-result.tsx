import React, { PureComponent, HTMLProps } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

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
import { TagsSegment } from 'src/common-ui/components/result-item-segments'

export interface Props
    extends PageData,
        PageResult,
        PageInteractionProps,
        PagePickerProps {
    isSearchFilteredByList: boolean
    isShared?: boolean
}

export default class PageResultView extends PureComponent<Props> {
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
        return this.props.lists.length > 0
    }

    private renderPopouts() {
        if (this.props.isTagPickerShown) {
            return (
                <HoverBox>
                    <TagPicker
                        onUpdateEntrySelection={this.props.onTagPickerUpdate}
                        initialSelectedEntries={() => this.props.tags}
                    />
                </HoverBox>
            )
        }

        if (this.props.isListPickerShown) {
            return (
                <HoverBox>
                    <CollectionPicker
                        onUpdateEntrySelection={this.props.onListPickerUpdate}
                        initialSelectedEntries={() => this.props.lists}
                    />
                </HoverBox>
            )
        }

        if (this.props.isCopyPasterShown) {
            return (
                <HoverBox>
                    <PageNotesCopyPaster
                        normalizedPageUrls={[this.props.normalizedUrl]}
                    />
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
                X
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
                },
            ]
        }

        if (this.props.hoverState === 'footer') {
            return [
                {
                    key: 'copy-paste-page-btn',
                    image: icons.copy,
                    onClick: this.props.onCopyPasterBtnClick,
                    tooltipText: 'Copy Page',
                },
                {
                    key: 'delete-page-btn',
                    image: icons.trash,
                    onClick: this.props.onTrashBtnClick,
                    tooltipText: 'Delete Page & all related content',
                },
                // {
                //     key: 'share-page-btn',
                //     image: this.props.isShared
                //         ? icons.shared
                //         : icons.shareEmpty,
                //     onClick: this.props.onShareBtnClick,
                //     tooltipText: 'Share Page',
                // },
                {
                    key: 'tag-page-btn',
                    image: this.hasTags ? icons.tagFull : icons.tagEmpty,
                    onClick: this.props.onTagPickerBtnClick,
                    tooltipText: 'Tag Page',
                },
                {
                    key: 'list-page-btn',
                    image: this.hasLists
                        ? icons.collectionsFull
                        : icons.collectionsEmpty,
                    onClick: this.props.onListPickerBtnClick,
                    tooltipText: 'Edit Collections',
                },
                {
                    key: 'expand-notes-btn',
                    image: this.hasNotes
                        ? icons.commentFull
                        : icons.commentEmpty,
                    onClick: this.props.onNotesBtnClick,
                    tooltipText: 'Add/View Notes',
                },
            ]
        }

        return [
            {
                key: 'copy-paste-page-btn',
                image: icons.copyFaded,
            },
            {
                key: 'delete-page-btn',
                image: icons.trashFaded,
            },
            {
                key: 'tag-page-btn',
                image: this.hasTags ? icons.tagFullFaded : icons.tagEmptyFaded,
            },
            {
                key: 'list-page-btn',
                image: this.hasLists
                    ? icons.collectionsFullFaded
                    : icons.collectionsEmptyFaded,
            },
            {
                key: 'expand-notes-btn',
                image: this.hasNotes ? icons.commentFull : icons.commentEmpty,
            },
        ]
    }

    getDomain() {
        let domain = this.props.fullUrl.split('/')

        return domain[2]
    }

    render() {
        return (
            <ItemBox firstDivProps={{ onMouseLeave: this.props.onUnhover }}>
                <StyledPageResult>
                    {this.renderRemoveFromListBtn()}
                    <PageContentBox
                        onMouseEnter={this.props.onMainContentHover}
                        href={this.props.fullUrl}
                        target="_blank"
                    >
                        <ResultContent>
                            <FavIconBox>
                                {this.props.favIconURI ? (
                                    <FavIconImg src={this.props.favIconURI} />
                                ) : (
                                    <FavIconPlaceholder />
                                )}
                            </FavIconBox>
                            <PageUrl>{this.getDomain()}</PageUrl>
                        </ResultContent>
                        <PageTitle top="10px" bottom="5px">
                            {this.props.fullTitle}
                        </PageTitle>
                    </PageContentBox>
                    <TagsSegment
                        showEditBtn={this.props.hoverState === 'tags'}
                        tags={this.props.tags}
                        onMouseEnter={this.props.onTagsHover}
                    />
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

const PopoutContainer = styled.div``

const StyledPageResult = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
`

const RemoveFromListBtn = styled.button`
    position: absolute;
    top: 5px;
    right: 5px;
`

const FavIconBox = styled.div`
    margin-right: 10px;
`
const FavIconPlaceholder = styled.div`
    width: 20px;
    height: 20px;
    border: 1px solid #efefef;
    border-radius: 30px;
`
const FavIconImg = styled.img``

const PageContentBox = styled.a`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    padding: 15px 15px 5px 15px;
    text-decoration: none;

    &:hover {
        background-color: #fafafa;
    }
`

const ResultContent = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
`

const PageTitle = styled(Margin)`
    font-size: 14px;
    font-weight: bold;
    color: #3a2f45;
    justify-content: flex-start;
`
const PageUrl = styled.span`
    font-size: 12px;
    color: #545454;
`
