import React, { PureComponent } from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import colors from '../../colors'
import styles, { fonts } from '../../styles'
import { CursorPositionState } from 'src/dashboard-refactor/types'

const textStyles = `
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
`

const SearchBarContainer = styled.div`
    height: 34px;
    max-width: ${styles.components.searchBar.widthPx}px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${colors.lightGrey};
    border-radius: 5px;
`

const Input = styled.input`
    width: inherit;
    font-size: 12px;
    line-height: 18px;
    border: none;
    background-color: transparent;

    &:focus {
        outline: none;
    }

    &::placeholder {
        ${textStyles}
    }
`

const FilterButton = styled(Margin)`
    width: max-content;
    ${textStyles}
    font-size: 12px;
    line-height: 15px;
    cursor: pointer;
    width: auto;
`

const FullWidthMargin = styled(Margin)`
    width: 100%;
`

export interface SearchBarProps {
    placeholder?: string
    searchQuery: string
    cursorPositionState: CursorPositionState
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    onSearchBarFocus(): void
    onSearchQueryChange(queryString: string): void
    toggleSearchFiltersBar(): void
}

export default class SearchBar extends PureComponent<SearchBarProps> {
    inputRef = React.createRef<HTMLInputElement>()

    componentDidUpdate = () => {
        if (this.props.isSearchBarFocused) {
            this.inputRef.current.focus()
        }
    }

    handleChange: React.KeyboardEventHandler = (evt) => {
        this.props.onSearchQueryChange((evt.target as HTMLInputElement).value)
    }

    setCursorPositionStates = (): void => {
        const { selectionStart, selectionEnd } = this.inputRef.current
        const { cursorPositionState } = this.props
        if (selectionStart !== cursorPositionState.startPosition) {
            cursorPositionState.onCursorStartPositionChange(selectionStart)
        }
        if (selectionEnd !== cursorPositionState.endPosition) {
            cursorPositionState.onCursorStartPositionChange(selectionEnd)
        }
    }

    handleKeyDown: React.KeyboardEventHandler = (evt) => {
        const { cursorPositionState } = this.props
        if (
            cursorPositionState.startPosition ===
            cursorPositionState.endPosition
        ) {
            if (
                evt.key === 'ArrowLeft' ||
                evt.key === 'ArrowRight' ||
                evt.key === ' ' ||
                evt.key === '"'
            ) {
                this.setCursorPositionStates()
            }
        } else {
            this.setCursorPositionStates()
        }
    }

    render() {
        const {
            searchFiltersOpen,
            searchQuery,
            toggleSearchFiltersBar,
            onSearchBarFocus,
        } = this.props
        return (
            <Margin vertical="auto">
                <SearchBarContainer onClick={onSearchBarFocus}>
                    <FullWidthMargin>
                        <Input
                            ref={this.inputRef}
                            placeholder={
                                this.props.placeholder ??
                                'Search your saved pages and notes'
                            }
                            value={searchQuery}
                            onChange={this.handleChange}
                            autoComplete="off"
                        />
                    </FullWidthMargin>
                    <Margin horizontal="23px">
                        <FilterButton onClick={toggleSearchFiltersBar}>
                            {searchFiltersOpen ? 'Remove Filters' : 'Filters'}
                        </FilterButton>
                    </Margin>
                </SearchBarContainer>
            </Margin>
        )
    }
}
