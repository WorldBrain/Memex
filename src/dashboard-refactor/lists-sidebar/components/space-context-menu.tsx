import React, { PureComponent } from 'react'

import styled, { css, keyframes } from 'styled-components'

import styles, { fonts } from 'src/dashboard-refactor/styles'

import colors from 'src/dashboard-refactor/colors'

import { Icon } from 'src/dashboard-refactor/styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import {
    ListSource,
    DropReceivingState,
    SelectedState,
} from 'src/dashboard-refactor/types'

import { Props as EditableItemProps } from './sidebar-editable-item'

import { ListNameHighlightIndices } from '../types'

import * as icons from 'src/common-ui/components/design-library/icons'

import { ClickAway } from 'src/util/click-away-wrapper'

import { UIElementServices } from '@worldbrain/memex-common/lib/services/types'

export interface Props {
    className?: string

    isEditing?: boolean

    newItemsCount?: number

    name: string

    listId: number

    source?: ListSource

    hasActivity?: boolean

    isMenuDisplayed?: boolean

    isCollaborative?: boolean

    nameHighlightIndices?: ListNameHighlightIndices

    onUnfollowClick?: React.MouseEventHandler

    onRenameClick?: React.MouseEventHandler

    onDeleteClick?: React.MouseEventHandler

    onShareClick?: React.MouseEventHandler

    dropReceivingState?: DropReceivingState

    editableProps?: EditableItemProps

    selectedState: SelectedState

    onMoreActionClick?: (listId: number) => void

    services?: UIElementServices<'contentSharing' | 'overlay' | 'clipboard'>

    buttonRef?: React.RefObject<HTMLButtonElement>

    position?: { x: number; y: number }
}

const Modal = ({
    children,

    show,

    closeModal,

    position,
}: {
    children: JSX.Element

    show: boolean

    closeModal: React.MouseEventHandler

    position: { x: number; y: number }
}) => {
    return (
        <ModalRoot style={{ display: show ? 'block' : 'none' }}>
            <Overlay onClick={closeModal} />

            <ModalContent x={position.x} y={position.y}>
                {children}
            </ModalContent>
        </ModalRoot>
    )
}

const ModalRoot = styled.div`
    z-index: 1000;

    width: 100%;

    height: 100%;

    position: fixed;

    top: 0;

    left: 0;

    padding-top: 80px;
`

/* Modal content */

const ModalContent = styled.div<{ x: number; y: number }>`
    z-index: 999;

    position: absolute;

    top: ${(props) => props.y}px;

    left: ${(props) => props.x}px;

    padding: 20px;

    text-align: center;

    border-radius: 4px;
`

const Overlay = styled.div`
    position: absolute;

    left: 0;

    top: 0;

    width: 100%;

    height: 100%;

    z-index: 995;
`

export default class SpaceContextMenuButton extends PureComponent<
    Props,
    { position: { x: number; y: number } }
> {
    private buttonRef: React.RefObject<HTMLInputElement>

    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()

        const rect = this.buttonRef?.current?.getBoundingClientRect()

        this.setState({ position: rect ?? { x: 0, y: 0 } })

        this.props.onMoreActionClick(this.props.listId)
    }

    constructor(props) {
        super(props)

        this.buttonRef = React.createRef()

        this.state = { position: { x: 0, y: 0 } }
    }

    render() {
        const {
            dropReceivingState,

            onMoreActionClick,

            newItemsCount,

            hasActivity,
        } = this.props

        if (onMoreActionClick) {
            return (
                <>
                    <Icon
                        paddingHorizontal="10px"
                        heightAndWidth="12px"
                        path={icons.dots}
                        ref={this.buttonRef}
                        onClick={this.handleMoreActionClick}
                    />

                    {!(!this.props.source || !this.props.isMenuDisplayed) && (
                        <SpaceContextMenu
                            {...this.props}
                            position={this.state.position}
                        />
                    )}
                </>
            )
        }

        return null
    }
}

export class SpaceContextMenu extends PureComponent<Props> {
    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()

        this.props.onMoreActionClick(this.props.listId)
    }

    render() {
        if (!this.props.source || !this.props.isMenuDisplayed) {
            return false
        }

        const renderMenu = (children: React.ReactNode) => (
            <>
                {/* <ClickAway onClickAway={this.handleMoreActionClick}> */}

                <Modal
                    show={true}
                    closeModal={this.handleMoreActionClick}
                    position={this.props.position}
                >
                    <MenuContainer>{children}</MenuContainer>
                </Modal>

                {/* </ClickAway> */}
            </>
        )

        if (this.props.source === 'followed-lists') {
            return renderMenu(
                <MenuButton onClick={this.props.onUnfollowClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={'TODO.svg'} />
                    </Margin>
                    Unfollow
                </MenuButton>,
            )
        }

        return renderMenu(
            <>
                <MenuButton onClick={this.props.onShareClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.link} />
                    </Margin>
                    Share
                </MenuButton>

                <MenuButton onClick={this.props.onDeleteClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.remove} />
                    </Margin>
                    Delete
                </MenuButton>

                <MenuButton onClick={this.props.onRenameClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.edit} />
                    </Margin>
                    Rename
                </MenuButton>
            </>,
        )
    }
}

const ActivityBeacon = styled.div`
    width: 14px;

    height: 14px;

    border-radius: 10px;

    padding: 8px;

    background-color: ${(props) => props.theme.colors.secondary};
`

const NewItemsCount = styled.div`
    width: 30px;

    height: 14px;

    border-radius: 10px;

    display: flex;

    justify-content: flex-end;

    align-items: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};

    font-weight: ${fonts.primary.weight.bold};

    font-size: 14px;

    line-height: 14px;
`

const Container = styled.div`
    position: relative;
`

const Name = styled.div`
    display: block;

    overflow-x: hidden;

    text-overflow: ellipsis;

    padding-right: 5px;
`

const MenuContainer = styled.div`
    display: 'flex';

    flex-direction: 'column';

    width: min-content;

    position: absolute;

    background-color: ${colors.white};

    box-shadow: ${styles.boxShadow.overlayElement};

    border-radius: ${styles.boxShadow.overlayElement};

    z-index: 1;
`

// left: 105px;

// top: 30px;

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.hasActivity ||
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver ||
        props.dropReceivingState?.wasPageDropped
            ? 'flex'
            : 'None'};

    height: 100%;

    align-items: center;

    justify-content: flex-end;

    padding-right: 10px;

    padding-left: 5px;
`

const DropZoneMask = styled.div`
    height: inherit;

    width: inherit;

    position: absolute;
`

const TitleBox = styled.div`
    display: flex;

    flex: 1;

    width: 100%;

    height: 100%;

    padding-left: 15px;

    align-items: center;

    padding-right: 10px;
`

const SidebarItem = styled.div<Props>`

 height: 30px;

 width: 100%;

 display: flex;

 flex-direction: row;

 justify-content: space-between;

 align-items: center;

 background-color: transparent;

  

 &:hover {

 background-color: ${colors.onHover};

 }

  

 ${({ isMenuDisplayed, dropReceivingState }) =>
     css`
         background-color: ${isMenuDisplayed ||
         (dropReceivingState?.canReceiveDroppedItems &&
             dropReceivingState?.isDraggedOver)
             ? `${colors.onHover}`
             : `transparent`};
     `};

  

 &:hover ${IconBox} {

 display: ${(props) =>
     !(
         props.hasActivity ||
         props.newItemsCount ||
         props.dropReceivingState?.isDraggedOver
     )
         ? 'flex'
         : 'None'};

 }

  

 &:hover ${TitleBox} {

 width: 70%;

 }

  

 ${({ selectedState }: Props) =>
     selectedState?.isSelected &&
     css`
         background-color: ${colors.onSelect};
     `}

  

 ${({ dropReceivingState }: Props) =>
     dropReceivingState?.wasPageDropped &&
     css`
         animation: ${blinkingAnimation} 0.2s 2;
     `}

  

 cursor: ${({ dropReceivingState }: Props) =>
     !dropReceivingState?.isDraggedOver
         ? `pointer`
         : dropReceivingState?.canReceiveDroppedItems
         ? `pointer`
         : `not-allowed`};

`

const MenuButton = styled.div`
    height: 34px;

    width: 100%;

    font-family: ${fonts.primary.name};

    font-weight: ${fonts.primary.weight.normal};

    font-size: 12px;

    line-height: 18px;

    display: flex;

    flex-direction: row;

    justify-content: flex-start;

    align-items: center;

    cursor: pointer;

    padding: 0px 10px 0 0;

    &: ${SidebarItem} {
        background-color: red;
    }

    &:hover {
        background-color: ${colors.onHover};
    }

    & > div {
        width: auto;
    }
`

const ListTitle = styled.span<Props>`
    display: flex;

    align-items: center;

    margin: 0;

    font-family: ${fonts.primary.name};

    font-style: normal;

    ${({ selectedState }: Props) =>
        selectedState.isSelected &&
        `font-weight: ${fonts.primary.weight.bold};`}

    font-size: 12px;

    line-height: 18px;

    height: 18px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

    padding-right: 5px;

    justify-content: flex-start;

    width: 100%;

    pointer-events: none;
`

// probably want to use timing function to get this really looking good. This is just quick and dirty

const blinkingAnimation = keyframes`

 0% {

 background-color: ${colors.onHover};

 }

 50% {

 background-color: transparent;

 }

 100% {

 background-color: ${colors.onHover};

 }

`
