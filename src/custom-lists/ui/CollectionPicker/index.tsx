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
    analyticsBG,
    contentSharing,
    pageActivityIndicator,
} from 'src/util/remote-functions-background'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import SpaceContextMenu from 'src/custom-lists/ui/space-context-menu'
import SpaceEditMenu from 'src/custom-lists/ui/space-edit-menu'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { getEntriesForCurrentPickerTab } from './utils'
import type { UnifiedList } from 'src/annotations/cache/types'
import { ErrorNotification } from '@worldbrain/memex-common/lib/common-ui/components/error-notification'
import { runInBackground } from 'src/util/webextensionRPC'
import { ListTrees } from '../list-trees'
import { ListTreeToggleArrow } from '../list-trees/components/tree-toggle-arrow'

export interface Props extends SpacePickerDependencies {
    showPageLinks?: boolean
    onListFocus?: (listId: UnifiedList['localId']) => void
    getRootElement?: () => HTMLElement
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
        | 'bgScriptBG'
        | 'contentSharingBG'
        | 'pageActivityIndicatorBG'
        | 'annotationsCache'
        | 'localStorageAPI'
        | 'analyticsBG'
    > = {
        authBG: auth,
        spacesBG: collections,
        analyticsBG: analyticsBG,
        bgScriptBG: runInBackground(),
        contentSharingBG: contentSharing,
        localStorageAPI: browser.storage.local,
        pageActivityIndicatorBG: pageActivityIndicator,
        annotationsCache: new PageAnnotationsCache({}),
    }

    static MOD_KEY = getKeyName({ key: 'mod' })

    private displayListRef = React.createRef<HTMLDivElement>()
    private contextMenuRef = React.createRef<SpaceContextMenu>()
    private editMenuRef = React.createRef<SpaceEditMenu>()
    private contextMenuBtnRef = React.createRef<HTMLDivElement>()
    private editMenuBtnRef = React.createRef<HTMLDivElement>()
    private extraMenuBtnRef = React.createRef<HTMLDivElement>()
    private goToButtonRef = React.createRef<HTMLDivElement>()
    private openInTabGroupButtonRef = React.createRef<HTMLDivElement>()
    private searchInputRef = React.createRef<HTMLInputElement>()
    private listTreesRef = React.createRef<ListTrees>()
    private entryRowRefs: { [unifiedId: string]: EntryRow } = {}

    constructor(props: Props) {
        super(
            props,
            new ListPickerLogic({
                ...props,
                getListTreesRef: () => this.listTreesRef.current,
                getEntryRowRefs: () => this.entryRowRefs,
            }),
        )
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

        const newName =
            this.state.newEntryName?.[this.state.newEntryName.length - 1]
                ?.name ?? ''

        const validSpaceName = validateSpaceName(newName, otherLists).valid
        return validSpaceName
    }

    private get selectedCacheListIds(): string[] {
        return this.state.selectedListIds
            .map(
                (localListId) =>
                    this.props.annotationsCache.getListByLocalId(localListId)
                        ?.unifiedId,
            )
            .filter(Boolean)
    }

    handleSetSearchInputRef = (ref: HTMLInputElement) =>
        this.processEvent('setSearchInputRef', { ref })
    handleOuterSearchBoxClick = () => this.processEvent('focusInput', {})

    handleSearchInputChanged = (query: string) =>
        this.processEvent('searchInputChanged', { query })

    handleNewListAllPress: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        // this.processEvent('newEntryAllPress', {
        //     entry: this.state.newEntryName,
        // })
    }

    handleNewListPress = () => {
        this.processEvent('newEntryPress', {
            entry: this.state.newEntryName,
        })
    }

    private handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        this.processEvent('keyPress', { event })
    }

    private handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        this.processEvent('onKeyUp', { event })
    }

    private renderEmptyList() {
        if (
            (this.state.newEntryName?.length > 0 && !this.props.filterMode) ||
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

    private keepScrollPosition = () => {
        const el = this.displayListRef.current
        const scrollTop = el.scrollTop
        if (el != null) {
            if (scrollTop === 0) {
                el.scroll({ top: 0 })
            }
        }
    }

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

        // Function to highlight matching text
        const highlightText = (text: string, query: string) => {
            if (!query) return text
            const segments = query.split('/')
            const lastQuery = segments.length > 0 ? segments.pop() : query

            const parts = text.split(new RegExp(`(${lastQuery})`, 'gi'))
            return parts.map((part, index) =>
                part.toLowerCase() === lastQuery.toLowerCase() &&
                lastQuery.length > 0 ? (
                    <HighlightedTextSpan key={index}>
                        {part}
                    </HighlightedTextSpan>
                ) : (
                    part
                ),
            )
        }

        // Easier to work with the root list IDs (as it's easy to get the root from anywhere in the tree),
        //  so use these for calcs relating to the tree views
        let rootIdsForListsShownAsTrees = this.state.listIdsShownAsTrees

        return listEntries.map((entry, index) => {
            // If this entry is a root of a tree flagged to be shown in tree view, render it with all descendents in tree view
            if (rootIdsForListsShownAsTrees.includes(index)) {
                let allTreeMembers = this.props.annotationsCache.getAllListsInTreeByRootId(
                    entry.pathUnifiedIds[0],
                )

                let allTreeMembersIds = allTreeMembers.map((list) => {
                    return list.unifiedId
                })
                return (
                    <ListTrees
                        lists={allTreeMembers}
                        ref={this.listTreesRef}
                        authBG={this.props.authBG}
                        listsBG={this.props.spacesBG}
                        cache={this.props.annotationsCache}
                        initListsToDisplayUnfolded={[
                            ...this.selectedCacheListIds,
                            ...allTreeMembersIds,
                        ]}
                        areListsBeingFiltered={
                            this.state.query.trim().length > 0
                        }
                    >
                        {(entry, treeState, actions, dndActions) => (
                            <EntryRowContainer
                                onDragEnter={dndActions.onDragEnter}
                                onDragLeave={dndActions.onDragLeave}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                onDrop={dndActions.onDrop}
                                key={entry.unifiedId}
                            >
                                <EntryRow
                                    id={`ListKeyName-${entry.unifiedId}`}
                                    ref={(ref) =>
                                        (this.entryRowRefs[
                                            entry.unifiedId
                                        ] = ref)
                                    }
                                    indentSteps={entry.pathUnifiedIds.length}
                                    dndActions={dndActions}
                                    onPress={() => {
                                        this.processEvent('resultEntryPress', {
                                            entry,
                                        })
                                    }}
                                    onListFocus={() =>
                                        this.props.onListFocus(entry.localId)
                                    }
                                    addedToAllIds={this.state.addedToAllIds}
                                    keepScrollPosition={this.keepScrollPosition}
                                    onPressActOnAll={
                                        this.props.actOnAllTabs
                                            ? () =>
                                                  this.processEvent(
                                                      'resultEntryAllPress',
                                                      {
                                                          entry,
                                                      },
                                                  )
                                            : undefined
                                    }
                                    bgScriptBG={this.props.bgScriptBG}
                                    onFocus={() =>
                                        this.processEvent('focusListEntry', {
                                            listId: entry.unifiedId,
                                        })
                                    }
                                    onUnfocus={() =>
                                        this.processEvent('focusListEntry', {
                                            listId: null,
                                        })
                                    }
                                    index={index}
                                    selected={this.state.selectedListIds.includes(
                                        entry.localId,
                                    )}
                                    focused={
                                        this.state.focusedListId ===
                                        entry.unifiedId
                                    }
                                    resultItem={
                                        <ListResultItem>
                                            {highlightText(
                                                entry.name,
                                                this.state.query,
                                            )}
                                        </ListResultItem>
                                    }
                                    contextMenuBtnRef={this.contextMenuBtnRef}
                                    goToButtonRef={this.goToButtonRef}
                                    editMenuBtnRef={this.editMenuBtnRef}
                                    extraMenuBtnRef={this.extraMenuBtnRef}
                                    openInTabGroupButtonRef={
                                        this.openInTabGroupButtonRef
                                    }
                                    onContextMenuBtnPress={
                                        entry.creator?.id ===
                                        this.state.currentUser?.id
                                            ? () =>
                                                  this.processEvent(
                                                      'toggleEntryContextMenu',
                                                      {
                                                          listId: entry.localId,
                                                      },
                                                  )
                                            : undefined
                                    }
                                    onEditMenuBtnPress={
                                        entry.creator?.id ===
                                        this.state.currentUser?.id
                                            ? () =>
                                                  this.processEvent(
                                                      'toggleEntryEditMenu',
                                                      {
                                                          listId: entry.localId,
                                                      },
                                                  )
                                            : undefined
                                    }
                                    onOpenInTabGroupPress={() =>
                                        this.processEvent(
                                            'onOpenInTabGroupPress',
                                            {
                                                listId: entry.localId,
                                            },
                                        )
                                    }
                                    actOnAllTooltipText="Add all tabs in window to Space"
                                    shareState={
                                        entry?.isPrivate ?? 'private'
                                            ? 'private'
                                            : 'shared'
                                    }
                                    getRootElement={this.props.getRootElement}
                                    {...entry}
                                    toggleShowNewChildInput={
                                        actions.toggleShowNewChildInput
                                    }
                                    renderLeftSideIcon={() => (
                                        <ListTreeToggleArrow
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                            treeState={treeState}
                                            actions={{
                                                ...actions,
                                                toggleShowChildren: () => {
                                                    // Toggling roots should close tree-view
                                                    if (
                                                        entry.parentUnifiedId ==
                                                        null
                                                    ) {
                                                        this.processEvent(
                                                            'toggleListShownAsTree',
                                                            {
                                                                listIndex: index,
                                                            },
                                                        )
                                                    } else {
                                                        actions.toggleShowChildren()
                                                    }
                                                },
                                            }}
                                        />
                                    )}
                                />
                            </EntryRowContainer>
                        )}
                    </ListTrees>
                )
            }

            let pathText = entry.pathUnifiedIds
                .flatMap((id) => {
                    let cachedList = this.props.annotationsCache.lists.byId[id]
                    if (!cachedList) {
                        return null
                    }
                    return [
                        <Icon
                            filePath="arrowRight"
                            heightAndWidth="14px"
                            color="greyScale4"
                            hoverOff
                        />,
                        cachedList.name,
                    ]
                })
                .filter(Boolean)
                .slice(1)

            // Base case: flat view
            return (
                <EntryRowContainer key={entry.unifiedId}>
                    <EntryRow
                        ancestryPath={pathText}
                        onAncestryPathClick={(e) => {
                            e.stopPropagation()
                            this.processEvent('toggleListShownAsTree', {
                                listIndex: index,
                            })
                        }}
                        id={`ListKeyName-${entry.unifiedId}`}
                        ref={(ref) =>
                            (this.entryRowRefs[entry.unifiedId] = ref)
                        }
                        onPress={() => {
                            this.processEvent('resultEntryPress', {
                                entry,
                            })
                        }}
                        onListFocus={() =>
                            this.props.onListFocus(entry.localId)
                        }
                        addedToAllIds={this.state.addedToAllIds}
                        keepScrollPosition={this.keepScrollPosition}
                        onPressActOnAll={
                            this.props.actOnAllTabs
                                ? () =>
                                      this.processEvent('resultEntryAllPress', {
                                          entry,
                                      })
                                : undefined
                        }
                        bgScriptBG={this.props.bgScriptBG}
                        onFocus={() =>
                            this.processEvent('focusListEntry', {
                                listId: entry.unifiedId,
                            })
                        }
                        onUnfocus={() =>
                            this.processEvent('focusListEntry', {
                                listId: null,
                            })
                        }
                        index={index}
                        selected={this.state.selectedListIds.includes(
                            entry.localId,
                        )}
                        focused={this.state.focusedListId === entry.unifiedId}
                        resultItem={
                            <ListResultItem>
                                {highlightText(entry.name, this.state.query)}
                            </ListResultItem>
                        }
                        contextMenuBtnRef={this.contextMenuBtnRef}
                        goToButtonRef={this.goToButtonRef}
                        editMenuBtnRef={this.editMenuBtnRef}
                        extraMenuBtnRef={this.extraMenuBtnRef}
                        openInTabGroupButtonRef={this.openInTabGroupButtonRef}
                        onContextMenuBtnPress={
                            entry.creator?.id === this.state.currentUser?.id
                                ? () =>
                                      this.processEvent(
                                          'toggleEntryContextMenu',
                                          {
                                              listId: entry.localId,
                                          },
                                      )
                                : undefined
                        }
                        onEditMenuBtnPress={
                            entry.creator?.id === this.state.currentUser?.id
                                ? () =>
                                      this.processEvent('toggleEntryEditMenu', {
                                          listId: entry.localId,
                                      })
                                : undefined
                        }
                        onOpenInTabGroupPress={() =>
                            this.processEvent('onOpenInTabGroupPress', {
                                listId: entry.localId,
                            })
                        }
                        actOnAllTooltipText="Add all tabs in window to Space"
                        shareState={
                            entry?.isPrivate ?? 'private' ? 'private' : 'shared'
                        }
                        getRootElement={this.props.getRootElement}
                        {...entry}
                    />
                </EntryRowContainer>
            )
        })
    }

    private handleSpaceContextMenuClose = (listId: number) => async () => {
        const name = this.props.annotationsCache.getListByLocalId(listId)?.name
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
                                type="tertiary"
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
                        isCreator={
                            list.creator?.id === this.state.currentUser?.id
                        }
                        listData={list}
                        ref={this.contextMenuRef}
                        contentSharingBG={this.props.contentSharingBG}
                        analyticsBG={this.props.analyticsBG}
                        errorMessage={this.state.renameListErrorMessage}
                        onSetSpacePrivate={(isPrivate) =>
                            this.processEvent('setListPrivacy', {
                                listId: list.localId,
                                isPrivate,
                            })
                        }
                        getRootElement={this.props.getRootElement}
                    />
                </>
            )
        }
        if (this.state.editMenuListId != null) {
            const list = this.props.annotationsCache.getListByLocalId(
                this.state.editMenuListId,
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
                                await this.processEvent('toggleEntryEditMenu', {
                                    listId: list.localId,
                                })
                            }
                        />
                    </PrimaryActionBox>
                    <SpaceEditMenu
                        loadOwnershipData
                        isCreator={
                            list.creator?.id === this.state.currentUser?.id
                        }
                        listData={list}
                        ref={this.editMenuRef}
                        contentSharingBG={this.props.contentSharingBG}
                        analyticsBG={this.props.analyticsBG}
                        spacesBG={this.props.spacesBG}
                        onDeleteSpaceConfirm={() => {
                            this.processEvent('deleteList', {
                                listId: list.localId,
                            })
                        }}
                        errorMessage={this.state.renameListErrorMessage}
                        onConfirmSpaceNameEdit={(name) => {
                            this.processEvent('renameList', {
                                listId: list.localId,
                                name,
                            })
                        }}
                        onCancelEdit={this.handleSpaceContextMenuClose(
                            list.localId,
                        )}
                        getRootElement={this.props.getRootElement}
                    />
                </>
            )
        }

        return (
            <PickerContainer>
                <SearchContainer>
                    <PickerSearchInput
                        searchInputRef={this.searchInputRef}
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
                        onChange={this.handleSearchInputChanged}
                        onKeyDown={this.handleKeyPress}
                        onKeyUp={this.handleKeyUp}
                        value={this.state.query}
                        autoFocus={true}
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
                    {this.renderListEntries()}
                </EntryList>
                {this.shouldShowAddNewEntry && (
                    <AddNewEntry
                        resultItem={this.state.newEntryName}
                        onPress={this.handleNewListPress}
                        resultsCount={this.state.filteredListIds?.length}
                        commandKey={SpacePicker.MOD_KEY}
                        getRootElement={this.props.getRootElement}
                    />
                )}
            </PickerContainer>
        )
    }

    render() {
        return (
            <ThemeProvider theme={Colors.lightTheme}>
                {this.state.spaceWriteError && (
                    <ErrorNotification
                        closeComponent={() => {
                            this.processEvent('setSpaceWriteError', {
                                error: null,
                            })
                        }}
                        getPortalRoot={this.props.getRootElement}
                        blockedBackground
                        positioning="centerCenter"
                        title="Error saving note"
                        errorMessage={this.state.spaceWriteError}
                    />
                )}

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
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale7};
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

    ${(props) =>
        props.theme.variant === 'light' &&
        css<any>`
            border-color: ${props.theme.colors.greyScale3};
        `};
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

const OuterSearchBox = styled.div<{
    width?: string
    context: string
}>`
    border-radius: 12px;
    width: ${(props) => (props.width ? props.width : '300px')};
    padding: 0 5px;
    padding-top: 5px;
    min-height: 300px;

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
    position: relative;
`

const HighlightedTextSpan = styled.span`
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 4px;
    margin: 0 2px;
    color: ${(props) => props.theme.colors.black};
    white-space: nowrap;
`

export default SpacePicker
