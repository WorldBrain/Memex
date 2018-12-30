import { EVENT_TYPES, EVENT_NAMES } from './constants'

class Analytics {
    _initDataLoaded
    _setDataLoaded

    constructor({ serverConnector }) {
        this._serverConnector = serverConnector

        this._initDataLoaded = new Promise(
            resolve => (this._setDataLoaded = resolve),
        )
    }

    _eventStats = {
        [EVENT_NAMES.SUCCESSFUL_SEARCH]: {
            count: 0,
        },
        [EVENT_NAMES.UNSUCCESSFUL_SEARCH]: {
            count: 0,
        },
        [EVENT_NAMES.DATEPICKER]: {
            count: 0,
        },
        [EVENT_NAMES.BOOKMARK_FILTER]: {
            count: 0,
        },
        [EVENT_NAMES.TAG_FILTER]: {
            count: 0,
        },
        [EVENT_NAMES.DOMAIN_FILTER]: {
            count: 0,
        },
        [EVENT_NAMES.TAGGING]: {
            count: 0,
        },
        [EVENT_NAMES.BOOKMARK]: {
            count: 0,
        },
        [EVENT_NAMES.BLACKLIST]: {
            count: 0,
        },
        [EVENT_NAMES.ADDRESS_BAR_SEARCH]: {
            count: 0,
        },
        [EVENT_NAMES.DATEPICKER_NLP]: {
            count: 0,
        },
        [EVENT_NAMES.NLP_SEARCH]: {
            count: 0,
        },
        [EVENT_NAMES.OVERVIEW_TOOLTIP]: {
            count: 0,
        },
    }

    async registerOperations(eventLog) {
        this.eventLog = eventLog

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
        // Create notificaitions params
        const notifParams = {
            latestTime: eventArgs.time,
            notifType: EVENT_TYPES[eventArgs.type].notifType,
        }

        // Store the event in dexie
        await this.eventLog.storeEvent(eventArgs)

        if (EVENT_TYPES[eventArgs.type].notifType) {
            this.incrementValue(notifParams)
        }
    }

    /**
     * Load Initial data from dexie for the particular event type
     * Query to dexie and store into _eventStats
     * @param {notifType} type of notif event
     */
    async loadInitialData(notifType, isCacheUpdate = false) {
        const latestTimeWithCount = await this.eventLog.getLatestTimeWithCount({
            notifType,
        })

        if (!latestTimeWithCount) {
            return
        }

        this.updateValue(notifType, latestTimeWithCount)
    }

    // Update the value when the memeory variables is out of update or load initial data
    updateValue(notifType, value) {
        this._eventStats[notifType] = value
    }

    incrementValue(event) {
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

        const params = {
            ...eventArgs,
            time,
        }

        await this.storeEventLogStatistics(params)

        // Send the data to analytics server
        await this._serverConnector.trackEvent(params, params.force)
    }
}

export default Analytics
