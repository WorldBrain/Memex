import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'

import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    constructor(props: Props) {
        super(props, new DashboardLogic(props))
    }

    private renderListsSidebar() {
        const lockedState = {
            isSidebarLocked: this.state.listsSidebar.isSidebarLocked,
            toggleSidebarLockedState: () =>
                this.processEvent('setSidebarLocked', {
                    isLocked: !this.state.listsSidebar.isSidebarLocked,
                }),
        }

        return (
            <ListsSidebarContainer
                lockedState={lockedState}
                peekState={{
                    isSidebarPeeking: this.state.listsSidebar.isSidebarPeeking,
                    toggleSidebarPeekState: () =>
                        this.processEvent('setSidebarPeeking', {
                            isPeeking: !this.state.listsSidebar
                                .isSidebarPeeking,
                        }),
                }}
                searchBarProps={{
                    searchQuery: this.state.listsSidebar.searchQuery,
                    sidebarLockedState: lockedState,
                    isSearchBarFocused: false,
                    hasPerfectMatch: true,
                    onCreateNew: () => this.processEvent('addNewList', null),
                    onFocus: () => null,
                    onSearchQueryChange: (query) =>
                        this.processEvent('setSearchQuery', { query }),
                    onInputClear: () => null,
                }}
                listsGroups={[
                    {
                        hasTitle: false,
                        addableState: { isAddable: false, onAdd: () => null },
                        expandableState: {
                            isExpandable: false,
                            isExpanded: true,
                            onExpand: () => null,
                        },
                        loadingState: 'pristine',
                        listsArray: [],
                    },
                    {
                        hasTitle: true,
                        listsGroupTitle: 'My collections',
                        listSource: 'local-lists',
                        addableState: {
                            isAddable: true,
                            onAdd: () => this.processEvent('addNewList', null),
                        },
                        expandableState: {
                            isExpandable: true,
                            isExpanded: true,
                            onExpand: () =>
                                this.processEvent('setLocalListsExpanded', {
                                    isExpanded: !this.state.listsSidebar
                                        .localLists.isExpanded,
                                }),
                        },
                        loadingState: this.state.listsSidebar.localLists
                            .loadingState,
                        listsArray: [], // TODO: sort out types and properly derive this from `state.listData`
                    },
                    {
                        hasTitle: true,
                        listsGroupTitle: 'Followed collections',
                        listSource: 'followed-list',
                        addableState: { isAddable: false, onAdd: () => null },
                        expandableState: {
                            isExpandable: true,
                            isExpanded: true,
                            onExpand: () =>
                                this.processEvent('setFollowedListsExpanded', {
                                    isExpanded: !this.state.listsSidebar
                                        .followedLists.isExpanded,
                                }),
                        },
                        loadingState: this.state.listsSidebar.followedLists
                            .loadingState,
                        listsArray: [], // TODO: sort out types and properly derive this from `state.listData`
                    },
                ]}
            />
        )
    }

    private renderSearchResults() {
        return <SearchResultsContainer {...this.state} />
    }

    render() {
        return (
            <>
                {this.renderListsSidebar()}
                {this.renderSearchResults()}
            </>
        )
    }
}
