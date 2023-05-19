import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic, {
    SpacePickerDependencies,
    SpacePickerEvent,
    SpacePickerState,
    SpaceDisplayEntry,
} from 'src/custom-lists/ui/CollectionPicker/logic'
import { PickerSearchInput } from './components/SearchInput'
import AddNewEntry from './components/AddNewEntry'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryRow, { IconStyleWrapper } from './components/EntryRow'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { EntrySelectedList } from './components/EntrySelectedList'
import { ListResultItem } from './components/ListResultItem'
import {
    collections,
    contentSharing,
} from 'src/util/remote-functions-background'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import SpaceContextMenu from 'src/custom-lists/ui/space-context-menu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

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

    static MOD_KEY = getKeyName({ key: 'mod' })

    private displayListRef = React.createRef<HTMLDivElement>()
    private contextMenuRef = React.createRef<SpaceContextMenu>()
    private contextMenuBtnRef = React.createRef<HTMLDivElement>()

    constructor(props: SpacePickerDependencies) {
        super(props, new ListPickerLogic(props))
    }

    private get shouldShowAddNewEntry(): boolean {
        if (
            this.props.filterMode ||
            this.state.loadingSuggestions === 'running'
        ) {
            return false
        }

        const otherLists = (this.logic as ListPickerLogic).defaultEntries.map(
            (e) => ({
                id: e.localId,
                name: e.name,
            }),
        )

        return validateSpaceName(this.state.newEntryName, otherLists).valid
    }

    private get selectedDisplayEntries(): Array<{
        localId: number
        name: string
    }> {
        return this.state.selectedListIds
            .map((entryId) =>
                this.state.displayEntries.find(
                    (entry) => entry.localId === entryId,
                ),
            )
            .filter((entry) => entry != null)
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    handleSelectedListPress = (list: number) =>
        this.processEvent('selectedEntryPress', { entry: list })

    handleResultListPress = (list: SpaceDisplayEntry) => {
        this.displayListRef.current.scrollTo(0, 0)
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
        this.processEvent('keyPress', { event })
    }
    handleKeyUp = (event: KeyboardEvent) => {
        this.processEvent('onKeyUp', { event })
    }

    renderListRow = (entry: SpaceDisplayEntry, index: number) => (
        <EntryRowContainer key={entry.localId}>
            <EntryRow
                createdAt={entry.createdAt}
                onPress={this.handleResultListPress}
                onPressActOnAll={
                    this.props.actOnAllTabs
                        ? (t) =>
                              this.handleResultListAllPress(
                                  t as SpaceDisplayEntry,
                              )
                        : undefined
                }
                allTabsButtonPressed={this.state.allTabsButtonPressed}
                onFocus={this.handleResultListFocus}
                key={`ListKeyName-${entry.localId}`}
                id={`ListKeyName-${entry.localId}`}
                index={index}
                name={entry.name}
                selected={this.state.selectedListIds.includes(entry.localId)}
                localId={entry.localId}
                focused={entry.focused}
                remoteId={entry.remoteId}
                resultItem={<ListResultItem>{entry.name}</ListResultItem>}
                removeTooltipText={
                    this.props.removeTooltipText ?? 'Remove from Space'
                }
                contextMenuBtnRef={this.contextMenuBtnRef}
                onContextMenuBtnPress={this.handleSpaceContextMenuOpen(
                    entry.localId,
                )}
                actOnAllTooltipText="Add all tabs in window to Space"
            />
        </EntryRowContainer>
    )

    renderNewListAllTabsButton = () =>
        this.props.actOnAllTabs && (
            <IconStyleWrapper show>
                <TooltipBox
                    tooltipText="Add all tabs in window to Space"
                    placement="bottom"
                >
                    <Icon
                        filePath={icons.multiEdit}
                        heightAndWidth="20px"
                        onClick={this.handleNewListAllPress}
                    />
                </TooltipBox>
            </IconStyleWrapper>
        )

    renderEmptyList() {
        if (this.state.newEntryName.length > 0 && !this.props.filterMode) {
            return (
                <EmptyListsView>
                    <IconBox heightAndWidth="30px">
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <SectionTitle>No Space found</SectionTitle>
                </EmptyListsView>
            )
        }

        if (
            this.state.query.length > 0 &&
            this.state.displayEntries.length === 0
        ) {
            return (
                <EmptyListsView>
                    <IconBox heightAndWidth="30px">
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <SectionTitle>No Space found</SectionTitle>
                </EmptyListsView>
            )
        }

        if (this.state.query === '' && this.state.displayEntries.length === 0) {
            return (
                <EmptyListsView>
                    <SectionCircle>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="16px"
                            color="prime1"
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

    private handleSpaceContextMenuOpen = (listId: number) => async (
        entry: SpaceDisplayEntry,
    ) => {
        await this.processEvent('toggleEntryContextMenu', { listId })
    }

    private handleSpaceContextMenuClose = (listId: number) => async () => {
        const name = this.contextMenuRef?.current?.state.nameValue
        if (name != null) {
            await this.processEvent('renameList', {
                listId,
                name,
            })
        }
        await this.processEvent('toggleEntryContextMenu', { listId })
    }

    private renderSpaceContextMenu = () => {
        if (this.state.contextMenuListId == null) {
            return
        }

        const list = this.state.displayEntries.find(
            (l) => l.localId === this.state.contextMenuListId,
        )
        if (list == null) {
            return
        }

        return (
            <SpaceContextMenu
                loadOwnershipData
                spaceName={list.name}
                ref={this.contextMenuRef}
                localListId={this.state.contextMenuListId}
                contentSharingBG={this.props.contentSharingBG}
                spacesBG={this.props.spacesBG}
                onDeleteSpaceConfirm={() =>
                    this.processEvent('deleteList', {
                        listId: list.localId,
                    })
                }
                errorMessage={this.state.renameListErrorMessage}
                onConfirmEdit={async (name) => {
                    await this.processEvent('renameList', {
                        listId: list.localId,
                        name,
                    })
                }}
                onCancelEdit={this.handleSpaceContextMenuClose(list.localId)}
                onSpaceShare={(remoteListId) =>
                    this.processEvent('setListRemoteId', {
                        localListId: list.localId,
                        remoteListId,
                    })
                }
                remoteListId={list.remoteId}
            />
        )
    }

    renderMainContent() {
        const list = this.state.displayEntries.find(
            (l) => l.localId === this.state.contextMenuListId,
        )

        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'

        const baseUrl = isStaging
            ? 'https://staging.memex.social/c/'
            : 'https://memex.social/c/'

        if (this.state.loadingSuggestions === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator size={30} />
                </LoadingBox>
            )
        }

        return (
            <>
                {this.state.contextMenuListId ? (
                    <>
                        <PrimaryActionBox>
                            <PrimaryAction
                                type="tertiary"
                                size="small"
                                label="Go back"
                                icon="arrowLeft"
                                onClick={async () =>
                                    await this.processEvent(
                                        'toggleEntryContextMenu',
                                        {
                                            listId: list.localId,
                                        },
                                    )
                                }
                            />
                            {list.remoteId != null && (
                                <PrimaryAction
                                    type="secondary"
                                    size="small"
                                    label="Open Space"
                                    icon="goTo"
                                    onClick={async () =>
                                        window.open(baseUrl + list.remoteId)
                                    }
                                    padding={'3px 6px'}
                                />
                            )}
                        </PrimaryActionBox>
                        {this.renderSpaceContextMenu()}
                    </>
                ) : (
                    <PickerContainer>
                        <SearchContainer>
                            <PickerSearchInput
                                searchInputPlaceholder={
                                    this.props.searchInputPlaceholder
                                        ? this.props.searchInputPlaceholder
                                        : this.props.filterMode
                                        ? 'Search for Spaces to filter'
                                        : 'Search & Add Spaces'
                                }
                                showPlaceholder={
                                    this.state.selectedListIds.length === 0
                                }
                                searchInputRef={this.handleSetSearchInputRef}
                                onChange={this.handleSearchInputChanged}
                                onKeyDown={this.handleKeyPress}
                                onKeyUp={this.handleKeyUp}
                                value={this.state.query}
                                loading={
                                    this.state.loadingQueryResults === 'running'
                                }
                                before={
                                    <EntrySelectedList
                                        entries={this.selectedDisplayEntries}
                                        onPress={this.handleSelectedListPress}
                                    />
                                }
                                autoFocus={this.props.autoFocus}
                            />
                        </SearchContainer>

                        <EntryList ref={this.displayListRef}>
                            {!(
                                (this.state.query === '' &&
                                    !this.state.displayEntries.length) ||
                                this.state.query.length > 0
                            ) && (
                                <EntryListHeader>Recently used</EntryListHeader>
                            )}
                            {!this.state.displayEntries.length
                                ? this.renderEmptyList()
                                : this.state.displayEntries.map(
                                      this.renderListRow,
                                  )}
                        </EntryList>
                        {this.shouldShowAddNewEntry && (
                            <AddNewEntry
                                resultItem={this.state.newEntryName}
                                onPress={this.handleNewListPress}
                                resultsCount={this.state.displayEntries.length}
                                commandKey={SpacePicker.MOD_KEY}
                            />
                        )}
                    </PickerContainer>
                )}
            </>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                <OuterSearchBox
                    onClick={this.handleOuterSearchBoxClick}
                    width={this.props.width}
                    context={this.props.context}
                >
                    {this.renderMainContent()}
                </OuterSearchBox>
            </ThemeProvider>
        )
    }
}

const SearchContainer = styled.div`
    margin: 5px 5px 0px 5px;
`

const PrimaryActionBox = styled.div`
    padding: 2px 5px 5px 5px;
    margin-bottom: 5px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    align-items: center;
    justify-content: space-between;
`

const EntryListHeader = styled.div`
    padding: 5px 5px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale4};
    font-weight: 400;
    margin-bottom: 5px;
`

const EntryList = styled.div`
    position: relative;
    overflow-y: auto;
    max-height: 280px;
    padding: 10px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    text-align: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    font-weight: 400;
    margin-top: 10px;
`

const LoadingBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 130px;
    width: 100%;
`

const OuterSearchBox = styled.div`
    border-radius: 12px;
    width: ${(props) => (props.width ? props.width : '300px')};
    padding: 0 5px;
    padding-top: 5px;

    ${(props) =>
        props.context === 'popup' &&
        css`
            width: fill-available;
        `};
`
const PickerContainer = styled.div`
    border-radius: 12px;
    width: fill-available;
`

const EmptyListsView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;
    padding: 20px 15px;
`

const EntryRowContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 2px;
    border-radius: 6px;
`

const SpaceContextMenuBtn = styled.div`
    border-radius: 3px;
    padding: 2px;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

export default SpacePicker
