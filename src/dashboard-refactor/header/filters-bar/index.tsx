import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import { sizeConstants } from 'src/dashboard-refactor/constants'
import { fonts } from 'src/dashboard-refactor/styles'
import TagPicker from 'src/tags/ui/TagPicker'
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import Margin from 'src/dashboard-refactor/components/Margin'
import DomainPicker from './DomainPicker/'
import DatePicker, {
    DateRangeSelectionProps,
} from 'src/overview/search-bar/components/DateRangeSelection'
import type { SearchFilterLabel, SearchFilterType } from '../types'
import { DomainPickerDependencies } from './DomainPicker/logic'
import { TagPickerDependencies } from 'src/tags/ui/TagPicker/logic'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'

const windowWidth: number = window.innerWidth
const searchBarWidthPx: number = sizeConstants.searchBar.widthPx

const Container = styled.div<{ hidden: boolean }>`
    height: 50px;
    width: 100%;
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
    justify-content: center;
    position: sticky;
    top: 60px;
    background: white;
    z-index: 2147483645;
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};

    ${(props) =>
        css`
            display: ${props.hidden ? 'none' : 'flex'};
        `};
`

const FilterBtnsContainer = styled.div`
    width: ${searchBarWidthPx}px;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
`

const PickersContainer = styled.div`
    position: relative;
    top: 30px;
`

const FilterSelectButton = styled.div<{ filterActive: boolean }>`
    width: fit-content;
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: column;
    align-items: center;
    padding: 3px 12px;
    background: #ffffff;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    white-space: nowrap;
    max-width: 300px;
    overflow: scroll;
    font-size: 13px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    cursor: pointer;
    height: 30px;
    color: ${(props) =>
        props.filterActive
            ? props.theme.colors.darkerText
            : props.theme.colors.normalText};
`

const TextSpan = styled.span`
    font - family: ${fonts.primary.name};
font - weight: ${fonts.primary.weight.normal};
font - size: 12px;
line - height: 15px;
`

const TagPill = styled.div`
    display: flex;
    justify-content: center;
    padding: 2px 6px;
    background: ${(props) => props.theme.colors.purple};
    color: white;
    border-radius: 3px;
`

const DomainPill = styled.div`
    display: flex;
    justify-content: center;
    padding: 2px 6px;
    border: 1px solid ${(props) => props.theme.colors.lightgrey};
    color: ${(props) => props.theme.colors.normalText};
    border-radius: 3px;
`

export interface FiltersBarProps {
    searchFilters: any
    isDisplayed: boolean
    showTagsFilter: boolean
    showDatesFilter: boolean
    areTagsFiltered: boolean
    showSpaceFilter: boolean
    areDatesFiltered: boolean
    areSpacesFiltered: boolean
    showDomainsFilter: boolean
    areDomainsFiltered: boolean
    toggleTagsFilter: () => void
    toggleDatesFilter: () => void
    toggleSpaceFilter: () => void
    toggleDomainsFilter: () => void
    tagPickerProps?: TagPickerDependencies
    datePickerProps: DateRangeSelectionProps
    spacePickerProps: SpacePickerDependencies
    domainPickerProps: DomainPickerDependencies
}

export default class FiltersBar extends PureComponent<FiltersBarProps> {
    private renderFilterSelectButton = (
        label: SearchFilterLabel,
        name: SearchFilterType,
        onToggle: React.MouseEventHandler,
        isShown: boolean,
        isFiltered: boolean,
        filterIcons: string,
        filterProps:
            | TagPickerDependencies
            | SpacePickerDependencies
            | DateRangeSelectionProps
            | DomainPickerDependencies,
    ) => (
        <Margin horizontal="7px" vertical="7px" width="auto">
            <FilterSelectButton
                selected={isShown}
                onClick={onToggle}
                className={`${name}-picker-button`}
                filterActive={isFiltered}
            >
                <Icon path={filterIcons} heightAndWidth="16px" hoverOff />
                {this.renderFilterInfo(filterProps, name, isFiltered, label)}
            </FilterSelectButton>
        </Margin>
    )

    private renderFilterInfo = (
        filterProps: any,
        name: string,
        isFiltered: boolean,
        label: string,
    ) => {
        if (name === 'date' && isFiltered) {
            var startDate = filterProps.startDateText

            if (filterProps.endDateText) {
                var endDate: string = filterProps.endDateText
            }

            if (!filterProps.endDateText && isFiltered) {
                var endDate = 'Now'
            }

            return (
                <>
                    {isFiltered && (
                        <>
                            {startDate && (
                                <>
                                    <strong>From</strong>
                                    {startDate}
                                </>
                            )}
                            {endDate && (
                                <>
                                    <strong>to</strong>
                                    {endDate}
                                </>
                            )}
                        </>
                    )}
                </>
            )
        }

        if (name === 'domain' && isFiltered) {
            var domainsIncluded = this.props.searchFilters.domainsIncluded

            return (
                <>
                    {isFiltered && (
                        <>
                            {domainsIncluded
                                .map((domain) => (
                                    <DomainPill>{domain}</DomainPill>
                                ))
                                .reverse()}
                        </>
                    )}
                </>
            )
        }

        if (name === 'tag' && isFiltered) {
            var tagsIncluded = this.props.searchFilters.tagsIncluded

            return (
                <>
                    {isFiltered && (
                        <>
                            {tagsIncluded
                                .map((tag) => <TagPill>{tag}</TagPill>)
                                .reverse()}
                        </>
                    )}
                </>
            )
        }

        return (
            <>
                <TextSpan>{label}</TextSpan>
            </>
        )
    }

    private renderDatePicker = () => {
        if (!this.props.showDatesFilter) {
            return false
        }

        return (
            <HoverBox
                padding={'0px'}
                position="absolute"
                top={'50px'}
                width="auto"
            >
                <DatePicker
                    {...this.props.datePickerProps}
                    outsideClickIgnoreClass="date-picker-button"
                />
            </HoverBox>
        )
    }

    private renderTagPicker = () => {
        if (!this.props.showTagsFilter) {
            return false
        }

        return (
            <HoverBox left="195px" position="absolute" top="50px">
                <TagPicker
                    {...this.props.tagPickerProps}
                    searchInputPlaceholder="Add tag filters"
                    removeToolTipText="Remove filter"
                    outsideClickIgnoreClass="tag-picker-button"
                    filterMode
                />
            </HoverBox>
        )
    }

    private renderSpacePicker = () => {
        if (!this.props.showSpaceFilter) {
            return false
        }

        return (
            <HoverBox left="195px" position="absolute" top="50px">
                <SpacePicker
                    {...this.props.spacePickerProps}
                    searchInputPlaceholder="Add Space filters"
                    removeTooltipText="Remove Space filter"
                    outsideClickIgnoreClass="space-picker-button"
                    filterMode
                />
            </HoverBox>
        )
    }

    private renderDomainPicker = () => {
        if (!this.props.showDomainsFilter) {
            return false
        }

        return (
            <HoverBox left="90px" position="absolute" top="50px">
                <DomainPicker
                    {...this.props.domainPickerProps}
                    searchInputPlaceholder="Add domain filters"
                    removeToolTipText="Remove filter"
                    outsideClickIgnoreClass="domain-picker-button"
                />
            </HoverBox>
        )
    }

    render() {
        return (
            <>
                <Container hidden={!this.props.isDisplayed}>
                    <FilterBtnsContainer>
                        {this.renderFilterSelectButton(
                            'Date',
                            'date',
                            this.props.toggleDatesFilter,
                            this.props.showDatesFilter,
                            this.props.areDatesFiltered,
                            icons.date,
                            this.props.datePickerProps,
                        )}
                        {this.renderDatePicker()}
                        {this.renderFilterSelectButton(
                            'Domains',
                            'domain',
                            this.props.toggleDomainsFilter,
                            this.props.showDomainsFilter,
                            this.props.areDomainsFiltered,
                            icons.globe,
                            this.props.domainPickerProps,
                        )}
                        {this.props.tagPickerProps && (
                            <>
                                {this.renderTagPicker()}
                                {this.renderFilterSelectButton(
                                    'Tags',
                                    'tag',
                                    this.props.toggleTagsFilter,
                                    this.props.showTagsFilter,
                                    this.props.areTagsFiltered,
                                    icons.tagEmpty,
                                    this.props.tagPickerProps,
                                )}
                            </>
                        )}
                        {this.renderSpacePicker()}
                        {this.renderFilterSelectButton(
                            'Spaces',
                            'space',
                            this.props.toggleSpaceFilter,
                            this.props.showSpaceFilter,
                            this.props.areSpacesFiltered,
                            this.props.areSpacesFiltered
                                ? icons.collectionsFull
                                : icons.collectionsEmpty,
                            this.props.spacePickerProps,
                        )}
                        {this.renderDomainPicker()}
                    </FilterBtnsContainer>
                </Container>
            </>
        )
    }
}
