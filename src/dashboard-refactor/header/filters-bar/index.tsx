import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import { remoteFunction } from 'src/util/webextensionRPC'

import TagPickerUnstyled from 'src/tags/ui/TagPicker'
import Margin from 'src/dashboard-refactor/components/Margin'
import DomainPickerUnstyled from './DomainPicker/'

import { SelectedState } from '../../types'
import DatePicker, {
    DateRangeSelectionProps,
} from 'src/overview/search-bar/components/DateRangeSelection'
import { FilterPickerProps } from './types'
import { SearchFilterLabel, SearchFilterType } from '../types'

const windowWidth: number = window.innerWidth
const searchBarWidthPx: number = sizeConstants.searchBar.widthPx
const innerContainerIndent: number = (windowWidth - searchBarWidthPx) / 2

const Container = styled.div<{ hidden: boolean }>`
    height: 30px;
    width: 100%;
    border-bottom: 1px solid ${colors.lighterGrey};
    ${(props) =>
        css`
            display: ${props.hidden ? 'none' : 'flex'};
        `};
`

const InnerContainer = styled.div`
    width: ${searchBarWidthPx}px;
    position: absolute;
    left: ${innerContainerIndent}px;
    display: flex;
    align-items: center;
    justify-content: start;
`

const PickersContainer = styled(InnerContainer)`
    position: relative;
    bottom: 0;
`

const FilterSelectButton = styled.div<{ selected: boolean }>`
    height: 16px;
    width: min-content;
    display: flex;
    align-items: center;
    ${(props) => css`
        background-color: ${props.selected ? colors.lightGrey : colors.white};
    `}
    border: 1px solid ${colors.lightGrey};
    border-radius: ${styles.borderRadius.medium};
`

const TextSpan = styled.span`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 10px;
    line-height: 15px;
`

const TagPicker = styled(TagPickerUnstyled)`
    width: 200px;
`

const DomainPicker = styled(DomainPickerUnstyled)`
    width: 200px;
`

export interface FiltersBarProps {
    isDisplayed: boolean
    dateFilterSelectedState: SelectedState
    domainFilterSelectedState: SelectedState
    tagFilterSelectedState: SelectedState
    pickerProps: {
        datePickerProps?: DateRangeSelectionProps
        tagPickerProps?: FilterPickerProps
        domainPickerProps?: FilterPickerProps
    }
}

export default class FiltersBar extends PureComponent<FiltersBarProps> {
    private queryDomains: (query: string) => Promise<string[]> = async (
        query,
    ) => {
        const domainList: string[] = await this.getSuggestedDomains()
        const filteredDomains: string[] = domainList.filter((domain) =>
            domain.startsWith(query),
        )
        return filteredDomains
    }

    private getSuggestedDomains = async (): Promise<string[]> => {
        const suggestedDomains: Promise<string[]> = await remoteFunction(
            'extendedSuggest',
        )({
            // notInclude: domains,
            type: 'domain',
        })
        return suggestedDomains
    }

    private renderFilterSelectButton = (
        label: SearchFilterLabel,
        selectedState: SelectedState,
        name: SearchFilterType,
    ): JSX.Element => {
        const { isSelected, onSelection } = selectedState
        return (
            <Margin horizontal="7px" vertical="7px">
                <FilterSelectButton
                    selected={isSelected}
                    onClick={onSelection}
                    className={`${name}-picker-button`}
                >
                    <Margin horizontal="7px">
                        <TextSpan>{label}</TextSpan>
                    </Margin>
                </FilterSelectButton>
            </Margin>
        )
    }

    private renderDatePicker = () => {
        return <DatePicker {...this.props.pickerProps.datePickerProps} />
    }

    private renderTagPicker = () => {
        const { tagPickerProps } = this.props.pickerProps
        return (
            <TagPicker
                initialSelectedEntries={async () =>
                    tagPickerProps.initialSelectedEntries
                }
                onUpdateEntrySelection={tagPickerProps.onUpdateEntrySelection}
                onEscapeKeyDown={() =>
                    tagPickerProps.onToggleShowPicker(null, false)
                }
                onClickOutside={(e) =>
                    tagPickerProps.onToggleShowPicker(null, false)
                }
                searchInputPlaceholder="Add Tag Filters"
                removeToolTipText="Remove filter"
                preventDefault={true}
                outsideClickIgnoreClass="tag-picker-button"
            />
        )
    }

    private renderDomainPicker = () => {
        const { domainPickerProps } = this.props.pickerProps
        return (
            <DomainPicker
                initialSelectedEntries={async () =>
                    domainPickerProps.initialSelectedEntries
                }
                onUpdateEntrySelection={
                    domainPickerProps.onUpdateEntrySelection
                }
                onEscapeKeyDown={() =>
                    domainPickerProps.onToggleShowPicker(null, false)
                }
                onClickOutside={(e) => {
                    console.log('domain picker click outside')
                    domainPickerProps.onToggleShowPicker(null, false)
                }}
                searchInputPlaceholder="Add Domain Filters"
                removeToolTipText="Remove filter"
                queryEntries={this.queryDomains}
                loadDefaultSuggestions={this.getSuggestedDomains}
                outsideClickIgnoreClass="domain-picker-button"
            />
        )
    }

    render() {
        const {
            isDisplayed,
            dateFilterSelectedState,
            tagFilterSelectedState,
            domainFilterSelectedState,
        } = this.props

        return (
            <>
                <Container hidden={!isDisplayed}>
                    <InnerContainer>
                        {this.renderFilterSelectButton(
                            'Date',
                            dateFilterSelectedState,
                            'date',
                        )}
                        {this.renderFilterSelectButton(
                            'Domains',
                            domainFilterSelectedState,
                            'domain',
                        )}
                        {this.renderFilterSelectButton(
                            'Tags',
                            tagFilterSelectedState,
                            'tag',
                        )}
                    </InnerContainer>
                </Container>
                <PickersContainer>
                    <Margin horizontal="7px">
                        {dateFilterSelectedState.isSelected &&
                            this.renderDatePicker()}
                        {tagFilterSelectedState.isSelected &&
                            this.renderTagPicker()}
                        {domainFilterSelectedState.isSelected &&
                            this.renderDomainPicker()}
                    </Margin>
                </PickersContainer>
            </>
        )
    }
}
