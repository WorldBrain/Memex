import { MapEventTypeToInt, MapNotifTypeToIntArray } from './constants'
import db from 'src/search/search-index-new'
import AnalyticsStorage from './AnalyticsStorage'

class Analytics {
    _queueEvents = []
    _loaded = 0
    _operationsMap = {
        successful_search: undefined,
        unsuccessful_search: undefined,
        datepicker: undefined,
        bookmark_filter: undefined,
        tag_filter: undefined,
        domain_filter: undefined,
        tagging: undefined,
        bookmark: undefined,
        blacklist: undefined,
        address_bar_search: undefined,
        datepicker_nlp: undefined,
        nlp_search: undefined,
    }

    registerOperations() {
        Object.keys(this._operationsMap).map((data, i) =>
            this._queueEvents.push(data),
        )
        this._loaded = 1
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async storeEventLogStatistics(eventArgs) {
        const params = {
            ...eventArgs,
            type: MapEventTypeToInt[eventArgs.type].id,
            data: eventArgs.data || {},
        }

        const notifParams = {
            last_time_used: eventArgs.timestamp,
            value: MapEventTypeToInt[eventArgs.type].notifType,
        }

        AnalyticsStorage({
            event: params,
            statistics: MapEventTypeToInt[eventArgs.type].notifType
                ? notifParams
                : undefined,
        })
    }

    /**
     * Load Initial data from dexie for the particular event type
     * Query to dexie and store into _operationsMap
     * @param {notifType} type of notif event
     */
    async loadInititalData(notifType) {
        console.log('Here')
        await db.transactions('r', db.tables, async () => {
            const eventLog = db.eventLog
                .where('type')
                .anyOf(MapNotifTypeToIntArray[notifType])
                .count()

            console.log(eventLog)

            if (this._operationsMap[notifType] === undefined) {
                this._operationsMap[notifType] = eventLog
            } else {
                this._operationsMap[notifType] += eventLog
            }
        })
    }

    incrementvalue(notifType) {
        if (!this._operationsMap[notifType]) {
            this._operationsMap[notifType] = 1
        } else {
            this._operationsMap[notifType] += 1
        }
    }

    getCountNotif(notifType) {
        return this._operationsMap[notifType]
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async processEvent(eventArgs) {
        this.loadInititalData('bookmark')

        this._loaded = 1
        console.log(eventArgs)
        // Prepare the event to store the event in dexie db.
        const timestamp = Date.now()

        const params = {
            ...eventArgs,
            timestamp,
        }

        // If all the items has been loaded initially
        if (this._loaded === 1) {
            // If all the event has processed then directly save the event into db
            if (!this._queueEvents.length) {
                await this.storeEventLogStatistics(params)
            } else {
                while (this._queueEvents.length) {
                    const event = this._queueEvents[0]
                    this._queueEvents.shift()

                    // Event happens on the client side
                    if (event instanceof Object) {
                        await this.storeEventLogStatistics(event)
                    } else {
                        // Initial load data from dexie
                        await this.loadInititalData(event)
                    }
                }
            }
        } else {
            this._queueEvents.push(params)
        }
    }
}

export default Analytics
