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
import EntryResultsList from './components/EntryResultsList'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryRow, { IconStyleWrapper } from './components/EntryRow'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import * as Colors from 'src/common-ui/components/design-library/colors'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { EntrySelectedList } from './components/EntrySelectedList'
import { ListResultItem } from './components/ListResultItem'
import {
    collections,
    contentSharing,
} from 'src/util/remote-functions-background'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { validateListName } from '../utils'

class SpacePicker extends StatefulUIElement<
    SpacePickerDependencies,
    SpacePickerState,
    SpacePickerEvent
> {
    static defaultProps: Pick<
        SpacePickerDependencies,
        'createNewEntry' | 'spacesBG' | 'contentSharingBG'
    > = {
        spacesBG: collections,
        contentSharingBG: contentSharing,
        createNewEntry: async (name) =>
            collections.createCustomList({
                name,
            }),
    }

    private displayListRef = React.createRef<EntryResultsList>()

    constructor(props: SpacePickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    private get shouldShowAddNewEntry(): boolean {
        if (this.props.filterMode) {
            return false
        }

        const otherLists = (this.logic as ListPickerLogic).defaultEntries.map(
            (e) => ({
                id: e.localId,
                name: e.name,
            }),
        )

        return validateListName(this.state.newEntryName, otherLists).valid
    }

    private get selectedDisplayEntries(): Array<{
        localId: number
        name: string
    }> {
        return this.state.selectedEntries
            .map((entryId) =>
                this.state.displayEntries.find(
                    (entry) => entry.localId === entryId,
                ),
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

    handleSelectedListPress = (list: number) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: SpaceDisplayEntry) => {
        this.displayListRef.current.scrollToTop()
        this.processEvent('resultEntryPress', { entry: list })
    }

    handleResultListAllPress = (list: SpaceDisplayEntry) =>
        this.processEvent('resultEntryAllPress', { entry: list })

    handleNewListAllPress: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })
    }

    handleResultListFocus = (list: SpaceDisplayEntry, index?: number) => {
        this.processEvent('resultEntryFocus', { entry: list, index })

        const el = document.getElementById(`ListKeyName-${list.localId}`)
        if (el != null) {
            el.scrollTop = el.offsetTop
        }
    }

    handleNewListPress = () => {
        this.processEvent('newEntryPress', { entry: this.state.newEntryName })
    }

    handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.handleClickOutside(event.key)
        }
        this.processEvent('keyPress', { event })
    }

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
            key={`ListKeyName-${list.localId}`}
            id={`ListKeyName-${list.localId}`}
            index={index}
            name={list.name}
            selected={this.state.selectedEntries.includes(list.localId)}
            localId={list.localId}
            focused={list.focused}
            remoteId={list.remoteId}
            resultItem={<ListResultItem>{list.name}</ListResultItem>}
            removeTooltipText={
                this.props.removeTooltipText ?? 'Remove from Space'
            }
            actOnAllTooltipText="Add all tabs in window to Space"
        />
    )

    renderNewListAllTabsButton = () =>
        this.props.actOnAllTabs && (
            <IconStyleWrapper show>
                <ButtonTooltip
                    tooltipText="Add all tabs in window to Space"
                    position="left"
                >
                    <Icon
                        filePath={icons.multiEdit}
                        heightAndWidth="20px"
                        onClick={this.handleNewListAllPress}
                    />
                </ButtonTooltip>
            </IconStyleWrapper>
        )

    renderEmptyList() {
        if (this.state.newEntryName.length > 0 && !this.props.filterMode) {
            return
        }

        if (this.state.query === '') {
            return (
                <EmptyListsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>Create your first Space</SectionTitle>
                    <InfoText>
                        {this.props.filterMode
                            ? 'to use as a search filter'
                            : 'by typing into the search field'}
                    </InfoText>
                </EmptyListsView>
            )
        }
    }

    renderMainContent() {
        if (this.state.loadingSuggestions === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator size={25} />
                </LoadingBox>
            )
        }

        return (
            <>
                <PickerSearchInput
                    searchInputPlaceholder={
                        this.props.searchInputPlaceholder ??
                        'Search & Add Spaces'
                    }
                    showPlaceholder={this.state.selectedEntries.length === 0}
                    searchInputRef={this.handleSetSearchInputRef}
                    onChange={this.handleSearchInputChanged}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.query}
                    loading={this.state.loadingQueryResults === 'running'}
                    before={
                        <EntrySelectedList
                            entries={this.selectedDisplayEntries}
                            onPress={this.handleSelectedListPress}
                        />
                    }
                />
                <EntryResultsList
                    ref={this.displayListRef}
                    query={this.state.query}
                    entries={this.state.displayEntries}
                    emptyView={this.renderEmptyList()}
                    renderEntryRow={this.renderListRow}
                />
                {this.shouldShowAddNewEntry && (
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
    text-align: center;
    line-height: 18px;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    width: 100%;
`

const OuterSearchBox = styled.div`
    background: ${(props) => props.theme.background};
    border-radius: 12px;
    padding: 10px 0px;
`

const EmptyListsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

export default onClickOutside(SpacePicker)
