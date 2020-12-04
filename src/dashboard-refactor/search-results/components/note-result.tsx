import React, { PureComponent } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import * as icons from 'src/common-ui/components/design-library/icons'
import { NoteData, InteractionProps } from '../types'

export interface Props
    extends NoteData,
        Omit<InteractionProps, 'onNotesBtnClick'> {
    isShared?: boolean
    hasTags?: boolean
}

export default class NoteResult extends PureComponent<Props> {
    render() {
        return (
            <ItemBox>
                <StyledPageResult>
                    <PageContentBox>
                        <PageTitle>{this.props.highlight}</PageTitle>
                        {/* <PageUrl>{this.props.fullUrl}</PageUrl> */}
                    </PageContentBox>

                    <ItemBoxBottom
                        creationInfo={{ createdWhen: this.props.displayTime }}
                        actions={[
                            {
                                key: 'copy-paste-note-btn',
                                image: icons.copy,
                                onClick: this.props.onCopyPasterBtnClick,
                            },
                            {
                                key: 'delete-note-btn',
                                image: icons.trash,
                                onClick: this.props.onTrashBtnClick,
                            },
                            {
                                key: 'share-note-btn',
                                image: this.props.isShared
                                    ? icons.shared
                                    : icons.shareEmpty,
                                onClick: this.props.onShareBtnClick,
                            },
                            {
                                key: 'tag-note-btn',
                                image: this.props.hasTags
                                    ? icons.tagFull
                                    : icons.tagEmpty,
                                onClick: this.props.onTagPickerBtnClick,
                            },
                            {
                                key: 'reply-to-note-btn',
                                image: icons.commentAdd,
                                onClick: this.props.onReplyBtnClick,
                            },
                            {
                                key: 'bookmark-note-btn',
                                image: icons.heartFull,
                                // TODO: add bookmark to NoteData
                                // image: this.props.isBookmarked
                                //     ? icons.heartFull
                                //     : icons.heartEmpty,
                                onClick: this.props.onBookmarkBtnClick,
                            },
                        ]}
                    />
                </StyledPageResult>
            </ItemBox>
        )
    }
}

const StyledPageResult = styled.div`
    display: flex;
`

const PageContentBox = styled.div``

const PageTitle = styled.h1``
const PageUrl = styled.span``
