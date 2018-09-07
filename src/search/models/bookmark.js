import db from '..'
import EventModel from './event-model'

export default class Bookmark extends EventModel {
    save() {
        return db.bookmarks.put(this)
    }
}
