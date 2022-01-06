import React, { HTMLProps } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    lists: string[]
    showEditBtn: boolean
    onListClick?: (tag: string) => void
    onEditBtnClick: React.MouseEventHandler
}

export function AddSpacesButton({
    hasNoLists,
    onEditBtnClick,
}: {
    hasNoLists: boolean
    onEditBtnClick: React.MouseEventHandler
}) {
    if (hasNoLists) {
        return (
            <AddSpacesButtonContainer onClick={onEditBtnClick}>
                <span>+</span> <span>Add to Space</span>
            </AddSpacesButtonContainer>
        )
    } else {
        return (
            <AddSpacesButtonContainer onClick={onEditBtnClick}>
                <span>+</span>
            </AddSpacesButtonContainer>
        )
    }
}

export default function ListsSegment({
    lists,
    onListClick,
    showEditBtn,
    onEditBtnClick,
    ...props
}: Props) {
    // if (!lists?.length) {
    //     return null
    // }

    return (
        <Container {...props}>
            <ListsContainer>
                <AddSpacesButton
                    hasNoLists={lists.length === 0}
                    onEditBtnClick={onEditBtnClick}
                />
                {lists.slice(0).map((tag) => (
                    <ListPillContainer
                        key={tag}
                        onClick={
                            onListClick ? () => onListClick(tag) : undefined
                        }
                    >
                        {tag}
                        {/* TODO: uncomment when collection context menu is done */}
                        {/* {showEditBtn && (
                            <ListPillSettingButton
                                onClick={() => {
                                    // open the space context modal
                                }}
                            >
                                {' ... '}
                            </ListPillSettingButton>
                        )} */}
                    </ListPillContainer>
                ))}
            </ListsContainer>
        </Container>
    )
}

const Container = styled.div`
    display: inline-box;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding: 5px 15px;
`

const AddSpacesButtonContainer = styled.button`
    background-color: white;

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
const ListsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`

const ListPillContainer = styled.div`
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
const ListPillSettingButton = styled.button`
    cursor: pointer;
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
