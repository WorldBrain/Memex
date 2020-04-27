import React, { EventHandler, KeyboardEvent, KeyboardEventHandler } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    DisplayList,
    ListPickerDependencies,
    ListPickerEvent,
    ListPickerState,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import {
    KeyEvent,
    ListSearchInput,
} from 'src/custom-lists/ui/CollectionPicker/components/ListSearchInput'
import { ListSelectedList } from 'src/custom-lists/ui/CollectionPicker/components/ListSelectedList'
import ListResultsList from 'src/custom-lists/ui/CollectionPicker/components/ListResultsList'
import AddNewList, {
    AddNew,
} from 'src/custom-lists/ui/CollectionPicker/components/AddNewList'
import * as Colors from 'src/common-ui/components/design-library/colors'
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
            <ButtonTooltip tooltipText="List all tabs in window" position="left">
                <ListAllTabsButton
                    size={20}
                    onClick={this.handleNewListAllPress}
                />
            </ButtonTooltip>
        </IconStyleWrapper>
    )

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onKeyPress={this.handleKeyPress}
                    onClick={this.handleOuterSearchBoxClick}
                >
                    <ListSearchInput
                        searchInputRef={this.handleSetSearchInputRef}
                        onChange={this.handleSearchInputChanged}
                        onKeyPress={this.handleKeyPress}
                        value={this.state.query}
                        before={
                            <ListSelectedList
                                listsSelected={this.state.selectedLists}
                                onPress={this.handleSelectedListPress}
                            />
                        }
                        showPlaceholder={this.state.selectedLists.length === 0}
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

export default ListPicker
