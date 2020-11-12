import React from 'react'
import { storiesOf } from '@storybook/react'
import SearchBar from 'src/dashboard-refactor/header/SearchBar/SearchBar'

const props = {
    default: {
        handleSearchBoxClick: () => console.log('Search Box Clicked'),
        handleInputChange: (evt) => console.log(evt.target.value),
        handleSubmit: () => console.log('Form submitted'),
        handleFiltersClick: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: false,
    },
    selected: {
        handleSearchBoxClick: () => console.log('Search Box Clicked'),
        handleInputChange: (evt) => console.log(evt.target.value),
        handleSubmit: () => console.log('Form submitted'),
        handleFiltersClick: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: true,
    },
    withInput: {
        handleSearchBoxClick: () => console.log('Search Box Clicked'),
        handleInputChange: (evt) => console.log(evt.target.value),
        handleSubmit: () => console.log('Form submitted'),
        handleFiltersClick: () => console.log('Filters button clicked!'),
        isSearchBoxSelected: true,
        inputString: 'To thine ownself be true',
    },
}

const stories = storiesOf('Dashboard Refactor|Header/Search Input Box', module)

stories.add('Unselected', () => <SearchBar {...props.default} />)
stories.add('Selected', () => <SearchBar {...props.selected} />)
stories.add('With Input', () => <SearchBar {...props.withInput} />)
