import { FeatureStorage } from '../../search/search-index-new'

export default class DirectLinkingStorage extends FeatureStorage {
    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registerCollection('directLinks', {
            version: new Date(2018, 5, 31),
            fields: {
                pageTitle: { type: 'text' },
                body: { type: 'text' },
                selector: { type: 'json' },
                createdWhen: { type: 'datetime' },
                url: { type: 'string', pk: true },
            },
            indices: ['pageTitle', 'body', 'createdWhen', 'url'],
        })
    }

    async insertDirectLink({ pageTitle, url, body, selector }) {
        await this.storageManager.putObject('directLinks', {
            pageTitle,
            body,
            selector,
            createdWhen: new Date(),
            url,
        })
    }
}
