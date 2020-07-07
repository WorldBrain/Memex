import * as React from 'react'
import styled from 'styled-components'

import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'

export interface Props {
    env: 'inpage' | 'overview'
    mode: AnnotationMode
    body?: string
    comment?: string
    tags: string[]
    isEdited: boolean
    timestamp: string
    hasBookmark: boolean
    onTagClick?: (tag: string) => void
    getTruncatedTextObject: (
        text: string,
    ) => {
        isTextTooLong: boolean
        text: string
    }
}

/* tslint:disable-next-line variable-name */
class AnnotationView extends React.Component<Props> {
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
            <TagsContainerStyled {...this.props}>
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
        const { comment, tags } = this.props
        if (!comment && !tags) {
            return !tags?.length ? null : this.renderTags()
        }

        return (
            <CommentBox {...this.props}>
                <TextTruncated text={comment} {...this.props} />
                {this.renderTags()}
            </CommentBox>
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
    padding-top: 13px;
    display: flex;
    flex-wrap: wrap;

    ${(props: Props) =>
        !props.comment &&
        `
        margin-top: -8px;
        margin-left: 15px;
        padding-bottom: 15px;
    `}
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

    ${(props: Props) =>
        !props.body &&
        `
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        padding: 15px 15px 15px;
    `}
`
