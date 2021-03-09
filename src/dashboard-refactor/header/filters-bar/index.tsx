import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import styles, { fonts } from 'src/dashboard-refactor/styles'

import TagPicker from 'src/tags/ui/TagPicker'
import Margin from 'src/dashboard-refactor/components/Margin'
import DomainPicker from './DomainPicker/'
import DatePicker, {
    DateRangeSelectionProps,
} from 'src/overview/search-bar/components/DateRangeSelection'
import { SearchFilterLabel, SearchFilterType } from '../types'
import { DomainPickerDependencies } from './DomainPicker/logic'
import { TagPickerDependencies } from 'src/tags/ui/TagPicker/logic'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

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
    font-size: 12px;
    line-height: 15px;
`

export interface FiltersBarProps {
    isDisplayed: boolean
    showTagsFilter: boolean
    showDatesFilter: boolean
    showDomainsFilter: boolean
    toggleTagsFilter: () => void
    toggleDatesFilter: () => void
    toggleDomainsFilter: () => void
    tagPickerProps: TagPickerDependencies
    datePickerProps: DateRangeSelectionProps
    domainPickerProps: DomainPickerDependencies
}

export default class FiltersBar extends PureComponent<FiltersBarProps> {
    private renderFilterSelectButton = (
        label: SearchFilterLabel,
        name: SearchFilterType,
        selected: boolean,
        onToggle: () => void,
    ): JSX.Element => {
        return (
            <Margin horizontal="7px" vertical="7px">
                <FilterSelectButton
                    selected={selected}
                    onClick={onToggle}
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
        if (!this.props.showDatesFilter) {
            return false
        }

        return (
            <HoverBox width="auto" top="0" left="0">
                <DatePicker {...this.props.datePickerProps} />
            </HoverBox>
        )
    }

    private renderTagPicker = () => {
        if (!this.props.showTagsFilter) {
            return false
        }

        return (
            <HoverBox top="0" right="0">
                <TagPicker
                    {...this.props.tagPickerProps}
                    searchInputPlaceholder="Add Tag Filters"
                    removeToolTipText="Remove filter"
                    outsideClickIgnoreClass="tag-picker-button"
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
            <HoverBox top="0">
                <DomainPicker
                    {...this.props.domainPickerProps}
                    searchInputPlaceholder="Add Domain Filters"
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
                    <InnerContainer>
                        {this.renderFilterSelectButton(
                            'Date',
                            'date',
                            this.props.showDatesFilter,
                            this.props.toggleDatesFilter,
                        )}
                        {this.renderFilterSelectButton(
                            'Domains',
                            'domain',
                            this.props.showDomainsFilter,
                            this.props.toggleDomainsFilter,
                        )}
                        {this.renderFilterSelectButton(
                            'Tags',
                            'tag',
                            this.props.showTagsFilter,
                            this.props.toggleTagsFilter,
                        )}
                    </InnerContainer>
                </Container>
                <PickersContainer>
                    <Margin horizontal="7px">
                        {this.renderDatePicker()}
                        {this.renderTagPicker()}
                        {this.renderDomainPicker()}
                    </Margin>
                </PickersContainer>
            </>
        )
    }
}
