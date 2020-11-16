import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { SidebarAnnotationTheme } from '../types'

export interface Props {
    tags: string[]
    comment?: string
    theme: SidebarAnnotationTheme
    onTagClick?: (tag: string) => void
    confirmEdit?: () => void
    cancelEdit?: () => void
    onEditIconClick: () => void
}

/* tslint:disable-next-line variable-name */
class AnnotationView extends React.Component<Props> {
    private secretInputRef = React.createRef<HTMLInputElement>()

    private bindHandleTagPillClick: (tag: string) => React.MouseEventHandler = (
        tag,
    ) => (event) => {
        event.preventDefault()
        event.stopPropagation()

        if (this.props.onTagClick) {
            return this.props.onTagClick(tag)
        }
    }

    private renderTags() {
        return (
            <TagsContainerStyled comment={this.props.comment}>
                {this.props.tags.map((tag) => (
                    <TagPillStyled
                        key={tag}
                        onClick={this.bindHandleTagPillClick(tag)}
                    >
                        {tag}
                    </TagPillStyled>
                ))}
            </TagsContainerStyled>
        )
    }

    render() {
        const { comment, tags, theme, onEditIconClick } = this.props

        return (
            <ThemeProvider theme={theme}>
                {comment?.length > 0 && (
                    <CommentBox>
                        <TextTruncated
                            isHighlight={false}
                            text={comment}
                            onCommentEditClick={onEditIconClick}
                        />
                    </CommentBox>
                )}
                {tags?.length > 0 && <TagBox>{this.renderTags()}</TagBox>}
            </ThemeProvider>
        )
    }
}

export default AnnotationView

const TagPillStyled = styled.div`
    background-color: #83c9f4;

    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: auto;
    color: #284150;
    margin: 2px 4px 2px 0;
    display: flex;
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
`

const TagsContainerStyled = styled.div`
    height: auto;
    display: flex;
    flex-wrap: wrap;
    margin-left: 15px;
    padding-bottom: 10px;
`

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
