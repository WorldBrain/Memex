import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import { getBulkEditItems } from './utils'
import browser from 'webextension-polyfill'
import { BULK_SELECT_STORAGE_KEY } from './constants'
import type { BulkEditCollection, BulkEditItem } from './types'

export interface Dependencies {
    // contentSharingBG: ContentSharingInterface
    // spacesBG: RemoteCollectionsInterface
    // searchBG: SearchInterface
    deleteBulkSelection: () => Promise<void>
    selectAllPages: () => Promise<void>
    clearBulkSelection: () => Promise<void>
    bulkDeleteLoadingState: TaskState
    bulkEditSpacesLoadingState: TaskState
    removeIndividualSelection: (itemData) => Promise<void>
    spacePicker: () => JSX.Element
    citeMenu: () => JSX.Element
}

export type Event = UIEvent<{
    showBulkEditSelectionBox: { isShown: boolean }
    promptConfirmDeleteBulkSelection: { isShown: boolean }
    showCiteMenu: { isShown: boolean }
    showSpacePicker: { isShown: boolean }
    deleteBulkSelection: { pageId: boolean }
    selectAllPages: null
}>

export interface State {
    loadState: TaskState
    showBulkEditSelectionBox: boolean
    bulkSelectedItems: BulkEditItem[]
    itemCounter: number
    showConfirmBulkDeletion: boolean
    showSpacePicker: boolean
    showCiteMenu: boolean
    selectAllLoadingState: TaskState
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class BulkEditLogic extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
        this.listenToNewBulkItems = this.listenToNewBulkItems.bind(this)
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        showBulkEditSelectionBox: false,
        bulkSelectedItems: [],
        itemCounter: null,
        showConfirmBulkDeletion: false,
        showSpacePicker: false,
        selectAllLoadingState: 'pristine',
        showCiteMenu: false,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        const selectedItems: BulkEditCollection = await getBulkEditItems()
        const itemCounter = Object.keys(selectedItems).length

        this.emitMutation({
            bulkSelectedItems: { $set: selectedItems },
            itemCounter: { $set: itemCounter },
        })

        browser.storage.onChanged.addListener(this.listenToNewBulkItems)
    }

    listenToNewBulkItems(changes, area) {
        const changedItems = Object.keys(changes)
        for (const item of changedItems) {
            if (item === BULK_SELECT_STORAGE_KEY) {
                if (!changes[item].newValue) {
                    this.emitMutation({
                        bulkSelectedItems: { $set: null },
                        itemCounter: { $set: null },
                    })
                    return
                }
                const selectedItems: BulkEditCollection = changes[item].newValue
                const itemCounter = Object.keys(selectedItems).length

                this.emitMutation({
                    bulkSelectedItems: { $set: selectedItems },
                    itemCounter: { $set: itemCounter },
                })
            }
        }
    }

    showBulkEditSelectionBox: EventHandler<
        'showBulkEditSelectionBox'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            showBulkEditSelectionBox: { $set: event.isShown },
        })
    }
    showSpacePicker: EventHandler<'showSpacePicker'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            showSpacePicker: { $set: event.isShown },
        })
    }

    promptConfirmDeleteBulkSelection: EventHandler<
        'promptConfirmDeleteBulkSelection'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            showConfirmBulkDeletion: { $set: event.isShown },
        })
    }
    showCiteMenu: EventHandler<'showCiteMenu'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            showCiteMenu: { $set: event.isShown },
        })
    }

    deleteBulkSelection: EventHandler<'deleteBulkSelection'> = async ({
        previousState,
        event,
    }) => {
        this.dependencies.deleteBulkSelection()
        this.emitMutation({
            showConfirmBulkDeletion: { $set: false },
        })
    }
    selectAllPages: EventHandler<'selectAllPages'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            selectAllLoadingState: { $set: 'running' },
        })

        await this.dependencies.selectAllPages()
        this.emitMutation({
            selectAllLoadingState: { $set: 'pristine' },
        })
    }
}
