import React from 'react'
import { storiesOf } from '@storybook/react'
import FiltersBar, {
    FiltersBarProps,
} from 'src/dashboard-refactor/header/filters-bar'
import { SelectedState } from 'src/dashboard-refactor/types'
import { DateRangeSelectionProps } from 'src/overview/search-bar/components/DateRangeSelection'
import moment from 'moment'
import { FilterPickerProps } from 'src/dashboard-refactor/header/filters-bar/types'

const stories = storiesOf('Dashboard Refactor|Header/Filters Bar', module)

const selectedStateTemplate: SelectedState = {
    isSelected: false,
    onSelection: () => {},
}

export const datePickerPropsTemplate: DateRangeSelectionProps = {
    env: 'overview',
    startDate: moment().unix(),
    endDate: moment().add(7, 'd').unix(),
    startDateText: 'Today',
    endDateText: 'One week from now',
    onStartDateChange: () => {},
    onEndDateChange: () => {},
    onStartDateTextChange: () => {},
    onEndDateTextChange: () => {},
    disabled: false,
    changeTooltip: () => {},
}

const defaultSuggestionsTemplate = [
    'Generic Entry 1',
    'Generic Entry 2',
    'Other Entry',
]
const initialSelectedEntriesTemplate = [defaultSuggestionsTemplate[0]]

export const genericPickerPropsTemplate: FilterPickerProps = {
    initialSelectedEntries: initialSelectedEntriesTemplate,
    queryEntries: async (query) => initialSelectedEntriesTemplate,
    onToggleShowPicker: () => {},
    onEntriesListUpdate: async () => {},
    onSearchInputChange: () => {},
    loadDefaultSuggestions: () => defaultSuggestionsTemplate,
    onSelectedEntriesChange: (evt) => {},
}

const template: FiltersBarProps = {
    isDisplayed: true,
    dateFilterSelectedState: selectedStateTemplate,
    domainFilterSelectedState: selectedStateTemplate,
    tagFilterSelectedState: selectedStateTemplate,
    pickerProps: {
        datePickerProps: datePickerPropsTemplate,
    },
}

export const filtersBarStoryProps: {
    hidden: FiltersBarProps
    displayedAndNotSelected: FiltersBarProps
    displayedDateSelected: FiltersBarProps
    displayedDomainsSelected: FiltersBarProps
    displayedTagsSelected: FiltersBarProps
    displayedTagsSelectedWithQuery: FiltersBarProps
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
        pickerProps: {
            domainPickerProps: genericPickerPropsTemplate,
        },
    },
    displayedTagsSelected: {
        ...template,
        tagFilterSelectedState: {
            ...selectedStateTemplate,
            isSelected: true,
        },
        pickerProps: {
            tagPickerProps: genericPickerPropsTemplate,
        },
    },
    displayedTagsSelectedWithQuery: {
        ...template,
        tagFilterSelectedState: {
            ...selectedStateTemplate,
            isSelected: true,
        },
        pickerProps: {
            tagPickerProps: {
                ...genericPickerPropsTemplate,
                query: 'Generic',
            },
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
stories.add('Tag Filter Selected With Input', () => (
    <FiltersBar {...filtersBarStoryProps.displayedTagsSelectedWithQuery} />
))
