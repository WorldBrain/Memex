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
            EventProcessor({
                type: MapEventTypeToInt[eventArgs.type].notifType,
                timestamp,
            })
        }

        await this._saveToDB(params)
    }
}

export default Analytics
