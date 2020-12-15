import React, { PureComponent } from 'react'
import styled, { keyframes } from 'styled-components'

import colors from '../../../colors'
import { fonts } from '../../../styles'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { ListsSidebarItemComponentProps as Props } from './types'

// probably want to use timing function to get this really looking good. This is just quick and dirty
const blinkingAnimation = keyframes`
    0% {
        background-color: ${colors.onHover};
    }
    70% {
        background-color: transparent;
    }
    100% {
        background-color: ${colors.onHover};
    }
`

const containerWidth = 173
const titleLeftMargin = 19
const iconMargin = 7.5

const Container = styled.div<Props>`
    height: 27px;
    width: ${containerWidth}px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;

    &:hover {
        background-color: ${colors.onHover};
        ${({ selectedState }: Props) =>
            selectedState.isSelected && `background-color: ${colors.onSelect};`}
    }

    ${({ dropReceivingState }: Props) =>
        dropReceivingState.triggerSuccessfulDropAnimation &&
        `animation: ${blinkingAnimation} 0.4s 2;`}

    cursor: ${({ dropReceivingState }: Props) =>
        !dropReceivingState.isDraggedOver
            ? `pointer`
            : dropReceivingState.canReceiveDroppedItems
            ? `default`
            : `not-allowed`};
`

const ListTitle = styled.p<Props>`
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

    max-width: 100%;
`

const NewItemsCount = styled.div`
    width: 30px;
    height: 14px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${colors.midGrey};
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    font-size: 10px;
    line-height: 14px;
`

export default class ListsSidebarItem extends PureComponent<Props> {
    private renderTitle() {
        if (!this.props.nameHighlightIndices) {
            return <ListTitle {...this.props}>{this.props.name}</ListTitle>
        }

        const [from, to] = this.props.nameHighlightIndices
        const [namePre, nameHighlighted, namePost] = [
            this.props.name.slice(0, from),
            this.props.name.slice(from, to),
            this.props.name.slice(to),
        ]

        return (
            <ListTitle {...this.props}>
                {namePre.length > 0 && <span>{namePre}</span>}
                <span style={{ fontWeight: fonts.primary.weight.bold }}>
                    {nameHighlighted}
                </span>
                {namePost.length > 0 && <span>{namePost}</span>}
            </ListTitle>
        )
    }

    private renderIcon() {
        const {
            dropReceivingState: { canReceiveDroppedItems, isDraggedOver },
            hoverState: { isHovered },
            newItemsCountState: { displayNewItemsCount, newItemsCount },
            moreActionButtonState: {
                onMoreActionClick,
                displayMoreActionButton,
            },
        } = this.props

        if (displayNewItemsCount) {
            return (
                <NewItemsCount>
                    <NewItemsCountInnerDiv>
                        {newItemsCount}
                    </NewItemsCountInnerDiv>
                </NewItemsCount>
            )
        }

        if (canReceiveDroppedItems && isDraggedOver) {
            return <Icon heightAndWidth="12px" path="/img/plus.svg" />
        }

        if (isHovered && displayMoreActionButton) {
            return (
                <Icon
                    onClick={onMoreActionClick}
                    heightAndWidth="12px"
                    path="/img/open.svg"
                />
            )
        }
    }

    private renderDefault() {
        const { hoverState, newItemsCountState } = this.props

        return (
            <Container {...this.props}>
                <Margin left="19px">{this.renderTitle()}</Margin>
                {(hoverState.isHovered ||
                    newItemsCountState.displayNewItemsCount) && (
                    <Margin right={`${iconMargin}px`}>
                        {this.renderIcon()}
                    </Margin>
                )}
            </Container>
        )
    }

    private renderEditing() {
        const {
            className,
            selectedState: { isSelected },
        } = this.props

        return (
            <Container className={className} isSelected={isSelected}>
                <Margin left={`${titleLeftMargin}px`}>
                    <ListTitle {...this.props}>{this.props.name}</ListTitle>
                </Margin>
            </Container>
        )
    }

    render() {
        if (this.props.isEditing) {
            return this.renderEditing()
        }

        return this.renderDefault()
    }
}
