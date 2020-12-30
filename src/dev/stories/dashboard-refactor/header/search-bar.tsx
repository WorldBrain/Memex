import React from 'react'
import { storiesOf } from '@storybook/react'
import SearchBar, {
    SearchBarProps,
} from 'src/dashboard-refactor/header/search-bar'

const template: SearchBarProps = {
    onSearchBarFocus: () => {},
    onSearchQueryChange: (queryString) => {},
    onSearchFiltersOpen: () => {},
    searchFiltersActive: [],
    isSearchBarFocused: false,
    searchFiltersOpen: false,
    searchQuery: '',
}

const props: {
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

stories.add('Unselected', () => <SearchBar {...props.default} />)
stories.add('Selected', () => <SearchBar {...props.selected} />)
stories.add('With Input', () => <SearchBar {...props.withInput} />)
