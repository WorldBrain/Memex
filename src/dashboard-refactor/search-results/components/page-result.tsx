import React, { PureComponent } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

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

export interface Props
    extends PageData,
        PageResult,
        PageInteractionProps,
        PagePickerProps {
    isShared?: boolean
    hasNotes?: boolean
    hasLists?: boolean
    hasTags?: boolean
}

export default class PageResultView extends PureComponent<Props> {
    private renderPopouts() {
        if (this.props.isTagPickerShown) {
            return (
                <TagPicker
                    onUpdateEntrySelection={this.props.onTagPickerUpdate}
                    initialSelectedEntries={() => this.props.tags}
                />
            )
        }

        if (this.props.isListPickerShown) {
            return (
                <CollectionPicker
                    onUpdateEntrySelection={this.props.onListPickerUpdate}
                    initialSelectedEntries={() => this.props.lists}
                />
            )
        }

        if (this.props.isCopyPasterShown) {
            return (
                <PageNotesCopyPaster
                    normalizedPageUrls={[this.props.normalizedUrl]}
                />
            )
        }

        return null
    }

    private renderModals() {
        if (this.props.isDeleteModalShown) {
            return <p>TODO: DELETE MODAL!!!!</p>
        }

        return null
    }

    render() {
        return (
            <ItemBox>
                <StyledPageResult>
                    <PageContentBox>
                        <PageTitle>{this.props.fullTitle}</PageTitle>
                        <PageUrl>{this.props.fullUrl}</PageUrl>
                    </PageContentBox>

                    <ItemBoxBottom
                        creationInfo={{ createdWhen: this.props.displayTime }}
                        actions={[
                            {
                                key: 'copy-paste-page-btn',
                                image: icons.copy,
                                onClick: this.props.onCopyPasterBtnClick,
                            },
                            {
                                key: 'delete-page-btn',
                                image: icons.trash,
                                onClick: this.props.onTrashBtnClick,
                            },
                            {
                                key: 'share-page-btn',
                                image: this.props.isShared
                                    ? icons.shared
                                    : icons.shareEmpty,
                                onClick: this.props.onShareBtnClick,
                            },
                            {
                                key: 'tag-page-btn',
                                image: this.props.hasTags
                                    ? icons.tagFull
                                    : icons.tagEmpty,
                                onClick: this.props.onTagPickerBtnClick,
                            },
                            {
                                key: 'list-page-btn',
                                image: icons.hamburger,
                                onClick: this.props.onListPickerBtnClick,
                            },
                            {
                                key: 'expand-notes-btn',
                                image: this.props.hasNotes
                                    ? icons.commentEditFull
                                    : icons.commentEdit,
                                onClick: this.props.onNotesBtnClick,
                            },
                            {
                                key: 'bookmark-page-btn',
                                image: this.props.isBookmarked
                                    ? icons.heartFull
                                    : icons.heartEmpty,
                                onClick: this.props.onBookmarkBtnClick,
                            },
                        ]}
                    />
                </StyledPageResult>
                <PopoutContainer>{this.renderPopouts()}</PopoutContainer>
                <ModalContainer>{this.renderModals()}</ModalContainer>
            </ItemBox>
        )
    }
}

const PopoutContainer = styled.div``
const ModalContainer = styled.div``

const StyledPageResult = styled.div`
    display: flex;
`

const PageContentBox = styled.div``

const PageTitle = styled.h1``
const PageUrl = styled.span``
