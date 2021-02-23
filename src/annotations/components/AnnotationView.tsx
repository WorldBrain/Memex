import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { SidebarAnnotationTheme } from '../types'
import { TagsSegment } from 'src/common-ui/components/result-item-segments'

export interface Props {
    tags: string[]
    comment?: string
    theme: SidebarAnnotationTheme
    onTagClick?: (tag: string) => void
    onEditIconClick: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onTagsHover?: React.MouseEventHandler
}

class AnnotationView extends React.Component<Props> {
    render() {
        const { comment, theme, onEditIconClick, tags } = this.props

        return (
            <ThemeProvider theme={theme}>
                {comment?.length > 0 && (
                    <CommentBox onMouseEnter={this.props.onNoteHover}>
                        <TextTruncated
                            isHighlight={false}
                            text={comment}
                            onCommentEditClick={onEditIconClick}
                        />
                    </CommentBox>
                )}
                <TagsSegment
                    tags={tags}
                    onTagClick={this.props.onTagClick}
                    onMouseEnter={this.props.onTagsHover}
                />
            </ThemeProvider>
        )
    }
}

export default AnnotationView

const CommentBox = styled.div`
    color: rgb(54, 54, 46);

    font-size: 14px;
    font-weight: 400;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 0 15px 10px 15px;
    line-height: 1.4;
    text-align: left;

    ${({ theme }: Props) =>
        !theme.hasHighlight &&
        `
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        padding: 15px 15px 15px;
    `}
`

const TagBox = styled.div``
