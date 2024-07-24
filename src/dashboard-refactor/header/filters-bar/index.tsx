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
import { Icon } from 'src/dashboard-refactor/styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/types'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

const windowWidth: number = window.innerWidth
const searchBarWidthPx: number = sizeConstants.searchBar.widthPx

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
    spacePickerFilterProps: SpacePickerDependencies
    domainPickerProps: DomainPickerDependencies
    spaceSidebarLocked: boolean
    getRootElement: () => HTMLElement
}

export default class FiltersBar extends PureComponent<FiltersBarProps> {
    spaceFilterButtonRef = React.createRef<HTMLDivElement>()
    dateFilterButtonRef = React.createRef<HTMLDivElement>()
    domainFilterButtonRef = React.createRef<HTMLDivElement>()

    private renderFilterSelectButton = (
        label: SearchFilterLabel,
        name: SearchFilterType,
        onToggle: React.MouseEventHandler,
        isShown: boolean,
        isFiltered: boolean,
        filterIcons: IconKeys,
        filterProps:
            | TagPickerDependencies
            | SpacePickerDependencies
            | DateRangeSelectionProps
            | DomainPickerDependencies,
        componentRef: React.RefObject<HTMLDivElement>,
    ) => (
        <Margin vertical="7px" width="auto">
            <PrimaryAction
                active={isShown || isFiltered}
                onClick={onToggle}
                innerRef={componentRef}
                icon={filterIcons}
                type={'forth'}
                size={'medium'}
                label={this.renderFilterInfo(
                    filterProps,
                    name,
                    isFiltered,
                    label,
                )}
                fontColor={'greyScale6'}
                iconColor={'greyScale6'}
            />
        </Margin>
    )

    private renderFilterInfo = (
        filterProps: any,
        name: string,
        isFiltered: boolean,
        label: string,
    ) => {
        if (name === 'date' && isFiltered) {
            let startDateText: string
            let endDateText: string

            if (!filterProps.startDate) {
                startDateText = undefined
                if (!filterProps.startDateText && isFiltered) {
                    startDateText = 'Forever'
                }
            } else {
                startDateText = filterProps.startDateText
            }
            if (!filterProps.endDate) {
                endDateText = undefined
                if (!filterProps.endDateText && isFiltered) {
                    endDateText = 'Now'
                }
            } else {
                endDateText = filterProps.endDateText
            }

            return (
                <>
                    {isFiltered && (
                        <>
                            {startDateText && (
                                <>
                                    <DateHelp>From</DateHelp>
                                    <DateText>{startDateText}</DateText>
                                </>
                            )}
                            {endDateText && (
                                <>
                                    <DateHelp>to</DateHelp>
                                    <DateText>{endDateText}</DateText>
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
                        <DomainScroll>
                            {domainsIncluded
                                .map((domain) => (
                                    <DomainPill>{domain}</DomainPill>
                                ))
                                .reverse()}
                        </DomainScroll>
                    )}
                </>
            )
        }

        if (name === 'space' && isFiltered) {
            var spacesIncluded = this.props.searchFilters.spacesIncluded

            return (
                <>
                    {isFiltered && (
                        <>
                            Spaces{' '}
                            <CounterPill>{spacesIncluded.length}</CounterPill>
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
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.dateFilterButtonRef.current}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={this.props.toggleDatesFilter}
                getPortalRoot={this.props.getRootElement}
            >
                <DatePicker
                    {...this.props.datePickerProps}
                    onClickOutside={this.props.toggleDatesFilter}
                />
            </PopoutBox>
        )
    }

    private renderSpacePicker = () => {
        if (!this.props.showSpaceFilter) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spaceFilterButtonRef.current}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={this.props.toggleSpaceFilter}
                getPortalRoot={this.props.getRootElement}
            >
                <SpacePicker
                    {...this.props.spacePickerFilterProps}
                    searchInputPlaceholder="Add Space filters"
                    filterMode
                    closePicker={this.props.toggleSpaceFilter}
                />
            </PopoutBox>
        )
    }

    private renderDomainPicker = () => {
        if (!this.props.showDomainsFilter) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.domainFilterButtonRef.current}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={this.props.toggleDomainsFilter}
                getPortalRoot={this.props.getRootElement}
            >
                <DomainPicker
                    {...this.props.domainPickerProps}
                    searchInputPlaceholder="Add a domain filters"
                    removeToolTipText="Remove filter"
                    onClickOutside={this.props.toggleDomainsFilter}
                    closePicker={this.props.toggleDomainsFilter}
                />
            </PopoutBox>
        )
    }

    render() {
        return (
            <>
                <Container hidden={!this.props.isDisplayed}>
                    <FilterBtnsContainer
                        spaceSidebarLocked={this.props.spaceSidebarLocked}
                    >
                        {this.renderFilterSelectButton(
                            'Date',
                            'date',
                            this.props.toggleDatesFilter,
                            this.props.showDatesFilter,
                            this.props.areDatesFiltered,
                            'calendar',
                            this.props.datePickerProps,
                            this.dateFilterButtonRef,
                        )}

                        {this.renderFilterSelectButton(
                            'Domains',
                            'domain',
                            this.props.toggleDomainsFilter,
                            this.props.showDomainsFilter,
                            this.props.areDomainsFiltered,
                            'globe',
                            this.props.domainPickerProps,
                            this.domainFilterButtonRef,
                        )}
                        {this.renderFilterSelectButton(
                            'Spaces',
                            'space',
                            this.props.toggleSpaceFilter,
                            this.props.showSpaceFilter,
                            this.props.areSpacesFiltered,
                            this.props.areSpacesFiltered
                                ? 'collectionsFull'
                                : 'collectionsEmpty',
                            this.props.spacePickerFilterProps,
                            this.spaceFilterButtonRef,
                        )}
                    </FilterBtnsContainer>
                    {this.renderDomainPicker()}
                    {this.renderSpacePicker()}
                    {this.renderDatePicker()}
                </Container>
            </>
        )
    }
}

const DateHelp = styled.div`
    color: ${(props) => props.theme.colors.darkText};
`

const DateText = styled.div`
    color: ${(props) => props.theme.colors.white};
`

const Container = styled.div<{ hidden: boolean }>`
    height: fit-content;
    width: fill-available;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    justify-content: center;
    position: sticky;
    top: 60px;
    background: ${(props) => props.theme.colors.black};
    z-index: 29;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};

    ${(props) =>
        css`
            display: ${props.hidden ? 'none' : 'flex'};
        `};
`

const FilterBtnsContainer = styled.div<{ spaceSidebarLocked }>`
    max-width: 800px;
    flex: 1;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 7px;

    @media screen and (max-width: 900px) {
        margin-left: ${(props) => props.spaceSidebarLocked && '24px'};
    }
`

const PickersContainer = styled.div`
    position: relative;
    top: 30px;
`

const DomainScroll = styled.div`
    overflow: scroll;
    white-space: nowrap;
    display: flex;
    align-items: center;
    width: 200px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const FilterSelectButton = styled.div<{ filterActive: boolean }>`
    width: fit-content;
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: column;
    align-items: center;
    padding: 3px 12px;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 8px;
    white-space: nowrap;
    max-width: fit-content;
    font-size: 13px;
    color: ${(props) => props.theme.colors.white};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale3};
    }

    ${(props) =>
        props.filterActive &&
        css`
            background: ${(props) => props.theme.colors.greyScale3};
        `}

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    cursor: pointer;
    height: 30px;
`

const TextSpan = styled.span`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    line-height: 15px;
`

const CounterPill = styled.div`
    background: ${(props) => props.theme.colors.prime1};
    color: ${(props) => props.theme.colors.black};
    border-radius: 3px;
    height: 20px;
    padding: 0 5px;
    width: fit-content;
    margin-left: 5px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
`

const TagPill = styled.div`
    display: flex;
    justify-content: center;
    padding: 2px 6px;
    background: ${(props) => props.theme.colors.prime1};
    color: white;
    border-radius: 3px;
`

const DomainPill = styled.div`
    display: flex;
    justify-content: center;
    padding: 2px 6px;
    color: ${(props) => props.theme.colors.white};
    border-radius: 3px;
`
