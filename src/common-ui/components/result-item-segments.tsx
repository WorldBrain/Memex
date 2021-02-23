import React, { HTMLProps } from 'react'
import styled from 'styled-components'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    tags: string[]
    showEditBtn?: boolean
    onTagClick?: (tag: string) => void
}

export function TagsSegment({
    tags,
    onTagClick,
    showEditBtn,
    ...props
}: Props) {
    if (tags.length === 0) {
        return null
    }

    return (
        <TagsContainer {...props}>
            {tags.map((tag) => (
                <TagPill key={tag} onClick={() => onTagClick?.(tag)}>
                    {tag}
                </TagPill>
            ))}
        </TagsContainer>
    )
}

const TagsContainer = styled.div`
    height: auto;
    display: flex;
    flex-wrap: wrap;
    margin-left: 15px;
    padding-bottom: 10px;
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
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
`
