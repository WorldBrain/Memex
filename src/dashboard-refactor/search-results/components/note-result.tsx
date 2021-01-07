import React, { PureComponent } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import * as icons from 'src/common-ui/components/design-library/icons'
import {
    NoteData,
    NoteResult,
    NoteInteractionProps,
    NotePickerProps,
} from '../types'
import TagPicker from 'src/tags/ui/TagPicker'
import { PageNotesCopyPaster } from 'src/copy-paster'
import {
    AnnotationSharingAccess,
    AnnotationSharingInfo,
} from 'src/content-sharing/ui/types'
import {
    getShareAnnotationBtnState,
    SHARE_BUTTON_ICONS,
    getShareAnnotationBtnAction,
    SHARE_BUTTON_LABELS,
} from 'src/annotations/sharing-utils'
import SingleNoteShareMenu from 'src/overview/sharing/SingleNoteShareMenu'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

export interface Props
    extends NoteData,
        NoteResult,
        NoteInteractionProps,
        NotePickerProps {
    sharingAccess: AnnotationSharingAccess
    sharingInfo?: AnnotationSharingInfo
    isShared?: boolean
    hasTags?: boolean
}

export default class NoteResultView extends PureComponent<Props> {
    private get sharingData() {
        const sharingProps = {
            ...this.props,
            onShare: this.props.onShareBtnClick,
            onUnshare: this.props.onShareBtnClick,
        }
        return {
            state: getShareAnnotationBtnState(sharingProps),
            action: getShareAnnotationBtnAction(sharingProps),
        }
    }

    private renderComment() {
        if (!this.props.comment) {
            return null
        }

        if (this.props.isEditing) {
            return (
                <NoteCommentContainer>
                    <NoteCommentEditInput
                        onChange={this.props.onCommentChange}
                        value={this.props.editNoteForm.inputValue}
                    />
                </NoteCommentContainer>
            )
        }

        return (
            <NoteCommentContainer>
                <NoteComment>{this.props.highlight}</NoteComment>
                <NoteCommentEditBtn onClick={this.props.onEditBtnClick}>
                    X
                </NoteCommentEditBtn>
            </NoteCommentContainer>
        )
    }

    private renderHighlight() {
        if (!this.props.highlight) {
            return null
        }

        return <NoteHighlight>{this.props.highlight}</NoteHighlight>
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

        if (this.props.isCopyPasterShown) {
            return (
                <HoverBox>
                    <PageNotesCopyPaster
                        annotationUrls={[this.props.url]}
                        normalizedPageUrls={[this.props.pageUrl]}
                    />
                </HoverBox>
            )
        }

        if (this.props.isShareMenuShown) {
            return (
                <HoverBox>
                    <SingleNoteShareMenu
                        annotationUrl={this.props.url}
                        closeShareMenu={this.props.hideShareMenu}
                        copyLink={this.props.copySharedLink}
                        postShareHook={() =>
                            this.props.updateShareInfo({
                                status: 'shared',
                                taskState: 'success',
                            })
                        }
                        postUnshareHook={() =>
                            this.props.updateShareInfo({
                                status: 'unshared',
                                taskState: 'success',
                            })
                        }
                    />
                </HoverBox>
            )
        }

        return null
    }

    render() {
        return (
            <ItemBox>
                <StyledNoteResult>
                    <NoteContentBox>
                        {this.renderHighlight()}
                        {this.renderComment()}
                    </NoteContentBox>

                    <ItemBoxBottom
                        creationInfo={{
                            createdWhen: this.props.isEdited
                                ? undefined
                                : this.props.displayTime,
                            lastEdited: this.props.isEdited
                                ? this.props.displayTime
                                : undefined,
                        }}
                        actions={[
                            {
                                key: 'copy-paste-note-btn',
                                image: icons.copy,
                                onClick: this.props.onCopyPasterBtnClick,
                                tooltipText: 'Copy Note',
                            },
                            {
                                key: 'delete-note-btn',
                                image: icons.trash,
                                onClick: this.props.onTrashBtnClick,
                                tooltipText: 'Delete Note',
                            },
                            {
                                key: 'share-note-btn',
                                image:
                                    SHARE_BUTTON_ICONS[this.sharingData.state],
                                onClick: this.sharingData.action,
                                tooltipText:
                                    SHARE_BUTTON_LABELS[this.sharingData.state],
                                isDisabled: ['sharing', 'unsharing'].includes(
                                    this.sharingData.state,
                                ),
                            },
                            {
                                key: 'tag-note-btn',
                                image: this.props.hasTags
                                    ? icons.tagFull
                                    : icons.tagEmpty,
                                onClick: this.props.onTagPickerBtnClick,
                                tooltipText: 'Tag Note',
                            },
                            {
                                key: 'reply-to-note-btn',
                                image: icons.commentAdd,
                                onClick: this.props.onReplyBtnClick,
                                tooltipText: 'Reply To Note',
                            },
                            {
                                key: 'bookmark-note-btn',
                                image: this.props.isBookmarked
                                    ? icons.heartFull
                                    : icons.heartEmpty,
                                onClick: this.props.onBookmarkBtnClick,
                                tooltipText: 'Favorite Note',
                            },
                        ]}
                    />
                </StyledNoteResult>
                <PopoutContainer>{this.renderPopouts()}</PopoutContainer>
            </ItemBox>
        )
    }
}

const PopoutContainer = styled.div``

const StyledNoteResult = styled.div`
    display: flex;
`

const NoteContentBox = styled.div``

const NoteHighlight = styled.span``
const NoteCommentContainer = styled.div``
const NoteCommentEditBtn = styled.button``
const NoteCommentEditActionBtn = styled.button``
const NoteComment = styled.span``
const NoteCommentEditInput = styled.textarea``
