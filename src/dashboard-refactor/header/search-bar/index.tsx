import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import styled from 'styled-components'

import colors from '../../colors'
import { fonts } from '../../styles'

const textStyles = `
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary}
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
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    onSearchBarFocus(): void
    onSearchQueryChange(searchObject: any): void
    onSearchFiltersOpen(): void
}

export default class SearchBar extends PureComponent<SearchBarProps> {
    placeholder: string = 'Search your saved pages and notes'
    inputRef = React.createRef<HTMLInputElement>()
    componentDidMount = () => {
        if (this.props.isSearchBarFocused) this.inputRef.current.focus()
    }
    render() {
        const {
            searchFiltersOpen,
            searchQuery,
            onSearchQueryChange,
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
                            onChange={onSearchQueryChange}
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
