import React, { HTMLProps } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { ButtonTooltip } from '.'

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
        return (
            <Container {...props}>
                <WarningBox>
                    <ButtonTooltip
                        tooltipText={
                            <span>
                                Tags will soon be deprecated & merged into
                                Spaces
                                <br />
                                Click to learn more
                            </span>
                        }
                        position={'right'}
                    >
                        <Icon
                            filePath={icons.alertRound}
                            color={'warning'}
                            heightAndWidth="18px"
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/announcements/tags-collections-unification',
                                )
                            }
                        />
                    </ButtonTooltip>
                </WarningBox>
                <EditIconContainerWithText onClick={onEditBtnClick}>
                    <Icon
                        filePath={icons.plus}
                        heightAndWidth="10px"
                        color={'purple'}
                        hoverOff
                    />
                    Add Tags
                </EditIconContainerWithText>
            </Container>
        )
    }

    return (
        <Container {...props}>
            <EditIconContainer onClick={onEditBtnClick}>
                <Icon
                    filePath={icons.plus}
                    heightAndWidth="10px"
                    color={'purple'}
                    hoverOff
                />
            </EditIconContainer>
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
        </Container>
    )
}

const WarningBox = styled.div`
    z-index: 1;
`

const Container = styled.div`
    display: grid;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    padding: 5px 15px;
    min-height: 24px;
    height: fit-content;
    grid-auto-flow: column;
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
`

const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`

const TagPill = styled.div`
    background-color: ${(props) => props.theme.colors.backgroundHighlight};
    color: ${(props) => props.theme.colors.normalText};
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: auto;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
`

const EditIconContainer = styled.div`
    border: 1px dashed ${(props) => props.theme.colors.lineLightGrey};
    height: 20px;
    width: 20px;
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`

const EditIconContainerWithText = styled.div`
    border: 1px dashed ${(props) => props.theme.colors.lineLightGrey};
    height: 20px;
    width: fit-content;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding: 0 3px 0 1px;
    grid-gap: 5px;
    font-size: 12px;
    opacity: 0.8;
    color: ${(props) => props.theme.colors.purple};

    & * {
        cursor: pointer;
    }
`

const EditIcon = styled.div`
    outline: none;
    width: 10px;
    height: 10px;
    background-color: ${(props) => props.theme.colors.purple};
    mask-image: url(${icons.plus});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 14px;
    cursor: pointer;
    z-index: 10;
`
