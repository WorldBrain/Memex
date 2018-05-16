import db from '..'
import AbstractModel from './abstract-model'

export default class eventLog extends AbstractModel {
    constructor({ timestamp, type, data }) {
        super()
        this.timestamp = timestamp
        this.type = type
        this.data = data
    }

    save() {
        console.log(this)
        return db.eventLog.put(this)
    }
}
