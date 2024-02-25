import React, { SyntheticEvent } from 'react'
import styled, { css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DisplayEntry } from '../types'

export interface Props {
    onPress?: (entry: DisplayEntry) => void
    onFocus?: (entry: DisplayEntry, index?: number) => void
    onPressActOnAll?: (entry: DisplayEntry, index?: number) => void
    index: number
    name: string
    removeTooltipText?: string
    actOnAllTooltipText?: string
    resultItem: React.ReactNode
    selected?: boolean
    focused?: boolean
    remote?: boolean
    id?: string
}

class EntryRow extends React.Component<Props> {
    _getEntry = (props) => {
        const { name, selected, focused } = this.props
        return { name, selected, focused }
    }

    handleEntryPress = () => {
        this.props.onPress && this.props.onPress(this._getEntry(this.props))
    }

    handleActOnAllPress = (e: SyntheticEvent) => {
        this.props.onPressActOnAll &&
            this.props.onPressActOnAll(this._getEntry(this.props))
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    handleMouseOver = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getEntry(this.props), this.props.index)
    }

    handleMouseOut = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getEntry(this.props), null)
    }

    render() {
        const { remote, selected, focused, resultItem } = this.props

        return (
            <Row
                onClick={this.handleEntryPress}
                onMouseOver={this.handleMouseOver}
                onMouseLeave={this.handleMouseOut}
                isFocused={focused}
            >
                <NameWrapper>{resultItem}</NameWrapper>
                <IconStyleWrapper>
                    {selected ? (
                        <ButtonContainer selected={selected}>
                            <SelectionBox selected={selected}>
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    color="black"
                                />
                            </SelectionBox>
                        </ButtonContainer>
                    ) : focused ? (
                        <ButtonContainer>
                            <SelectionBox selected={selected} />
                        </ButtonContainer>
                    ) : null}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ActOnAllTabsButton = styled.div`
    pointer-events: auto !important;
`

const ButtonContainer = styled.div<{ selected? }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    border-radius: 5px;
    align-items: center;
`

const SelectionBox = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    background: ${(props) =>
        props.selected
            ? props.theme.colors.white
            : props.theme.colors.greyScale3};
`

export const IconStyleWrapper = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
`

const Row = styled.div<{ isFocused }>`
    align-items: center;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    height: 40px;
    width: fill-available;
    cursor: pointer;
    border-radius: 5px;
    padding: 0 10px;
    color: ${(props) => props.isFocused && props.theme.colors.greyScale6};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    }

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
            background: transparent;
        `}

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    }

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            &:focus {
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
            }
            &:hover {
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
                background: transparent;
            }

            ${(props) =>
                props.isFocused &&
                css`
                    outline: 1px solid
                        ${(props) => props.theme.colors.greyScale2};
                    background: transparent;
                `}
        `};
`

const IconImg = styled.img<{ faded? }>`
    opacity: ${(props) => props.faded && '0.5'};
    height: 20px;
    width: 20px;
`

const EmptyCircle = styled.div`
    height: 18px;
    width: 18px;
    border-radius: 18px;
    border: 2px solid ${(props) => props.theme.colors.greyScale3};
`

const NameWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 70%;
    font-size: 14px;
    width: 100%;
`

export default EntryRow
