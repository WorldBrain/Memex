import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    ListPickerDependencies,
    ListPickerEvent,
    ListPickerState,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import { InitLoader } from 'src/common-ui/GenericPicker/components/InitLoader'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { EntrySelectedList } from 'src/common-ui/GenericPicker/components/EntrySelectedList'
import { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { ListResultItem } from './components/ListResultItem'
import { ActiveList } from './components/ActiveList'
import { LoadingIndicator } from 'src/common-ui/components'

class ListPicker extends StatefulUIElement<
    ListPickerDependencies,
    ListPickerState,
    ListPickerEvent
> {
    constructor(props: ListPickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) => {
        return this.processEvent('searchInputChanged', { query })
    }

    handleSelectedListPress = (list: string) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: DisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: list })

    handleResultListAllPress = (list: DisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: list })

    handleNewListAllPress = () => this.processEvent('newEntryAllPress', {})

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
            ResultItem={ListResultItem}
            removeTooltipText="Remove from list"
            actOnAllTooltipText="Add all tabs in window to list"
        />
    )

    renderNewListAllTabsButton = () => (
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
            return <InitLoader size={20} />
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder="Add to collection"
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    searchInputRef={this.handleSetSearchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults}
                    before={
                        <EntrySelectedList
                            ActiveEntry={ActiveList}
                            dataAttributeName="list-name"
                            entriesSelected={this.state.selectedEntries}
                            onPress={this.handleSelectedListPress}
                        />
                    }
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
                        {this.renderNewListAllTabsButton}
                    </AddNewEntry>
                )}
                <EntryResultsList
                    entries={this.state.displayEntries}
                    renderEntryRow={this.renderListRow}
                    emptyView={this.renderEmptyList()}
                    id="listResults"
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

export default ListPicker
