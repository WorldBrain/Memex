import { FeatureStorage } from '../../../search/storage'
import { NOTIF_TYPE_EVENT_IDS, EVENT_TYPES } from '../constants'

export default class EventLogStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registerCollection('eventLog', {
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
        })
    }

    async storeEvent({ time, details, type }) {
        await this.storageManager.putObject('eventLog', {
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
            const latest = await this.storageManager.findObject(
                'eventLog',
                { type },
                opts,
            )
            if (latest) {
                latestEvent = Math.max(latest['time'], latestEvent)
            }

            const eventCountNotif = await this.storageManager.countAll(
                'eventLog',
                { type },
            )
            eventLogCount += Number(eventCountNotif)
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
