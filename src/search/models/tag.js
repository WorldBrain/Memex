import db from '..'
import AbstractModel from './abstract-model'

export default class Tag extends AbstractModel {
    constructor({ name, url }) {
        super()
        this.name = name
        this.url = url
    }

    save() {
        return db.tags.put(this)
    }

    delete() {
        return db.tags.delete([this.name, this.url])
    }
}
