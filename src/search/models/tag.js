import AbstractModel from './abstract-model'

export default class Tag extends AbstractModel {
    constructor({ name, url }) {
        super()
        this.name = name
        this.url = url
    }

    async save(getDb) {
        const db = await getDb
        return db.tags.put(this)
    }

    async delete(getDb) {
        const db = await getDb
        return db.tags.delete([this.name, this.url])
    }
}
