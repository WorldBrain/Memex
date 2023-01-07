import React, { HTMLProps } from 'react'
import styled, { css, keyframes } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { padding } from 'polished'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    onEditBtnClick: React.MouseEventHandler
    lists: Array<{ id: number; name: string | JSX.Element; isShared: boolean }>
    onListClick?: (localListId: number) => void
    renderSpacePicker?: () => JSX.Element
    filteredbyListID?: number
    tabIndex?: number
    padding?: string
    newLineOrientation?: boolean
    spacePickerButtonRef?: React.RefObject<HTMLDivElement>
}

interface ButtonProps {
    hasNoLists: boolean
    onEditBtnClick?: React.MouseEventHandler
    renderSpacePicker?: () => JSX.Element
    tabIndex?: number
    newLineOrientation?: boolean
    spacePickerButtonRef?: React.RefObject<HTMLDivElement>
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
            <PrimaryAction
                innerRef={this.props.spacePickerButtonRef}
                type="tertiary"
                size="small"
                icon="plus"
                iconColor={'purple'}
                onClick={(e) => {
                    this.props.onEditBtnClick?.(e)
                }}
                height="28px"
                width={
                    this.props.hasNoLists ||
                    this.props.newLineOrientation === true
                        ? 'fit-content'
                        : '28px'
                }
                label={
                    (this.props.hasNoLists ||
                        this.props.newLineOrientation === true) && <>Spaces</>
                }
                padding={
                    this.props.hasNoLists ||
                    this.props.newLineOrientation === true
                        ? '2px 4px 2px 0px'
                        : 'initial'
                }
            />
        )
    }
}

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
                                            ? (e) => {
                                                  e.stopPropagation()
                                                  onListClick(space.id)
                                              }
                                            : undefined
                                    }
                                    isLoading={
                                        space.name == null && space != null
                                    }
                                    title={space.name}
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
                                    <SpaceName>{space.name}</SpaceName>
                                </ListSpaceContainer>
                            )
                        })}
                    <AddSpacesButton
                        hasNoLists={lists.length === 0}
                        onEditBtnClick={onEditBtnClick}
                        renderSpacePicker={renderSpacePicker}
                        tabIndex={tabIndex}
                        newLineOrientation={newLineOrientation}
                        spacePickerButtonRef={spacePickerButtonRef}
                    />
                </SpacesListContainer>
            </ListsContainer>
        </Container>
    )
}

const SpaceName = styled.div`
    text-overflow: ellipsis;
    overflow: hidden;
`

const SpacesListContainer = styled.div`
    width: fill-available;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
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

const ListsContainer = styled.div<{ newLineOrientation }>`
    display: flex;
    align-items: ${(props) =>
        props.newLineOrientation ? ' flex-start' : 'center'};
    flex-direction: ${(props) => (props.newLineOrientation ? 'column' : 'row')};
`

const loading = keyframes`
    0% { background-position: -315px 0, 0 0, 0px 190px, 50px 195px;}
    100% { background-position: 315px 0, 0 0, 0 190px, 50px 195px;}
`

const ListSpaceContainer = styled.div<{
    onClick: React.MouseEventHandler
    isLoading: boolean
}>`
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
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Satoshi', sans-serif;
    text-overflow: ellipsis;
    max-width: 200px;

    ${(props) =>
        props.isLoading &&
        css`
            width: 50px;
            background: linear-gradient(
                    0.25turn,
                    transparent,
                    ${(props) => props.theme.colors.lightHover},
                    transparent
                ),
                linear-gradient(
                    ${(props) => props.theme.colors.darkhover},
                    ${(props) => props.theme.colors.darkhover}
                ),
                radial-gradient(
                    38px circle at 19px 19px,
                    ${(props) => props.theme.colors.darkhover}50,
                    transparent 51%
                ),
                linear-gradient(
                    ${(props) => props.theme.colors.darkhover},
                    ${(props) => props.theme.colors.darkhover}
                );
            background-repeat: no-repeat;
            background-size: 315px 250px, 315px 180px, 100px 100px, 225px 30px;
            background-position: -315px 0, 0 0, 0px 190px, 50px 195px;
            animation: ${loading} 1.5s infinite;
        `};
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
