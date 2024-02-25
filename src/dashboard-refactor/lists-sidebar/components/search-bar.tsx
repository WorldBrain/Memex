import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import colors from 'src/dashboard-refactor/colors'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

const OuterContainer = styled.div<{ isSidebarLocked: boolean }>`
    height: min-content;
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
        color: ${(props) => props.theme.colors.greyScale5};
    }

    &:focus {
        outline: none;
    }

    flex-direction: flex-start;
    padding-left: 5px;
`

const TextSpan = styled.span<{ bold?: boolean }>`
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

const IconContainer = styled.div<{ hoverOff?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-items: start;
    margin-left: 10px;
    cursor: ${(props) => props.hoverOff && 'default'};
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
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    cursor: pointer;
    border-radius: 5px;
    flex-direction: column;
    grid-gap: 5px;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale2};
    }
`

const CreateBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

export interface ListsSidebarSearchBarProps {
    onInputClear(): void
    onCreateNew(newListName: string): void
    onSearchQueryChange(inputString: string): void
    areLocalListsEmpty: boolean
    isSidebarLocked: boolean
    searchQuery: string
    getRootElement: () => HTMLElement
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
                    <KeyboardShortcuts
                        size={'small'}
                        keys={['Enter']}
                        getRootElement={this.props.getRootElement}
                    />
                </CreateBox>
                <TextSpan>{this.props.searchQuery}</TextSpan>
            </CreateButton>
        )
    }

    private handleClearSearch = () => {
        this.props.onInputClear()
        this.inputRef.current.focus()
    }

    private handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
        e,
    ) => {
        if (e.key === 'Escape') {
            this.handleClearSearch()
        }

        if (e.key === 'Enter') {
            this.props.onCreateNew(this.props.searchQuery)
            this.handleClearSearch()
        }
    }

    render(): JSX.Element {
        const { searchQuery, isSidebarLocked } = this.props
        return (
            <SearchArea>
                <OuterContainer isSidebarLocked={isSidebarLocked}>
                    <InnerContainer>
                        {!!searchQuery ? (
                            <IconContainer>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="14px"
                                        path={icons.removeX}
                                        onClick={this.handleClearSearch}
                                    />
                                </Margin>
                            </IconContainer>
                        ) : (
                            <IconContainer hoverOff>
                                <Margin right="5px">
                                    <Icon
                                        heightAndWidth="16px"
                                        path={icons.searchIcon}
                                        hoverOff
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <Input
                            placeholder="Search Spaces"
                            ref={this.inputRef}
                            id={'spaces-search-bar'}
                            onChange={this.handleInputChange}
                            value={searchQuery}
                            autoFocus
                            onKeyDown={this.handleKeyDown}
                        />
                    </InnerContainer>
                </OuterContainer>
                {searchQuery.length > 0 &&
                    this.props.areLocalListsEmpty &&
                    this.renderCreateNew()}
            </SearchArea>
        )
    }
}
