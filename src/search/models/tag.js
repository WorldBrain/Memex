import getDb from '..'
import AbstractModel from './abstract-model'

export default class Tag extends AbstractModel {
    constructor({ name, url }) {
        super()
        this.name = name
        this.url = url
    }

    async save() {
        const db = await getDb
        return db.tags.put(this)
    }

    async delete() {
        const db = await getDb
        return db.tags.delete([this.name, this.url])
    }
}
