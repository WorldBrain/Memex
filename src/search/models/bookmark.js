import getDb from '..'
import EventModel from './event-model'

export default class Bookmark extends EventModel {
    async save() {
        const db = await getDb
        return db.bookmarks.put(this)
    }
}
