import React, { PureComponent } from 'react'
import styled from 'styled-components'

import Margin from 'src/dashboard-refactor/components/Margin'

import colors from '../../colors'
import styles, { fonts } from '../../styles'
import * as icons from 'src/common-ui/components/design-library/icons'

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
    padding: 0px 15px;
`

const Input = styled.input`
    width: inherit;
    font-size: 12px;
    line-height: 18px;
    border: none;
    background-color: transparent;
    padding-left: 10px;

    &:focus {
        outline: none;
    }
`

const FilterButton = styled(Margin)`
    width: max-content;
    ${textStyles}
    font-size: 12px;
    line-height: 15px;
    cursor: pointer;
    width: auto;
    white-space: nowrap;
`

const FullWidthMargin = styled(Margin)`
    width: 100%;
`

const SearchIcon = styled.img`
    width: 16px;
    height: 17px;
    display: flex;
    justify-content: center;
    align-items: center;
`

export interface SearchBarProps {
    placeholder?: string
    searchQuery: string
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    onSearchBarFocus(): void
    onSearchQueryChange(queryString: string): void
    onSearchFiltersOpen(): void
}

export default class SearchBar extends PureComponent<SearchBarProps> {
    inputRef = React.createRef<HTMLInputElement>()
    componentDidMount = () => {
        if (this.props.isSearchBarFocused) {
            this.inputRef.current.focus()
        }
    }
    handleChange: React.KeyboardEventHandler = (evt) => {
        // need to amend getFilterStrings function to pull through search terms as well, then
        // bundle them in an object to send with the onSearchQueryChange func
        this.props.onSearchQueryChange((evt.target as HTMLInputElement).value)
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
                    <FullWidthMargin>
                        <SearchIcon src={icons.searchIcon} />
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
                    <FilterButton left="15px" onClick={onSearchFiltersOpen}>
                        {searchFiltersOpen ? 'Remove Filters' : 'Filters'}
                    </FilterButton>
                </SearchBarContainer>
            </Margin>
        )
    }
}
