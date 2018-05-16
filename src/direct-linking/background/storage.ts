export default class DirectLinkingStorage {
    constructor(private storageManager) {
        this.storageManager.registerCollection('directLinks', {
            version: 1,
            fields: {
                pageTitle: { type: 'text' },
                createdWhen: { type: 'datetime' },
                url: { type: 'string', pk: true }
            },
            indices: ['pageTitle', 'createdWhen', 'url']
        })
    }

    async insertDirectLink({ pageTitle, url }) {
        await this.storageManager.putObject('directLinks', {
            pageTitle,
            createdWhen: new Date(),
            url
        })
    }
}
