import { MapEventTypeToInt } from './constants'
import AnalyticsStorage from './AnalyticsStorage'
import SendToServer from './sendToServer'

class Analytics {
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
        // Object.keys(this._operationsMap).map((data, i) =>
        //     // this.loadInitialData(data)
        //     data = data + ""
        // )
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
            other: eventArgs.data || {},
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
        // await db.transaction('rw', db.tables, async () => {
        //     let eventLogCount = 0
        //     for(let i = 0; i < MapNotifTypeToIntArray[notifType].length(); i++) {
        //         const eventCountNotif = await db.eventLog
        //             .where('type')
        //             .equals(MapNotifTypeToIntArray[notifType][i])
        //             .count()
        //         if(eventCountNotif) {
        //             eventLogCount += eventCountNotif
        //         }
        //     }
        //     const eventLogLastTimeUsed = await db.eventLog
        //         .where('type')
        //         .anyOf(MapNotifTypeToIntArray[notifType])
        //         .last()
        //     console.log(eventLogLastTimeUsed, eventLogCount)
        //     // if there is any entry in the dexie then update data of cache
        //     if(!eventLogLastTimeUsed) {
        //         return
        //     }
        //     // If the data is out of date then we have to update with dexie query and initial loading of data
        //     if (this.getCountNotif() === undefined || isCacheUpdate) {
        //         this.updateValue(notifType, { last_time_used: eventLogLastTimeUsed.timestamp,value: eventLogCount})
        //     } else {
        //         this.updateValue(notifType, { last_time_used: eventLogLastTimeUsed.timestamp,value: eventLogCount + this._operationsMap[notifType].value})
        //    }
        // })
    }

    // Update the value when the memeory variables is out of update or load initial data
    updateValue(notifType, isCacheUpdate, value) {
        this._operationsMap[notifType] = value
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
        // Prepare the event to store the event in dexie db.
        const time = Date.now()

        const params = {
            ...eventArgs,
            time,
            other: [],
        }

        await this.storeEventLogStatistics(params)

        // Send the data to redash server
        SendToServer.trackEvent(params)
    }
}

export default Analytics
