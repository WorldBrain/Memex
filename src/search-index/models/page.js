import AbstractModel from './abstract-model'
import Visit from './visit'
import Bookmark from './bookmark'

export default class Page extends AbstractModel {
    /**
     * @param {string} args.url
     * @param {string} args.text
     * @param {lunr.Token[]} args.terms
     * @param {Visit} [args.visits=[]] Opt. Visits to assoc. with.
     * @param {Bookmark} [args.bookmark] Opt. Bookmark to assoc. with.
     */
    constructor({ url, text, terms, bookmark, visits = [] }) {
        super()
        this.url = url
        this.text = text
        this.terms = terms

        Object.defineProperties(this, {
            visits: { value: visits, enumerable: false, writeable: true },
            bookmark: { value: bookmark, enumerable: false, writeable: true },
        })
    }

    /**
     * @param {number} [time=Date.now()]
     */
    addVisit(time = Date.now()) {
        this.visits.push(new Visit({ url: this.url, time }))
    }

    setBookmark(time = Date.now()) {
        this.bookmark = new Bookmark({ url: this.url, time })
    }

    delBookmark() {
        this.bookmark = undefined
    }

    async loadRels(db) {
        this.visits = await db.visits.where({ url: this.url }).toArray()
        this.bookmark = await db.bookmarks.where({ url: this.url }).first()
    }

    save(db) {
        return db.transaction(
            'rw',
            db.pages,
            db.visits,
            db.bookmarks,
            async () => {
                await db.pages.put(this)

                // Insert or update all associated visits
                const visitIds = await Promise.all(
                    this.visits.map(visit => visit.save(db)),
                )

                // Either try to update or delete the assoc. bookmark
                if (this.bookmark != null) {
                    this.bookmark.save(db)
                } else {
                    await db.bookmarks.where({ url: this.url }).delete()
                }

                // Remove any visits no longer associated with this page
                const visitTimes = new Set(visitIds.map(([time]) => time))
                await db.visits
                    .where({ url: this.url })
                    .filter(visit => !visitTimes.has(visit.time))
                    .delete()
            },
        )
    }
}
