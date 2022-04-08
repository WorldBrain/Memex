import React from 'react'
import onClickOutside from 'react-onclickoutside'
import isEqual from 'lodash/isEqual'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import DomainPickerLogic, {
    DomainPickerDependencies,
    DomainPickerEvent,
    DomainPickerState,
} from './logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow from 'src/common-ui/GenericPicker/components/EntryRow' // ActOnAllTabsButton, // IconStyleWrapper,
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { EntrySelectedList } from 'src/common-ui/GenericPicker/components/EntrySelectedList'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

class DomainPicker extends StatefulUIElement<
    DomainPickerDependencies,
    DomainPickerState,
    DomainPickerEvent
> {
    constructor(props: DomainPickerDependencies) {
        super(props, new DomainPickerLogic(props))
    }

    private get selectedDisplayEntries(): string[] {
        return this.state.selectedEntries
            .map(
                (_entry) =>
                    this.state.displayEntries.find(
                        (entry) => entry.name === _entry,
                    )?.name,
            )
            .filter((entry) => entry != null)
    }

    searchInputPlaceholder =
        this.props.searchInputPlaceholder ?? 'Domains to Search'
    removeToolTipText = this.props.removeToolTipText ?? 'Remove filter'

    componentDidUpdate(
        prevProps: DomainPickerDependencies,
        prevState: DomainPickerState,
    ) {
        if (prevProps.query !== this.props.query) {
            this.processEvent('searchInputChanged', { query: this.props.query })
        }

        const prev = prevState.selectedEntries
        const curr = this.state.selectedEntries

        if (prev.length !== curr.length || !isEqual(prev, curr)) {
            this.props.onSelectedEntriesChange?.({
                selectedEntries: this.state.selectedEntries,
            })
        }
    }

    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    private handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })

    private handleOuterSearchBoxClick: React.MouseEventHandler = () =>
        this.processEvent('focusInput', {})

    private handleSearchInputChanged = (query: string) => {
        this.props.onSearchInputChange?.({ query })
        return this.processEvent('searchInputChanged', { query })
    }

    private handleSelectedDomainPress = (domain: string) =>
        this.processEvent('selectedEntryPress', { entry: domain })

    private handleResultDomainPress = (domain: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: domain })

    private handleResultDomainFocus = (domain: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: domain, index })

    private handleKeyPress = (key: KeyEvent) =>
        this.processEvent('keyPress', { key })

    private renderDomainRow = (domain: DisplayEntry, index: number) => (
        <EntryRow
            onPress={this.handleResultDomainPress}
            onFocus={this.handleResultDomainFocus}
            key={`DomainKeyName-${domain.name}`}
            index={index}
            name={domain.name}
            selected={domain.selected}
            focused={domain.focused}
            resultItem={<DomainResultItem>{domain.name}</DomainResultItem>}
            removeTooltipText="Remove filter"
        />
    )

    private renderEmptyDomain() {
        if (this.state.query === '') {
            return (
                <EmptyDomainsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.globe}
                            heightAndWidth="16px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>No Domains to filter</SectionTitle>
                    <InfoText>Save your first page or annotation</InfoText>
                </EmptyDomainsView>
            )
        }

        return (
            <EmptyDomainsView>
                <SectionCircle>
                    <Icon
                        filePath={icons.globe}
                        heightAndWidth="16px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                <SectionTitle>No domains found for query</SectionTitle>
            </EmptyDomainsView>
        )
    }

    private renderMainContent() {
        if (this.state.loadingSuggestions) {
            return (
                <LoadingBox>
                    <LoadingIndicator />
                </LoadingBox>
            )
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder={this.searchInputPlaceholder}
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    searchInputRef={this.handleSetSearchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults}
                    before={
                        <EntrySelectedList
                            dataAttributeName="domain-name"
                            entriesSelected={this.selectedDisplayEntries}
                            onPress={this.handleSelectedDomainPress}
                        />
                    }
                />
                <EntryResultsList
                    entries={this.state.displayEntries}
                    renderEntryRow={this.renderDomainRow}
                    emptyView={this.renderEmptyDomain()}
                    id="domainResults"
                />
            </>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    {this.renderMainContent()}
                    {this.props.children}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: bold;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    font-weight: 400;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

const OuterSearchBox = styled.div`
    background: ${(props) => props.theme.background};
    border-radius: 12px;
`

const EmptyDomainsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

const DomainResultItem = styled.div`
    display: flex;
    border-radius: 4px;
    color: ${(props) => props.theme.colors.normalText};
    padding: 0 8px;
    margin: 2px 4px 2px 0;
    font-weight: 400;
    font-size: 14px;
    transition: all 0.1s;
    word-break: break-word;

    &:hover {
        cursor: pointer;
    }
`

export default onClickOutside(DomainPicker)
