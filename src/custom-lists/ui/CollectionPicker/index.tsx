import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import browser from 'webextension-polyfill'

import { StatefulUIElement } from 'src/util/ui-logic'
import ListPickerLogic from 'src/custom-lists/ui/CollectionPicker/logic'
import type {
    SpacePickerDependencies,
    SpacePickerEvent,
    SpacePickerState,
} from 'src/custom-lists/ui/CollectionPicker/types'
import { PickerSearchInput } from './components/SearchInput'
import AddNewEntry from './components/AddNewEntry'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import EntryRow from './components/EntryRow'
import * as Colors from 'src/common-ui/components/design-library/colors'
import { ListResultItem } from './components/ListResultItem'
import {
    auth,
    collections,
    contentSharing,
    pageActivityIndicator,
} from 'src/util/remote-functions-background'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import SpaceContextMenu from 'src/custom-lists/ui/space-context-menu'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { getEntriesForCurrentPickerTab } from './utils'
import type { UnifiedList } from 'src/annotations/cache/types'

export interface Props extends SpacePickerDependencies {
    showPageLinks?: boolean
}

class SpacePicker extends StatefulUIElement<
    Props,
    SpacePickerState,
    SpacePickerEvent
> {
    static defaultProps: Pick<
        Props,
        | 'authBG'
        | 'spacesBG'
        | 'contentSharingBG'
        | 'pageActivityIndicatorBG'
        | 'annotationsCache'
        | 'localStorageAPI'
        | 'createNewEntry'
    > = {
        authBG: auth,
        spacesBG: collections,
        contentSharingBG: contentSharing,
        localStorageAPI: browser.storage.local,
        pageActivityIndicatorBG: pageActivityIndicator,
        annotationsCache: new PageAnnotationsCache({}),
        createNewEntry: async (name) =>
            collections.createCustomList({
                name,
            }),
    }

    static MOD_KEY = getKeyName({ key: 'mod' })

    private displayListRef = React.createRef<HTMLDivElement>()
    private contextMenuRef = React.createRef<SpaceContextMenu>()
    private contextMenuBtnRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props, new ListPickerLogic(props))
    }

    private get shouldShowAddNewEntry(): boolean {
        if (
            this.props.filterMode ||
            this.state.loadState === 'running' ||
            this.state.currentTab === 'page-links'
        ) {
            return false
        }

        const otherLists = normalizedStateToArray(this.state.listEntries).map(
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
        const selectedIdSet = new Set(this.state.selectedListIds)
        return getEntriesForCurrentPickerTab(this.state)
            .filter(
                (entry) =>
                    entry.localId != null && selectedIdSet.has(entry.localId),
            )
            .map((entry) => ({
                localId: entry.localId,
                name: entry.name,
            }))
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    handleNewListAllPress: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.processEvent('newEntryAllPress', {
            entry: this.state.newEntryName,
        })
    }

    handleResultListFocus = (list: UnifiedList, index?: number) => {
        this.processEvent('resultEntryFocus', { entry: list, index })

        const el = document.getElementById(`ListKeyName-${list.localId}`)
        if (el != null) {
            el.scrollTop = el.offsetTop
        }
    }

    handleNewListPress = () => {
        this.processEvent('newEntryPress', {
            entry: this.state.newEntryName,
        })
    }

    private handleKeyPress = (event: KeyboardEvent) => {
        this.processEvent('keyPress', { event })
    }

    private handleKeyUp = (event: KeyboardEvent) => {
        this.processEvent('onKeyUp', { event })
    }

    private renderEmptyList() {
        if (
            (this.state.newEntryName.length > 0 && !this.props.filterMode) ||
            (this.state.query.trim().length > 0 &&
                this.state.filteredListIds?.length === 0)
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

        if (
            !this.state.query.trim().length &&
            !this.state.filteredListIds &&
            this.state.currentTab === 'page-links'
        ) {
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
                    <SectionTitle>Create your first page link</SectionTitle>
                    <InfoText>
                        by clicking on "Share Page" <br />
                        in the top right of the sidebar.
                    </InfoText>
                </EmptyListsView>
            )
        }
        if (!this.state.query.trim().length && !this.state.filteredListIds) {
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

    private renderListRow = (
        entry: UnifiedList<'user-list' | 'page-link'>,
        index: number,
    ) => (
        <EntryRowContainer key={entry.unifiedId}>
            <EntryRow
                id={`ListKeyName-${entry.unifiedId}`}
                onPress={() => {
                    this.displayListRef.current.scrollTo(0, 0)
                    this.processEvent('resultEntryPress', {
                        entry,
                    })
                }}
                onPressActOnAll={
                    this.props.actOnAllTabs
                        ? () =>
                              this.processEvent('resultEntryAllPress', {
                                  entry,
                              })
                        : undefined
                }
                onFocus={async () => {
                    const el = document.getElementById(
                        `ListKeyName-${entry.unifiedId}`,
                    )
                    if (el != null) {
                        el.scrollTop = el.offsetTop
                    }
                    await this.processEvent('resultEntryFocus', {
                        entry,
                        index,
                    })
                }}
                onUnfocus={() =>
                    this.processEvent('resultEntryFocus', {
                        entry,
                        index: null,
                    })
                }
                allTabsButtonPressed={this.state.allTabsButtonPressed}
                index={index}
                selected={this.state.selectedListIds.includes(entry.localId)}
                focused={this.state.focusedListId === entry.unifiedId}
                resultItem={<ListResultItem>{entry.name}</ListResultItem>}
                removeTooltipText={
                    this.props.removeTooltipText ?? 'Remove from Space'
                }
                contextMenuBtnRef={this.contextMenuBtnRef}
                onContextMenuBtnPress={
                    entry.creator?.id === this.state.currentUser?.id
                        ? () =>
                              this.processEvent('toggleEntryContextMenu', {
                                  listId: entry.localId,
                              })
                        : undefined
                }
                actOnAllTooltipText="Add all tabs in window to Space"
                {...entry}
            />
        </EntryRowContainer>
    )

    private renderListEntries() {
        let listEntries = getEntriesForCurrentPickerTab(this.state)
        if (this.state.query.trim().length > 0) {
            listEntries = listEntries.filter((list) =>
                this.state.filteredListIds.includes(list.unifiedId),
            )
        }

        if (
            this.state.currentTab === 'page-links' &&
            this.props.normalizedPageUrlToFilterPageLinksBy
        ) {
            listEntries = listEntries.filter(
                (list) =>
                    list.type === 'page-link' &&
                    list.normalizedPageUrl ===
                        this.props.normalizedPageUrlToFilterPageLinksBy,
            )
        }

        if (!listEntries.length) {
            return this.renderEmptyList()
        }
        return listEntries.map(this.renderListRow)
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

    private renderMainContent() {
        if (this.state.loadState === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator size={30} />
                </LoadingBox>
            )
        }

        if (this.state.contextMenuListId != null) {
            const list = this.props.annotationsCache.getListByLocalId(
                this.state.contextMenuListId,
            )
            return (
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
                                icon="globe"
                                onClick={() =>
                                    this.processEvent('openListInWebUI', {
                                        unifiedListId: list.unifiedId,
                                    })
                                }
                                padding={'3px 6px'}
                            />
                        )}
                    </PrimaryActionBox>
                    <SpaceContextMenu
                        loadOwnershipData
                        listData={list}
                        ref={this.contextMenuRef}
                        contentSharingBG={this.props.contentSharingBG}
                        spacesBG={this.props.spacesBG}
                        onDeleteSpaceConfirm={() =>
                            this.processEvent('deleteList', {
                                listId: list.localId,
                            })
                        }
                        errorMessage={this.state.renameListErrorMessage}
                        onConfirmSpaceNameEdit={async (name) => {
                            await this.processEvent('renameList', {
                                listId: list.localId,
                                name,
                            })
                        }}
                        onCancelEdit={this.handleSpaceContextMenuClose(
                            list.localId,
                        )}
                        onSpaceShare={(remoteListId) =>
                            this.processEvent('setListRemoteId', {
                                localListId: list.localId,
                                remoteListId,
                            })
                        }
                    />
                </>
            )
        }

        return (
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
                        autoFocus={this.props.autoFocus}
                    />
                </SearchContainer>

                <EntryList
                    shouldScroll={this.state.listEntries.allIds.length < 5}
                    ref={this.displayListRef}
                    context={this.props.context}
                >
                    {this.props.showPageLinks && (
                        <OutputSwitcherContainer>
                            <OutputSwitcher
                                active={this.state.currentTab === 'user-lists'}
                                onClick={() =>
                                    this.processEvent('switchTab', {
                                        tab: 'user-lists',
                                    })
                                }
                            >
                                Spaces
                            </OutputSwitcher>
                            <OutputSwitcher
                                active={this.state.currentTab === 'page-links'}
                                onClick={() =>
                                    this.processEvent('switchTab', {
                                        tab: 'page-links',
                                    })
                                }
                            >
                                Page Links
                            </OutputSwitcher>
                        </OutputSwitcherContainer>
                    )}
                    {/* {this.state.currentTab === 'user-lists' &&
                        this.state.query.trim().length === 0 && (
                            <EntryListHeader>Recently used</EntryListHeader>
                        )} */}
                    {this.renderListEntries()}
                </EntryList>
                {this.shouldShowAddNewEntry && (
                    <AddNewEntry
                        resultItem={this.state.newEntryName}
                        onPress={this.handleNewListPress}
                        resultsCount={this.state.listEntries.allIds.length}
                        commandKey={SpacePicker.MOD_KEY}
                    />
                )}
            </PickerContainer>
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

const OutputSwitcherContainer = styled.div`
    display: flex;
    border-radius: 6px;
    //border: 1px solid ${(props) => props.theme.colors.greyScale2};
    margin-bottom: 10px;
    width: fill-available;
`

const OutputSwitcher = styled.div<{
    active: boolean
}>`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale7};
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    justify-content: center;
    width: 50%;
    border-radius: 4px;

    ${(props) =>
        props.active &&
        css`
            /* background: ${(props) => props.theme.colors.greyScale2}; */
            outline: 1px solid ${(props) => props.theme.colors.greyScale2};
        `}
`

const SearchContainer = styled.div`
    margin: 5px 10px 0px 10px;
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

const EntryList = styled.div<{ shouldScroll: boolean; context: string }>`
    position: relative;
    height: 100%;

    padding: 5px 10px 10px 10px;
    overflow: scroll;
    max-height: 300px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    ${(props) =>
        props.context === 'popup' &&
        css`
            width: fill-available;
            height: 100%;
            max-height: 400px;
        `};

    ${(props) =>
        props.shouldScroll &&
        css`
            overflow: visible;
        `};
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
    margin: 0 5px;
    border-radius: 6px;
`

const TabsBar = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`

const Tab = styled.div<{ active: boolean }>``

export default SpacePicker
