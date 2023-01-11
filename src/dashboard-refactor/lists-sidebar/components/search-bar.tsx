import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { SidebarLockedState } from '../types'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

const textStyles = `
    font-family: 'Satoshi', sans-serif;
    font-weight: ${fonts.primary.weight.normal};
    font-size: 14px;
    line-height: 15px;
    color: ${(props) => props.theme.colors.white};
    cursor: text;
`

const OuterContainer = styled.div<{ isSidebarLocked: boolean }>`
    height: min-content;
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: fill-available;
    height: 34px;
    margin: 5px 0;
    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
`

const InnerContainer = styled.div<{ displayTopBorder?: boolean }>`
    height: fill-available;
    width: 100%;
    background-color: transparent;
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    ${(props) =>
        props.displayTopBorder &&
        css`
            border-top: 0.5px solid ${colors.lighterGrey};
        `}
`

const Input = styled.input`
    width: 100%;
    height: 100%;
    border: none;
    color: ${(props) => props.theme.colors.white};
    background: inherit;
    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale8};
    }

    &:focus {
        outline: none;
    }

    flex-direction: flex-start;
    padding-left: 5px;
`

const TextSpan = styled.span<{ bold: boolean }>`
    word-break: break-word;

    ${(props) =>
        props.bold &&
        css`
            font-weight: 700;
            color: ${(props) => props.theme.colors.white};
            white-space: nowrap;
            margin-right: 5px;
        `};
`

const IconContainer = styled.div<{ hoverOff }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: start;
    margin-left: 10px;
    cursor: ${(props) => props.hoverOff && 'default'};
`

const StyledIcon = styled(Icon)`
    color: ${(props) => props.theme.colors.primary};
    opacity: 0.7;
    cursor: pointer;
`

const SearchArea = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
    padding: 0 15px;
`

const CreateButton = styled.div`
    min-height: 30px;
    width: fill-available;
    display: flex;
    padding: 5px 10px;
    align-items: flex-start;
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 14px;
    cursor: pointer;
    border-radius: 5px;
    flex-direction: column;
    grid-gap: 5px;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale2};
    }
`

const ShortCut = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 2px 5px;
    border-radius: 5px;
    width: 30px;
    font-size: 10px;
    color: ${(props) => props.theme.colors.white};
    border: 1px solid ${(props) => props.theme.colors.darkerText};
`
const CreateBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

export interface ListsSidebarSearchBarProps {
    searchQuery?: string
    onSearchQueryChange(inputString: string): void
    onInputClear(): void
    onCreateNew(newListName: string): void // should this return a promise?
    sidebarLockedState: SidebarLockedState
    localLists?: any
}

export default class ListsSidebarSearchBar extends PureComponent<
    ListsSidebarSearchBarProps
> {
    private inputRef = React.createRef<HTMLInputElement>()

    private handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
        evt,
    ) => {
        this.props.onSearchQueryChange(evt.currentTarget.value)
    }

    private handleCreateNewClick: React.MouseEventHandler = (
        evt: React.MouseEvent,
    ) => {
        this.props.onCreateNew(this.props.searchQuery)
    }

    private renderCreateNew = () => {
        return (
            <CreateButton onClick={this.handleCreateNewClick}>
                <CreateBox>
                    <TextSpan bold>Create</TextSpan>
                    <KeyboardShortcuts size={'small'} keys={['Enter']} />
                </CreateBox>
                <TextSpan>{this.props.searchQuery}</TextSpan>
            </CreateButton>
        )
    }

    handleClearSearch() {
        this.props.onInputClear()
        this.inputRef.current.focus()
    }

    private handleKeyDown: React.KeyboardEventHandler = (e) => {
        if (e.key === 'Escape') {
            this.handleClearSearch()
        }

        if (e.key === 'Enter') {
            this.props.onCreateNew(this.props.searchQuery)
            this.handleClearSearch()
        }
    }

    render(): JSX.Element {
        const {
            searchQuery,
            sidebarLockedState: { isSidebarLocked },
        } = this.props
        return (
            <SearchArea>
                <OuterContainer isSidebarLocked={isSidebarLocked}>
                    <InnerContainer horizontal="15px">
                        {!!searchQuery ? (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="14px"
                                        path={icons.removeX}
                                        onClick={() => this.handleClearSearch()}
                                    />
                                </Margin>
                            </IconContainer>
                        ) : (
                            <IconContainer hoverOff>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="16px"
                                        path={icons.searchIcon}
                                        hoverOff={true}
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <Input
                            placeholder="Search Spaces"
                            ref={this.inputRef}
                            onChange={this.handleInputChange}
                            value={searchQuery}
                            autoFocus
                            onKeyDown={this.handleKeyDown}
                        />
                    </InnerContainer>
                </OuterContainer>
                {this.props.searchQuery.length > 0 &&
                    this.props.localLists.length === 0 &&
                    this.renderCreateNew()}
            </SearchArea>
        )
    }
}
