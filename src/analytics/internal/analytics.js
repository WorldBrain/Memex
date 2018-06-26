import { MapEventTypeToInt, MapNotifTypeToIntArray } from './constants'
import sendToServer from './sendToServer'
import { remoteFunction } from 'src/util/webextensionRPC'
import analyticsLogStorage from './AnalyticsLogStorage'

const getCount = remoteFunction('getCount')
const getLatestEvent = remoteFunction('getLatestEvent')

class Analytics {
    _startRegisterEvents
    _doneRegisterEvents

    constructor() {
        this._startRegisterEvents = new Promise(
            resolve => (this._doneRegisterEvents = resolve),
        )
    }

    _operationsMap = {
        successful_search: { count: 0 },
        unsuccessful_search: { count: 0 },
        datepicker: { count: 0 },
        bookmark_filter: { count: 0 },
        tag_filter: { count: 0 },
        domain_filter: { count: 0 },
        tagging: { count: 0 },
        bookmark: { count: 0 },
        blacklist: { count: 0 },
        address_bar_search: { count: 0 },
        datepicker_nlp: { count: 0 },
        nlp_search: { count: 0 },
    }

    async registerOperations() {
        await this._startRegisterEvents

        for (const event of Object.keys(this._operationsMap)) {
            this.loadInitialData(event)
        }

        this._doneRegisterEvents()
    }

    async fromDexie(notifType) {
        await this.loadInititalData(notifType, true)
    }

    async statisticsStorage(event) {
        await this.incrementValue(event)
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
            latest_time: eventArgs.time,
            notifType: MapEventTypeToInt[eventArgs.type].notifType,
        }

        await analyticsLogStorage(params)

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

        for (const type of MapNotifTypeToIntArray[notifType]) {
            // TODO: Have to make more optimize
            const latest = await getLatestEvent({ type })

            if (latest) {
                latestEvent = Math.max(latest.time, latestEvent)
            }

            const eventCountNotif = await getCount({ type })
            eventLogCount += eventCountNotif
        }

        // TODO; on the latest event time
        if (eventLogCount === 0) {
            return
        }

        await this.updateValue(notifType, {
            latest_time: latestEvent,
            count: eventLogCount,
        })
    }

    // Update the value when the memeory variables is out of update or load initial data
    async updateValue(notifType, value) {
        this._operationsMap[notifType] = value
    }

    async incrementValue(event) {
        this._operationsMap[event.notifType] = {
            count: this._operationsMap[event.notifType].count + 1,
            latest_time: event.latest_time,
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
        sendToServer.trackEvent(params)
    }
}

export default Analytics
