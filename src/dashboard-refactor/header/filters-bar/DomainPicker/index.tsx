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
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow from 'src/common-ui/GenericPicker/components/EntryRow' // ActOnAllTabsButton, // IconStyleWrapper,
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import { EntrySelectedList } from './components/EntrySelectedList'
import { DomainResultItem } from './components/DomainResultItem'

class DomainPicker extends StatefulUIElement<
    DomainPickerDependencies,
    DomainPickerState,
    DomainPickerEvent
> {
    constructor(props: DomainPickerDependencies) {
        super(props, new DomainPickerLogic(props))
    }

    searchInputPlaceholder =
        this.props.searchInputPlaceholder || 'Domains to Search'
    removeToolTipText = this.props.removeToolTipText || 'Remove filter'

    componentDidUpdate(prevProps, prevState) {
        const {
            props: { query, onSelectedEntriesChange },
            state: { selectedEntries },
        } = this
        if (prevProps.query !== query) {
            this.processEvent('searchInputChanged', { query })
        }
        const a = prevState.selectedEntries
        const b = selectedEntries
        if (a.length !== b.length || !isEqual(a, b)) {
            onSelectedEntriesChange({ selectedEntries })
        }
    }

    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e) // this is defined as type react.MouseEventHandler for the collection picker but as a standard function with no params or return for the tag picker
        }
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })

    handleOuterSearchBoxClick: React.MouseEventHandler = () =>
        this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) => {
        this.props.onSearchInputChange({ query })
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedDomainPress = (domain: string) =>
        this.processEvent('selectedEntryPress', { entry: domain })

    handleResultDomainPress = (domain: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: domain })

    handleResultDomainFocus = (domain: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: domain, index })

    handleNewDomainPress = () =>
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderDomainRow = (domain: DisplayEntry, index: number) => (
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
    renderEmptyDomain() {
        if (this.state.newEntryName !== '') {
            return
        }

        return (
            <EmptyDomainsView>
                <strong>No Collections yet</strong>
                <br />
                Add new collections
                <br />
                via the search bar
            </EmptyDomainsView>
        )
    }

    renderMainContent() {
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
                            entriesSelected={this.state.selectedEntries}
                            onPress={this.handleSelectedDomainPress}
                        />
                    }
                />
                {this.state.newEntryName !== '' && (
                    <AddNewEntry
                        resultItem={
                            <DomainResultItem>
                                {this.state.newEntryName}
                            </DomainResultItem>
                        }
                        onPress={this.handleNewDomainPress}
                    >
                        {/* {this.renderNewDomainAllTabsButton()} */}
                    </AddNewEntry>
                )}
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

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

const OuterSearchBox = styled.div`
    background: ${(props) => props.theme.background};
    padding-top: 8px;
    padding-bottom: 8px;
    border-radius: 3px;
`

const EmptyDomainsView = styled.div`
    color: ${(props) => props.theme.tag.text};
    padding: 10px 15px;
    font-weight: 400;
    font-size: ${fontSizeNormal}px;
    text-align: center;
`

export default onClickOutside(DomainPicker)
