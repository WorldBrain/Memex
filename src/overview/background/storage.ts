import { FeatureStorage } from '../../search/search-index-new/storage'

export default class NotificationStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registerCollection('notifications', {
            version: new Date(2018, 7, 4),
            fields: {
                id: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                buttonText: {type: 'string'},
                sentTime: {type: 'datetime'},
                deliveredTime: {type: 'datetime'},
                readTime: {type: 'datetime'},
            },
            indices: [
                { field: 'id', pk: true },
            ],
        })
    }

    async storeNotification({ id, title, message, buttonText, sentTime, deliveredTime, readTime }) {
        await this.storageManager.putObject('notifications', {
            id,
            title,
            message,
            buttonText,
            sentTime,
            deliveredTime,
            readTime,
        })
    }

    async getUnreadCount() {
        return await this.storageManager.countAll(
            'notifications',
            { $match: {
                readTime: {'$exists':false},
            }},
        )
    }
}
