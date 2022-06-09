import React, { HTMLProps } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    showEditBtn: boolean
    onEditBtnClick: React.MouseEventHandler
    lists: Array<{ id: number; name: string; isShared: boolean }>
    onListClick?: (tag: number) => void
    renderSpacePicker?: () => JSX.Element
    filteredbyListID?: number
}

interface ButtonProps {
    hasNoLists: boolean
    onEditBtnClick?: React.MouseEventHandler
    renderSpacePicker?: () => JSX.Element
}

export class AddSpacesButton extends React.Component<
    ButtonProps,
    { showPicker: boolean }
> {
    constructor(props: ButtonProps) {
        super(props)
        this.state = {
            showPicker: false,
        }
    }

    render() {
        return (
            <SpacePickerButtonWrapper>
                <AddSpacesButtonContainer
                    onClick={(e) => {
                        // this.setState({ showPicker: !this.state.showPicker })
                        this.props.onEditBtnClick?.(e)
                    }}
                >
                    {this.props.hasNoLists ? (
                        <EditIconContainerWithText>
                            <Icon
                                filePath={icons.plus}
                                height={'10px'}
                                color={'purple'}
                                hoverOff
                            />
                            Add to Spaces
                        </EditIconContainerWithText>
                    ) : (
                        <EditIconContainer>
                            <Icon
                                filePath={icons.plus}
                                height={'10px'}
                                color={'purple'}
                                hoverOff
                            />
                        </EditIconContainer>
                    )}
                </AddSpacesButtonContainer>
                {this.props.renderSpacePicker && (
                    <SpacePickerWrapper
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        {this.props.renderSpacePicker()}
                    </SpacePickerWrapper>
                )}
            </SpacePickerButtonWrapper>
        )
    }
}

const SpacePickerButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    cursor: pointer;
`

const SpacePickerWrapper = styled.div`
    position: relative;

    width: 0rem;
`

export default function ListsSegment({
    lists,
    onListClick,
    showEditBtn,
    onEditBtnClick,
    renderSpacePicker,
    filteredbyListID,
    ...props
}: Props) {
    return (
        <Container onClick={onEditBtnClick} {...props}>
            <ListsContainer>
                <AddSpacesButton
                    hasNoLists={lists.length === 0}
                    // onEditBtnClick={onEditBtnClick}
                    renderSpacePicker={renderSpacePicker}
                />
                {lists
                    .filter(
                        (l) =>
                            !Object.values(SPECIAL_LIST_IDS).includes(l.id) &&
                            l.id !== filteredbyListID,
                    )
                    .slice(0)
                    .map((space) => {
                        return (
                            <ListSpaceContainer
                                key={space.id}
                                onClick={
                                    onListClick
                                        ? () => onListClick(space.id)
                                        : undefined
                                }
                            >
                                {' '}
                                {space.isShared && (
                                    <Icon
                                        heightAndWidth="12px"
                                        hoverOff
                                        icon="people"
                                        color="white"
                                    />
                                )}
                                {space.name}
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
                            </ListSpaceContainer>
                        )
                    })}
            </ListsContainer>
        </Container>
    )
}

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
    pointer-events: auto;
    z-index: 1000;
`

const ButtonBox = styled.div`
    padding: 0 8px;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
    color: ${(props) => props.theme.colors.subText};
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

    & * {
        cursor: pointer;
    }
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

const AddSpacesButtonContainer = styled.div`
    background-color: white;
    font-size: 12px;
    font-weight: 400;
    justify-content: center;
    margin-right: 10px;
    display: flex;
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
`
const ListsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`

const ListSpaceContainer = styled.div`
    background-color: ${(props) => props.theme.colors.purple};
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: 20px;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
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
