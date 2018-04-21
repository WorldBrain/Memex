import db from '..'
import AbstractModel from './abstract-model'

export default class Notification extends AbstractModel {
    constructor({ id, title, message, date, viewed }) {
        super()
        this.id = id
        this.title = title
        this.message = message
        this.date = date
        this.viewed = viewed
    }

    save() {
        return db.notifications.put(this)
    }
}
