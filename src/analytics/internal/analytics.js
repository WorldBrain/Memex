import { MapEventTypeToInt, MapNotifTypeToIntArray } from './constants'
import db from 'src/search/search-index-new'
import AnalyticsStorage from './AnalyticsStorage'
import SendToServer from './sendToServer'

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
            notifType: MapEventTypeToInt[eventArgs.type].notifType,
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
    async loadInititalData(notifType, isCacheUpdate = false) {
        await db.transaction('rw', db.tables, async () => {
            const eventLogCount = await db.eventLog
                .where('type')
                .anyOf(MapNotifTypeToIntArray[notifType])
                .count()

            const eventLogLastTimeUsed = await db.eventLog
                .where('type')
                .anyOf(MapNotifTypeToIntArray[notifType])
                .last()

            // If the data is out of date then we have to update with dexie query and initial loading of data
            if (this._operationsMap[notifType] === undefined || isCacheUpdate) {
                // if there is any entry in the dexie then update data of cache
                if (eventLogLastTimeUsed) {
                    this._operationsMap[notifType] = {
                        last_time_used: eventLogLastTimeUsed.timestamp,
                        value: eventLogCount,
                    }
                }
            } else {
                if (eventLogLastTimeUsed) {
                    this._operationsMap[notifType] = {
                        last_time_used: eventLogLastTimeUsed.timestamp,
                        value:
                            eventLogCount +
                            this._operationsMap[notifType].value,
                    }
                }
            }
        })
    }

    incrementvalue(event) {
        if (!this._operationsMap[event.notifType]) {
            this._operationsMap[event.notifType] = {
                value: 1,
                last_time_used: event.last_time_used,
            }
        } else {
            this._operationsMap[event.notifType] = {
                value: this._operationsMap[event.notifType].value + 1,
                last_time_used: event.last_time_used,
            }
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
        this._loaded = 1
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

        // Send the data to redash server
        SendToServer.trackEvent(params)
    }
}

export default Analytics
