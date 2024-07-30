import React, { HTMLProps } from 'react'
import styled, { css, keyframes } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import * as icons from 'src/common-ui/components/design-library/icons'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { padding } from 'polished'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    lists: Array<{
        id: number
        name: string | JSX.Element
        isShared: boolean
        type: 'page-link' | 'user-list' | 'special-list' | 'rss-feed'
    }>
    onEditBtnClick?: React.MouseEventHandler
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
                iconColor={'prime1'}
                onClick={(e) => {
                    this.props.onEditBtnClick?.(e)
                }}
                height="24px"
                width={
                    this.props.hasNoLists ||
                    this.props.newLineOrientation === true
                        ? 'fit-content'
                        : '24px'
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
        <Container padding={padding.toString()} {...props}>
            <ListsContainer newLineOrientation={newLineOrientation === true}>
                <SpacesListContainer>
                    {lists.slice(0).map((space) => {
                        return (
                            <ListSpaceContainer
                                key={space.id}
                                onMouseDown={(event: React.MouseEvent) => {
                                    event.stopPropagation()
                                    onListClick(space.id)
                                }}
                                onMouseUp={(event: React.MouseEvent) => {
                                    event.stopPropagation()
                                }}
                                isLoading={space.name == null && space != null}
                                title={
                                    typeof space.name === 'string'
                                        ? space.name
                                        : ''
                                }
                                spaceId={space.id ?? null}
                            >
                                {' '}
                                {space.type === 'page-link' && (
                                    <Icon
                                        heightAndWidth="16px"
                                        hoverOff
                                        icon="link"
                                        color="greyScale5"
                                    />
                                )}
                                {space.type === 'rss-feed' && (
                                    <Icon
                                        heightAndWidth="16px"
                                        hoverOff
                                        icon="feed"
                                        color="greyScale5"
                                    />
                                )}
                                {space.isShared &&
                                    space.type !== 'page-link' && (
                                        <Icon
                                            heightAndWidth="16px"
                                            hoverOff
                                            icon="peopleFine"
                                            color="greyScale5"
                                        />
                                    )}
                                <SpaceName>{space.name}</SpaceName>
                            </ListSpaceContainer>
                        )
                    })}
                    {/* <AddSpacesButton
                        hasNoLists={lists.length === 0}
                        onEditBtnClick={onEditBtnClick}
                        renderSpacePicker={renderSpacePicker}
                        tabIndex={tabIndex}
                        newLineOrientation={newLineOrientation}
                        spacePickerButtonRef={spacePickerButtonRef}
                    /> */}
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

const Container = styled.div<{ padding?: string }>`
    display: flex;
    grid-gap: 10px;
    align-items: flex-start;
    justify-content: flex-start;
    padding: ${(props) =>
        props.padding ? props.padding : '0px 10px 5px 10px'};
    min-height: 24px;
    height: fit-content;
    grid-auto-flow: column;
    //border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
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
    isLoading: boolean
    spaceId: number
}>`
    background: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale1
            : props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale6};
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.6px;
    height: 20px;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.spaceId ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    text-overflow: ellipsis;
    max-width: 200px;

    ${(props) =>
        props.isLoading &&
        css`
            width: 50px;
            background: linear-gradient(
                    0.25turn,
                    transparent,
                    ${(props) => props.theme.colors.greyScale3},
                    transparent
                ),
                linear-gradient(
                    ${(props) => props.theme.colors.greyScale2},
                    ${(props) => props.theme.colors.greyScale2}
                ),
                radial-gradient(
                    38px circle at 19px 19px,
                    ${(props) => props.theme.colors.greyScale2}50,
                    transparent 51%
                ),
                linear-gradient(
                    ${(props) => props.theme.colors.greyScale2},
                    ${(props) => props.theme.colors.greyScale2}
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
    mask-image: url(${icons.commentAdd});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
    right: 30px;
    position: relative;
    z-index: 10;
`
