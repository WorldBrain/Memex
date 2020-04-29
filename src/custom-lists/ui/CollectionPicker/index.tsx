import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    DisplayList,
    ListPickerDependencies,
    ListPickerEvent,
    ListPickerState,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from 'src/common-ui/GenericPicker/components/SearchInput'
import AddNewEntry from 'src/common-ui/GenericPicker/components/AddNewEntry'
import EntryResultsList from 'src/common-ui/GenericPicker/components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from 'src/common-ui/GenericPicker/components/EntryRow'
import { EntrySelectedList } from 'src/common-ui/GenericPicker/components/EntrySelectedList'
import { KeyEvent } from 'src/common-ui/GenericPicker/types'
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
        this.processEvent('selectedListPress', { list })

    handleResultListPress = (list: DisplayList) =>
        this.processEvent('resultListPress', { list })

    handleResultListAllPress = (list: DisplayList) =>
        this.processEvent('resultListAllPress', { list })

    handleNewListAllPress = () => this.processEvent('newListAllPress', {})

    handleResultListFocus = (list: DisplayList, index?: number) =>
        this.processEvent('resultListFocus', { list, index })

    handleNewListPress = () =>
        this.processEvent('newListPress', { list: this.state.newListName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderListRow = (list: DisplayList, index: number) => (
        <EntryRow
            onPress={this.handleResultListPress}
            onPressActOnAll={
                this.props.listAllTabs
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
       if (this.state.newListName !== '') {
            return
        }

        if (!this.state.newListName) {
            return <EmptyListsView><strong>No Collections yet</strong> <br/>Add new collections via the search bar</EmptyListsView>
        }
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    <PickerSearchInput
                        showPlaceholder={this.state.selectedLists.length === 0}
                        searchInputRef={this.handleSetSearchInputRef}
                        onChange={this.handleSearchInputChanged}
                        onKeyPress={this.handleKeyPress}
                        value={this.state.query}
                        loading={
                            this.state.loadingSuggestions ||
                            this.state.loadingQueryResults
                        }
                        before={
                            <EntrySelectedList
                                ActiveEntry={ActiveList}
                                attributeName="data-list-name"
                                entriesSelected={this.state.selectedLists}
                                onPress={this.handleSelectedListPress}
                            />
                        }
                    />
                    {this.state.newListName !== '' && (
                        <AddNewEntry
                            resultItem={
                                <ListResultItem>
                                    {this.state.newListName}
                                </ListResultItem>
                            }
                            onPress={this.handleNewListPress}
                        >
                            {this.renderNewListAllTabsButton}
                        </AddNewEntry>
                    )}
                    <EntryResultsList
                        entries={this.state.displayLists}
                        renderEntryRow={this.renderListRow}
                        emptyView={this.renderEmptyList()}
                        id="listResults"
                    />
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
