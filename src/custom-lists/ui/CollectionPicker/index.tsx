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
import { KeyEvent } from 'src/common-ui/GenericPicker/types'
import { ListSelectedList } from 'src/custom-lists/ui/CollectionPicker/components/ListSelectedList'
import ListResultsList from 'src/custom-lists/ui/CollectionPicker/components/ListResultsList'
import AddNewList from 'src/custom-lists/ui/CollectionPicker/components/AddNewList'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import ListRowItem, {
    IconStyleWrapper,
    ListAllTabsButton,
} from 'src/custom-lists/ui/CollectionPicker/components/ListRow'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

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
        <ListRowItem
            onPress={this.handleResultListPress}
            onPressListAll={
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
        />
    )

    renderNewListAllTabsButton = () => (
        <IconStyleWrapper show>
            <ButtonTooltip
                tooltipText="List all tabs in window"
                position="left"
            >
                <ListAllTabsButton
                    size={20}
                    onClick={this.handleNewListAllPress}
                />
            </ButtonTooltip>
        </IconStyleWrapper>
    )

    renderEmptyList() {
        return <EmptyListsView>No collections exist yet</EmptyListsView>
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
                            <ListSelectedList
                                listsSelected={this.state.selectedLists}
                                onPress={this.handleSelectedListPress}
                            />
                        }
                    />
                    {this.state.newListName !== '' && (
                        <AddNewList
                            list={this.state.newListName}
                            onPress={this.handleNewListPress}
                        >
                            {this.renderNewListAllTabsButton}
                        </AddNewList>
                    )}
                    <ListResultsList
                        lists={this.state.displayLists}
                        renderListRow={this.renderListRow}
                        emptyView={this.renderEmptyList()}
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
    padding: 20px 15px;
    font-weight: 400;
    font-size: ${fontSizeNormal}px;
`

export default ListPicker
