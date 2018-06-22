import { MapEventTypeToInt, MapNotifTypeToIntArray } from './constants'
import SendToServer from './sendToServer'
import { remoteFunction } from 'src/util/webextensionRPC'
import AnalyticsLogStorage from './AnalyticsLogStorage'

const getCount = remoteFunction('getCount')
const getLatestEvent = remoteFunction('getLatestEvent')

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

    async registerOperations() {
        for (const event of Object.keys(this._operationsMap)) {
            await this.loadInitialData(event)
        }
    }

    async fromDexie(notifType) {
        await this.loadInititalData(notifType, true)
    }

    async statisticsStorage(event) {
        await this.incrementvalue(event)
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
            details: eventArgs.details || {},
        }

        const notifParams = {
            last_time_used: eventArgs.time,
            notifType: MapEventTypeToInt[eventArgs.type].notifType,
        }

        await AnalyticsLogStorage(params)

        if (MapEventTypeToInt[eventArgs.type].notifType) {
            await this.statisticsStorage(notifParams)
        }
    }

    /**
     * Load Initial data from dexie for the particular event type
     * Query to dexie and store into _operationsMap
     * @param {notifType} type of notif event
     */
    async loadInitialData(notifType, isCacheUpdate = false) {
        let eventLogCount = 0
        let latestEvent = 0

        for (let i = 0; i < MapNotifTypeToIntArray[notifType].length; i++) {
            const filter = {
                type: MapNotifTypeToIntArray[notifType][i],
            }

            // TODO: Not working this method, have to make more optimize
            const latest = await getLatestEvent({ filter })

            if (latest) {
                latestEvent = Math.max(latest.time, latestEvent)
            }

            const eventCountNotif = await getCount({ filter })
            eventLogCount += eventCountNotif
        }

        // TODO; on the latest event time
        if (eventLogCount === 0) {
            return
        }

        if (this.getCountNotif() === undefined || isCacheUpdate) {
            await this.updateValue(notifType, {
                last_time_used: latestEvent,
                value: eventLogCount,
            })
        } else {
            await this.updateValue(notifType, {
                last_time_used: latestEvent,
                value: eventLogCount + this._operationsMap[notifType].value,
            })
        }
    }

    // Update the value when the memeory variables is out of update or load initial data
    async updateValue(notifType, value) {
        this._operationsMap[notifType] = value
    }

    async incrementvalue(event) {
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

        console.log(this._operationsMap)

        const params = {
            ...eventArgs,
            time,
            details: {},
        }

        await this.storeEventLogStatistics(params)

        // Send the data to redash server
        SendToServer.trackEvent(params)
    }
}

export default Analytics
