import { MapEventTypeToInt } from './constants'

import db from './db'

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
     * Save to db
     * @param {any} params
     * @return {Promise<boolean>}
     */
    _saveToDB = async params => {
        await db.eventLog.add(params)
        // console.log(await db.eventLog.toArray())
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async storeEvent(eventArgs) {
        const timestamp = Date.now()

        const params = {
            type: MapEventTypeToInt[eventArgs.type].id,
            data: eventArgs.data || {},
            timestamp,
        }

        this._queueEvents.push(params)

        if (MapEventTypeToInt[eventArgs.type].notifType) {
            this._processEvent({
                type: MapEventTypeToInt[eventArgs.type].notifType,
                timestamp,
            })
        }

        await this._saveToDB(params)
    }

    /**
     * Updates the statistics in localStorage and Dexie
     *
     * @param {EventTrackInfo} params
     */
    async _processEvent({ type, timestamp }) {
        // Without caching
        console.time('Aggregator value with dexie')
        const eventData = await db.eventAggregator
            .where('type')
            .equals(type)
            .toArray()

        await db.eventAggregator.put({
            type,
            data: {
                last_time_used: timestamp,
                count: eventData.length ? eventData[0].data.count + 1 : 1,
            },
        })

        console.timeEnd('Aggregator value with dexie')
        // console.log(await db.eventAggregator.toArray())

        // With localStorage
        console.time('Aggregator value with localStorage')
        const eventDataL = (await browser.storage.local.get(type))[type]

        await browser.storage.local.set({
            [type]: {
                count: eventDataL ? eventDataL.count + 1 : 1,
                last_time_used: timestamp,
            },
        })

        console.timeEnd('Aggregator value with localStorage')

        // console.log((await browser.storage.local.get(type))[type])
    }
}

export default Analytics
