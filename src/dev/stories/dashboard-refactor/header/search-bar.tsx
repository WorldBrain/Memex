import React from 'react'
import { storiesOf } from '@storybook/react'
import SearchBar, {
    SearchBarProps,
} from 'src/dashboard-refactor/header/search-bar'
import { CursorPositionState } from 'src/dashboard-refactor/types'

const defaultQuery = 'Testy McTestface'

const cursorPositionState: CursorPositionState = {
    startPosition: defaultQuery.length,
    endPosition: defaultQuery.length,
    onCursorStartPositionChange: (position) => console.log(position),
    onCursorEndPositionChange: (position) => console.log(position),
}

const template: SearchBarProps = {
    onSearchBarFocus: () => {},
    onSearchQueryChange: (queryString) => {},
    toggleSearchFiltersBar: () => {},
    isSearchBarFocused: false,
    searchFiltersOpen: false,
    cursorPositionState,
    searchQuery: defaultQuery,
}

export const headerSearchBarPropsTemplate: {
    default: SearchBarProps
    selected: SearchBarProps
    withInput: SearchBarProps
    filtersOpen: SearchBarProps
} = {
    default: {
        ...template,
    },
    selected: {
        ...template,
        isSearchBarFocused: true,
    },
    withInput: {
        ...template,
        isSearchBarFocused: true,
        searchQuery: 'To thine ownself be true',
    },
    filtersOpen: {
        ...template,
        searchFiltersOpen: true,
    },
}

const stories = storiesOf('Dashboard Refactor|Header/Search Input Box', module)

stories.add('Unselected', () => (
    <SearchBar {...headerSearchBarPropsTemplate.default} />
))
stories.add('Selected', () => (
    <SearchBar {...headerSearchBarPropsTemplate.selected} />
))
stories.add('With Input', () => (
    <SearchBar {...headerSearchBarPropsTemplate.withInput} />
))
