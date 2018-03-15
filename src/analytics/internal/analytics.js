import { EventProcessor } from './analysis'
import { MapEventTypeToInt } from './constants'

import db from './db'

class Analytics {
    /**
     * Save to db
     * @param {any} params
     * @return {Promise<boolean>}
     */
    _saveToDB = async params => {
        const event = {
            ...params,
            timestamp: Date.now(),
        }

        EventProcessor(event)

        await db.eventLog.add(event)
        console.log(await db.eventLog.toArray())
    }

    /**
     * Track any user-invoked events internally.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async storeEvent(eventArgs) {
        const params = {
            type: MapEventTypeToInt[eventArgs.type],
            data: eventArgs.data || {},
        }
        await this._saveToDB(params)
    }
}

export default Analytics
