import { FeatureStorage } from '../../../search/storage'
import { NOTIF_TYPE_EVENT_IDS, EVENT_TYPES } from '../constants'

export default class EventLogStorage extends FeatureStorage {
    static EVENT_LOG_COLL = 'eventLog'
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registry.registerCollection(
            EventLogStorage.EVENT_LOG_COLL,
            {
                version: new Date(2018, 6, 14),
                fields: {
                    time: { type: 'datetime' },
                    type: { type: 'string' },
                    details: { type: 'json' },
                },
                indices: [
                    { field: ['time', 'type'], pk: true },
                    { field: 'time' },
                    { field: 'type' },
                ],
                watch: false,
                backup: false,
            },
        )
    }

    async storeEvent({ time, details, type }) {
        await this.storageManager
            .collection(EventLogStorage.EVENT_LOG_COLL)
            .createObject({
                time,
                type: EVENT_TYPES[type].id,
                details,
            })
    }

    async getLatestTimeWithCount({ notifType }) {
        let eventLogCount = 0
        let latestEvent = 0

        const opts = {
            reverse: true,
            limit: 1,
        }

        for (const type of NOTIF_TYPE_EVENT_IDS[notifType]) {
            const latest = await this.storageManager
                .collection(EventLogStorage.EVENT_LOG_COLL)
                .findOneObject({ type }, opts)

            if (latest) {
                latestEvent = Math.max(latest['time'], latestEvent)
            }

            const eventCountNotif = await this.storageManager
                .collection(EventLogStorage.EVENT_LOG_COLL)
                .countObjects({ type })

            eventLogCount += eventCountNotif
        }

        if (eventLogCount === 0) {
            return null
        }

        return {
            latestTime: latestEvent,
            count: eventLogCount,
        }
    }
}
