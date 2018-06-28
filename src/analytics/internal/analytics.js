import { EVENT_TYPES } from './constants'

class Analytics {
    _initDataLoaded
    _setDataLoaded

    constructor({ serverConnector, remoteFunction }) {
        this._remoteFunction = remoteFunction
        this._serverConnector = serverConnector
        this.getLatestTimeWithCount = this._remoteFunction(
            'getLatestTimeWithCount',
        )
        this.storeEvent = remoteFunction('storeEvent')

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
            await this.loadInitialData(event)
        }

        this._setDataLoaded()
    }

    async fromDexie(notifType) {
        await this.loadInititalData(notifType, true)
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async storeEventLogStatistics(eventArgs) {
        // If details is not there then add default value
        const params = {
            ...eventArgs,
            details: eventArgs.details || {},
        }

        // Create notificaitions params
        const notifParams = {
            latestTime: eventArgs.time,
            notifType: EVENT_TYPES[eventArgs.type].notifType,
        }

        // Store the event in dexie
        await this.storeEvent(params)

        if (EVENT_TYPES[eventArgs.type].notifType) {
            await this.incrementValue(notifParams)
        }
    }

    /**
     * Load Initial data from dexie for the particular event type
     * Query to dexie and store into _eventStats
     * @param {notifType} type of notif event
     */
    async loadInitialData(notifType, isCacheUpdate = false) {
        const latestTimeWithCount = await this.getLatestTimeWithCount({
            notifType,
        })
        if (!latestTimeWithCount) {
            return
        }

        await this.updateValue(notifType, latestTimeWithCount)
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
        this._serverConnector.trackEvent(params, params.force)
    }
}

export default Analytics
