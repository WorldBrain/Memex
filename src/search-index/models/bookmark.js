import EventModel from './event-model'

export default class Bookmark extends EventModel {
    save(db) {
        return db.bookmarks.put(this)
    }
}
