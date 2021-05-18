import React from 'react'
import { storiesOf } from '@storybook/react'
import SearchBar, {
    SearchBarProps,
} from 'src/dashboard-refactor/header/search-bar'

const template: SearchBarProps = {
    onSearchQueryChange: (queryString) => {},
    onSearchFiltersOpen: () => {},
    searchFiltersOpen: false,
    searchQuery: '',
    onInputClear: () => {},
}

export const headerSearchBarPropsTemplate: {
    default: SearchBarProps
    withInput: SearchBarProps
} = {
    default: {
        ...template,
    },
    withInput: {
        ...template,
        searchQuery: 'To thine ownself be true',
    },
}

const stories = storiesOf('Dashboard Refactor|Header/Search Input Box', module)

stories.add('Default', () => (
    <SearchBar {...headerSearchBarPropsTemplate.default} />
))
stories.add('With Input', () => (
    <SearchBar {...headerSearchBarPropsTemplate.withInput} />
))
