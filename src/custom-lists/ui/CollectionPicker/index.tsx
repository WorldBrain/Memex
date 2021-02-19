import React from 'react'
import onClickOutside from 'react-onclickoutside'
import isEqual from 'lodash/isEqual'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    ListPickerDependencies,
    ListPickerEvent,
    ListPickerState,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { EntrySelectedList } from './components/EntrySelectedList'
import { ListResultItem } from './components/ListResultItem'
import { collections } from 'src/util/remote-functions-background'

class ListPicker extends StatefulUIElement<
    ListPickerDependencies,
    ListPickerState,
    ListPickerEvent
> {
    static defaultProps: Partial<ListPickerDependencies> = {
        queryEntries: (query) =>
            collections.searchForListSuggestions({ query }),
        loadDefaultSuggestions: collections.fetchInitialListSuggestions,
    }

    constructor(props: ListPickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    searchInputPlaceholder =
        this.props.searchInputPlaceholder ?? 'Add to Collection'
    removeToolTipText = this.props.removeToolTipText ?? 'Remove from list'

    componentDidUpdate(
        prevProps: ListPickerDependencies,
        prevState: ListPickerState,
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

    handleClickOutside = () => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside()
        }
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) => {
        this.props.onSearchInputChange?.({ query })
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedListPress = (list: string) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: list })

    handleResultListAllPress = (list: DisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: list })

    handleNewListAllPress = () =>
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })

    handleResultListFocus = (list: DisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: list, index })

    handleNewListPress = () =>
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderListRow = (list: DisplayEntry, index: number) => (
        <EntryRow
            onPress={this.handleResultListPress}
            onPressActOnAll={
                this.props.actOnAllTabs
                    ? (t) => this.handleResultListAllPress(t)
                    : undefined
            }
            onFocus={this.handleResultListFocus}
            key={`ListKeyName-${list.name}`}
            index={index}
            name={list.name}
            selected={list.selected}
            focused={list.focused}
            resultItem={<ListResultItem>{list.name}</ListResultItem>}
            removeTooltipText={this.removeToolTipText}
            actOnAllTooltipText="Add all tabs in window to list"
        />
    )

    renderNewListAllTabsButton = () =>
        this.props.actOnAllTabs && (
            <IconStyleWrapper show>
                <ButtonTooltip
                    tooltipText="List all tabs in window"
                    position="left"
                >
                    <ActOnAllTabsButton
                        size={20}
                        onClick={this.handleNewListAllPress}
                    />
                </ButtonTooltip>
            </IconStyleWrapper>
        )

    renderEmptyList() {
        if (this.state.newEntryName !== '') {
            return
        }

        return (
            <EmptyListsView>
                <strong>No Collections yet</strong>
                <br />
                Add new collections
                <br />
                via the search bar
            </EmptyListsView>
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
                            dataAttributeName="list-name"
                            entriesSelected={this.state.selectedEntries}
                            onPress={this.handleSelectedListPress}
                        />
                    }
                />
                <EntryResultsList
                    entries={this.state.displayEntries}
                    renderEntryRow={this.renderListRow}
                    emptyView={this.renderEmptyList()}
                    id="listResults"
                />
                {this.state.newEntryName !== '' && (
                    <AddNewEntry
                        resultItem={
                            <ListResultItem>
                                {this.state.newEntryName}
                            </ListResultItem>
                        }
                        onPress={this.handleNewListPress}
                    >
                        {this.renderNewListAllTabsButton()}
                    </AddNewEntry>
                )}
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

const EmptyListsView = styled.div`
    color: ${(props) => props.theme.tag.text};
    padding: 10px 15px;
    font-weight: 400;
    font-size: ${fontSizeNormal}px;
    text-align: center;
`

export default onClickOutside(ListPicker)
