import EventModel from './event-model'

export default class Bookmark extends EventModel {
    async save() {
        const { object } = await this.db
            .collection('bookmarks')
            .createObject(this.data)
        return object.url
    }
}
