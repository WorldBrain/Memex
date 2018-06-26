import { MapEventTypeToInt, MapNotifTypeToIntArray } from './constants'
import sendToServer from './sendToServer'
import { remoteFunction } from 'src/util/webextensionRPC'
import analyticsLogStorage from './AnalyticsLogStorage'

const getCount = remoteFunction('getCount')
const getLatestEvent = remoteFunction('getLatestEvent')

class Analytics {
    _initDataLoaded
    _setDataLoaded

    constructor() {
        this._initDataLoaded = new Promise(
            resolve => (this._setDataLoaded = resolve),
        )
    }

    _eventStats = {
        successfulSearch: { count: 0 },
        unsuccessfulSearch: { count: 0 },
        datepicker: { count: 0 },
        bookmarkFilter: { count: 0 },
        tagFilter: { count: 0 },
        domainFilter: { count: 0 },
        tagging: { count: 0 },
        bookmark: { count: 0 },
        blacklist: { count: 0 },
        addressBarSearch: { count: 0 },
        datepickerNlp: { count: 0 },
        nlpSearch: { count: 0 },
    }

    async registerOperations() {
        for (const event of Object.keys(this._eventStats)) {
            this.loadInitialData(event)
        }

        this._setDataLoaded()
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
            latestTime: eventArgs.time,
            notifType: MapEventTypeToInt[eventArgs.type].notifType,
        }

        await analyticsLogStorage(params)

        if (MapEventTypeToInt[eventArgs.type].notifType) {
            await this.statisticsStorage(notifParams)
        }
    }

    /**
     * Load Initial data from dexie for the particular event type
     * Query to dexie and store into _eventStats
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
            latestTime: latestEvent,
            count: eventLogCount,
        })
    }

    // Update the value when the memeory variables is out of update or load initial data
    async updateValue(notifType, value) {
        this._eventStats[notifType] = value
    }

    async incrementValue(event) {
        this._eventStats[event.notifType] = {
            count: this._eventStats[event.notifType].count + 1,
            latestTime: event.latestTime,
        }
    }

    getCountNotif(notifType) {
        return this._eventStats[notifType]
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async processEvent(eventArgs) {
        await this._initDataLoaded

        // Prepare the event to store the event in dexie db.
        const time = Date.now()

        console.log(this._eventStats)

        const params = {
            ...eventArgs,
            time,
            details: {},
        }

        await this.storeEventLogStatistics(params)

        // Send the data to redash server
        sendToServer.trackEvent(params, params.force)
    }
}

export default Analytics
