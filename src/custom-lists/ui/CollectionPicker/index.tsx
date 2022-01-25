import React from 'react'
import onClickOutside from 'react-onclickoutside'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    SpacePickerDependencies,
    SpacePickerEvent,
    SpacePickerState,
    SpaceDisplayEntry,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from './components/SearchInput'
import AddNewEntry from './components/AddNewEntry'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import EntryResultsList from './components/EntryResultsList'
import EntryRow, {
    IconStyleWrapper,
    ActOnAllTabsButton,
} from './components/EntryRow'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { fontSizeNormal } from 'src/common-ui/components/design-library/typography'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { EntrySelectedList } from './components/EntrySelectedList'
import { ListResultItem } from './components/ListResultItem'
import {
    collections,
    contentSharing,
} from 'src/util/remote-functions-background'

class SpacePicker extends StatefulUIElement<
    SpacePickerDependencies,
    SpacePickerState,
    SpacePickerEvent
> {
    static defaultProps: Pick<
        SpacePickerDependencies,
        'queryEntries' | 'loadDefaultSuggestions' | 'createNewEntry'
    > = {
        queryEntries: async (query) => {
            const suggestions = await collections.searchForListSuggestions({
                query,
            })
            const remoteListIds = await contentSharing.getRemoteListIds({
                localListIds: suggestions.map((s) => s.id),
            })
            return suggestions.map((s) => ({
                localId: s.id,
                name: s.name,
                createdAt: s.createdAt.getTime(),
                focused: false,
                remoteId: remoteListIds[s.id] ?? null,
            }))
        },
        loadDefaultSuggestions: async () => {
            const suggestions = await collections.fetchInitialListSuggestions()
            const remoteListIds = await contentSharing.getRemoteListIds({
                localListIds: suggestions.map((s) => s.localId as number),
            })
            return suggestions.map((s) => ({
                ...s,
                remoteId: remoteListIds[s.localId] ?? null,
            }))
        },
        createNewEntry: async (name) =>
            collections.createCustomList({
                name,
            }),
    }

    constructor(props: SpacePickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    private get selectedDisplayEntries(): string[] {
        return this.state.selectedEntries
            .map(
                (entryId) =>
                    this.state.displayEntries.find(
                        (entry) => entry.localId === entryId,
                    )?.name,
            )
            .filter((entry) => entry != null)
    }

    handleClickOutside = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    handleSelectedListPress = (list: string) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: SpaceDisplayEntry) =>
        this.processEvent('resultEntryPress', { entry: list })

    handleResultListAllPress = (list: SpaceDisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: list })

    handleNewListAllPress = () =>
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })

    handleResultListFocus = (list: SpaceDisplayEntry, index?: number) =>
        this.processEvent('resultEntryFocus', { entry: list, index })

    handleNewListPress = () =>
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })

    handleKeyPress = (key: KeyEvent) => this.processEvent('keyPress', { key })

    renderListRow = (list: SpaceDisplayEntry, index: number) => (
        <EntryRow
            createdAt={list.createdAt}
            onPress={this.handleResultListPress}
            onPressActOnAll={
                this.props.actOnAllTabs
                    ? (t) =>
                          this.handleResultListAllPress(t as SpaceDisplayEntry)
                    : undefined
            }
            onFocus={this.handleResultListFocus}
            key={`ListKeyName-${list.name}`}
            index={index}
            name={list.name}
            selected={this.state.selectedEntries.includes(list.localId)}
            localId={list.localId}
            focused={list.focused}
            remoteId={list.remoteId}
            resultItem={<ListResultItem>{list.name}</ListResultItem>}
            removeTooltipText="Remove from Space"
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
                    searchInputPlaceholder="Add to Space"
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    searchInputRef={this.handleSetSearchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults}
                    before={
                        <EntrySelectedList
                            dataAttributeName="list-name"
                            entriesSelected={this.selectedDisplayEntries}
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

export default onClickOutside(SpacePicker)
