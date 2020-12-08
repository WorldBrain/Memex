import React, { PureComponent } from 'react'
import styled from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import * as icons from 'src/common-ui/components/design-library/icons'
import { PageData, InteractionProps } from '../types'

export interface Props
    extends PageData,
        Omit<InteractionProps, 'onReplyBtnClick'> {
    isShared?: boolean
    hasNotes?: boolean
    hasLists?: boolean
    hasTags?: boolean
}

export default class PageResult extends PureComponent<Props> {
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
