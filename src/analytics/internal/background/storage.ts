import { FeatureStorage } from '../../../search/search-index-new'

export default class EventLogStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registerCollection('eventLog', {
            version: new Date(2018, 6, 14),
            fields: {
                time: { type: 'datetime', pk: true },
                type: { type: 'string' },
                other: { type: 'json' },
            },
            indices: ['time', 'type'],
        })
    }

    async storeEvent({ time, other, type }) {
        await this.storageManager.putObject('eventLog', {
            time,
            type,
            other,
        })
    }

    async getCount({ filter }) {
        return await this.storageManager.countAll('eventLog', filter)
    }

    async getLatestEvent({ filter }) {
        return await this.storageManager.findAll('eventLog', filter)
    }
}
