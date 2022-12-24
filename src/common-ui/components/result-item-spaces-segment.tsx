import React, { HTMLProps } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { padding } from 'polished'
export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    onEditBtnClick: React.MouseEventHandler
    lists: Array<{ id: number; name: string; isShared: boolean }>
    onListClick?: (tag: number) => void
    renderSpacePicker?: () => JSX.Element
    filteredbyListID?: number
    tabIndex?: number
    padding?: string
    newLineOrientation?: boolean
    spacePickerButtonRef?: React.RefObject<HTMLElement>
}

interface ButtonProps {
    hasNoLists: boolean
    onEditBtnClick?: React.MouseEventHandler
    renderSpacePicker?: () => JSX.Element
    tabIndex?: number
    newLineOrientation?: boolean
    spacePickerButtonRef?: React.RefObject<HTMLElement>
}

export class AddSpacesButton extends React.Component<
    ButtonProps,
    { showPicker: boolean }
> {
    constructor(props: ButtonProps) {
        super(props)
    }

    render() {
        return (
            <SpacePickerButtonWrapper>
                <AddSpacesButtonContainer
                    ref={this.props.spacePickerButtonRef}
                    tabIndex={this.props.tabIndex}
                    onClick={(e) => {
                        this.props.onEditBtnClick?.(e)
                    }}
                >
                    <EditIconContainer>
                        <Icon
                            filePath={icons.plus}
                            height={'16px'}
                            color={'purple'}
                            hoverOff
                        />
                    </EditIconContainer>
                    {(this.props.hasNoLists ||
                        this.props.newLineOrientation === true) && <>Spaces</>}
                </AddSpacesButtonContainer>
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
    onEditBtnClick,
    renderSpacePicker,
    filteredbyListID,
    tabIndex,
    newLineOrientation,
    spacePickerButtonRef,
    ...props
}: Props) {
    return (
        <Container padding={padding} {...props}>
            <ListsContainer newLineOrientation={newLineOrientation === true}>
                <AddSpacesButton
                    hasNoLists={lists.length === 0}
                    onEditBtnClick={onEditBtnClick}
                    renderSpacePicker={renderSpacePicker}
                    tabIndex={tabIndex}
                    newLineOrientation={newLineOrientation}
                    spacePickerButtonRef={spacePickerButtonRef}
                />
                <SpacesListContainer>
                    {lists
                        .filter(
                            (l) =>
                                !Object.values(SPECIAL_LIST_IDS).includes(
                                    l.id,
                                ) && l.id !== filteredbyListID,
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
                                            heightAndWidth="16px"
                                            hoverOff
                                            icon="peopleFine"
                                            color="greyScale8"
                                        />
                                    )}
                                    {space.name}
                                </ListSpaceContainer>
                            )
                        })}
                </SpacesListContainer>
            </ListsContainer>
        </Container>
    )
}

const SpacesListContainer = styled.div`
    width: fill-available;
    display: flex;
    flex-wrap: wrap;
`

const Container = styled.div<{ padding: string }>`
    display: flex;
    grid-gap: 10px;
    align-items: flex-start;
    justify-content: flex-start;
    padding: ${(props) =>
        props.padding ? props.padding : '0px 10px 5px 10px'};
    min-height: 24px;
    height: fit-content;
    grid-auto-flow: column;
    //border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
    pointer-events: auto;
    z-index: 1000;
    width: fill-available;
`

const EditIconContainer = styled.div`
    border: 1px solid ${(props) => props.theme.colors.lineGrey};
    height: 24px;
    width: 24px;
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const AddSpacesButtonContainer = styled.div`
    font-size: 12px;
    font-weight: 400;
    justify-content: center;
    margin-right: 10px;
    display: flex;
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
    color: ${(props) => props.theme.colors.normalText};
    grid-gap: 5px;
`
const ListsContainer = styled.div<{ newLineOrientation }>`
    display: flex;
    align-items: flex-start;
    flex-direction: ${(props) => (props.newLineOrientation ? 'column' : 'row')};
    grid-gap: 5px;
`

const ListSpaceContainer = styled.div`
    background-color: ${(props) => props.theme.colors.lightHover};
    color: ${(props) => props.theme.colors.greyScale9};
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.6px;
    height: 20px;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: pointer;
    align-items: center;
    white-space: nowrap;
    font-family: 'Satoshi', sans-serif;
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
