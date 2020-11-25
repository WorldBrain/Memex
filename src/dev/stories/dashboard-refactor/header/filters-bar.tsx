import React from 'react'
import { storiesOf } from '@storybook/react'
import FiltersBar, {
    FiltersBarProps,
} from 'src/dashboard-refactor/header/filters-bar'
import { SelectedState } from 'src/dashboard-refactor/types'

const stories = storiesOf('Dashboard Refactor|Header/Filters Bar', module)

const selectedStateTemplate: SelectedState = {
    isSelected: false,
    onSelection: () => {},
}

const template: FiltersBarProps = {
    isDisplayed: true,
    dateFilterSelectedState: selectedStateTemplate,
    domainFilterSelectedState: selectedStateTemplate,
    tagFilterSelectedState: selectedStateTemplate,
}

const filtersBarStoryProps: {
    hidden: FiltersBarProps
    displayedAndNotSelected: FiltersBarProps
    displayedDateSelected: FiltersBarProps
    displayedDomainsSelected: FiltersBarProps
    displayedTagsSelected: FiltersBarProps
} = {
    hidden: {
        ...template,
        isDisplayed: false,
    },
    displayedAndNotSelected: template,
    displayedDateSelected: {
        ...template,
        dateFilterSelectedState: {
            ...selectedStateTemplate,
            isSelected: true,
        },
    },
    displayedDomainsSelected: {
        ...template,
        domainFilterSelectedState: {
            ...selectedStateTemplate,
            isSelected: true,
        },
    },
    displayedTagsSelected: {
        ...template,
        tagFilterSelectedState: {
            ...selectedStateTemplate,
            isSelected: true,
        },
    },
}

stories.add('Hidden', () => <FiltersBar {...filtersBarStoryProps.hidden} />)
stories.add('Displayed Default', () => (
    <FiltersBar {...filtersBarStoryProps.displayedAndNotSelected} />
))
stories.add('Date Filter Selected', () => (
    <FiltersBar {...filtersBarStoryProps.displayedDateSelected} />
))
stories.add('Domain Filter Selected', () => (
    <FiltersBar {...filtersBarStoryProps.displayedDomainsSelected} />
))
stories.add('Tag Filter Selected', () => (
    <FiltersBar {...filtersBarStoryProps.displayedTagsSelected} />
))
