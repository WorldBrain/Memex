import { MapEventTypeToInt } from './constants'

import db from './db'

class Analytics {
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

    /**
     * Reconstruct the count when cache becomes invalid
     *
     *@param {EventTrackInfo} params
     */
    async _fromDexie(type) {}
}

export default Analytics
