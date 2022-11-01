import type Storex from '@worldbrain/storex'
import PageActivityIndicatorStorage from './storage'

export interface PageActivityIndicatorDependencies {
    storageManager: Storex
}

export class PageActivityIndicatorBackground {
    storage: PageActivityIndicatorStorage

    constructor(private deps: PageActivityIndicatorDependencies) {
        this.storage = new PageActivityIndicatorStorage({
            storageManager: deps.storageManager,
        })
    }

    createFollowedList: PageActivityIndicatorStorage['createFollowedList'] = (
        data,
    ) => this.storage.createFollowedList(data)
    createFollowedListEntry: PageActivityIndicatorStorage['createFollowedListEntry'] = (
        data,
    ) => this.storage.createFollowedListEntry(data)
    updateFollowedListEntryHasAnnotations: PageActivityIndicatorStorage['updateFollowedListEntryHasAnnotations'] = (
        data,
    ) => this.storage.updateFollowedListEntryHasAnnotations(data)
    deleteFollowedListEntry: PageActivityIndicatorStorage['deleteFollowedListEntry'] = (
        data,
    ) => this.storage.deleteFollowedListEntry(data)
    deleteFollowedListAndAllEntries: PageActivityIndicatorStorage['deleteFollowedListAndAllEntries'] = (
        data,
    ) => this.storage.deleteFollowedListAndAllEntries(data)
}
