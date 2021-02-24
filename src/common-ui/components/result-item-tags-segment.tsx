import React, { HTMLProps } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    tags: string[]
    maxTags?: number
    showEditBtn: boolean
    onTagClick?: (tag: string) => void
    onEditBtnClick: React.MouseEventHandler
}

export default function TagsSegment({
    tags,
    maxTags = 8,
    onTagClick,
    showEditBtn,
    onEditBtnClick,
    ...props
}: Props) {
    if (tags.length === 0) {
        return null
    }

    return (
        <Container {...props}>
            <TagsContainer>
                {tags.slice(0, maxTags).map((tag) => (
                    <TagPill
                        key={tag}
                        onClick={onTagClick ? () => onTagClick(tag) : undefined}
                    >
                        {tag}
                    </TagPill>
                ))}
            </TagsContainer>
            {showEditBtn && <EditIcon onClick={onEditBtnClick} />}
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e0e0e0;
    padding: 5px 15px;
`

const TagsContainer = styled.div`
    display: flex;
`

const TagPill = styled.div`
    background-color: #83c9f4;

    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: auto;
    color: #284150;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
`

const EditIcon = styled.button`
    border: none;
    outline: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: #3a2f45;
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`
