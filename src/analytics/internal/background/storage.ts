import { FeatureStorage } from '../../../search/search-index-new'

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

    async storeEvent({ time, other, type }) {
        await this.storageManager.putObject('eventLog', {
            time,
            type,
            other,
        })
    }

    async getCount({ type }) {
        const filter = {
            type
        }
        return await this.storageManager.countAll('eventLog', filter)
    }

    async getLatestEvent({ type }) {
        const opts = {
            reverse: true,
            limit: 1,
        }

        const filter = {
            type
        }
        return await this.storageManager.findObject('eventLog', filter, opts)
    }
}
