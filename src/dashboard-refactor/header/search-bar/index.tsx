import React, { PureComponent } from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import colors from '../../colors'
import { fonts } from '../../styles'
import { CursorLocationState } from 'src/dashboard-refactor/types'

const textStyles = `
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
`

const SearchBarContainer = styled.div`
    height: 34px;
    width: 650px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${colors.lightGrey};
    border-radius: 5px;
`

const Input = styled.input`
    width: inherit;
    ${textStyles}
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

const FilterButton = styled.div`
    width: max-content;
    ${textStyles}
    font-size: 10px;
    line-height: 15px;
    cursor: pointer;
`

const FullWidthMargin = styled(Margin)`
    width: 100%;
`

export interface SearchBarProps {
    searchQuery: string
    cursorLocationState: CursorLocationState
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    // searchFiltersActive: [] // this is probably unnecessary given the filter query logic state manipulation parses queryString at the state layer
    onSearchBarFocus(): void
    onSearchQueryChange(queryString: string): void
    onSearchFiltersOpen(): void
}

export default class SearchBar extends PureComponent<SearchBarProps> {
    placeholder: string = 'Search your saved pages and notes'
    inputRef = React.createRef<HTMLInputElement>()

    componentDidMount = () => {
        if (this.props.isSearchBarFocused) {
            this.inputRef.current.focus()
        }
    }

    componentDidUpdate = (prevProps) => {
        const { selectionStart } = this.inputRef.current
        if (selectionStart !== prevProps.cursorLocationState.location) {
            this.props.cursorLocationState.onCursorLocationChange({
                location: selectionStart,
            })
        }
    }

    handleChange: React.FormEventHandler = (evt) => {
        // need to amend getFilterStrings function to pull through search terms as well, then
        // bundle them in an object to send with the onSearchQueryChange func
        this.props.onSearchQueryChange(evt.currentTarget.textContent)
    }

    render() {
        const {
            searchFiltersOpen,
            searchQuery,
            onSearchFiltersOpen,
            onSearchBarFocus,
        } = this.props
        return (
            <Margin vertical="auto">
                <SearchBarContainer onClick={onSearchBarFocus}>
                    <FullWidthMargin left="27px">
                        <Input
                            ref={this.inputRef}
                            placeholder={!searchQuery && this.placeholder}
                            value={searchQuery}
                            onChange={this.handleChange}
                        />
                    </FullWidthMargin>
                    <Margin horizontal="23px">
                        <FilterButton onClick={onSearchFiltersOpen}>
                            {searchFiltersOpen ? 'Remove Filters' : 'Filters'}
                        </FilterButton>
                    </Margin>
                </SearchBarContainer>
            </Margin>
        )
    }
}
