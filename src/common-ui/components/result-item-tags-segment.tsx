import React, { HTMLProps } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    tags: string[]
    showEditBtn: boolean
    onTagClick?: (tag: string) => void
    onEditBtnClick: React.MouseEventHandler
}

export default function TagsSegment({
    tags,
    onTagClick,
    showEditBtn,
    onEditBtnClick,
    ...props
}: Props) {
    if (!tags?.length) {
        return null
    }

    return (
        <Container {...props}>
            <TagsContainer>
                {tags.slice(0).map((tag) => (
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
    display: inline-box;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding: 5px 10px;
`

const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
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
    background-color: ${(props) => props.theme.colors.primary};
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
    right: 30px;
    position: relative;
    z-index: 10;
`
