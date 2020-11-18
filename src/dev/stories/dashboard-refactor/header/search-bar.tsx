import React from 'react'
import { storiesOf } from '@storybook/react'
import SearchBar, {
    SearchBarProps,
} from 'src/dashboard-refactor/header/SearchBar/SearchBar'

const props: {
    default: SearchBarProps
    selected: SearchBarProps
    withInput: SearchBarProps
} = {
    default: {
        onSearchBoxFocus: () => console.log('Search Box Clicked'),
        onSearchBarInputChange: (event) => console.log(event.target),
        onSearchSubmit: (event) => console.log(event.searchQuery),
        onSearchFiltersOpen: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: false,
    },
    selected: {
        onSearchBoxFocus: () => console.log('Search Box Clicked'),
        onSearchBarInputChange: (event) => console.log(event.target),
        onSearchSubmit: (event) => console.log(event.searchQuery),
        onSearchFiltersOpen: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: true,
    },
    withInput: {
        onSearchBoxFocus: () => console.log('Search Box Clicked'),
        onSearchSubmit: (event) => console.log(event.searchQuery),
        onSearchBarInputChange: (event) => console.log(event.target),
        onSearchFiltersOpen: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: true,
        inputString: 'To thine ownself be true',
    },
}

const stories = storiesOf('Dashboard Refactor|Header/Search Input Box', module)

stories.add('Unselected', () => <SearchBar {...props.default} />)
stories.add('Selected', () => <SearchBar {...props.selected} />)
stories.add('With Input', () => <SearchBar {...props.withInput} />)
