import AbstractModel from './abstract-model'
import Visit from './visit'
import Bookmark from './bookmark'

// Keep these properties as Symbols to avoid storing them to DB
const visitsProp = Symbol('assocVisits')
const bookmarkProp = Symbol('assocBookmark')

export default class Page extends AbstractModel {
    /**
     * @param {Object} args
     * @param {string} args.url
     * @param {string} args.text
     * @param {string[]} args.terms
     * @param {Visit} [args.visits=[]] Opt. Visits to assoc. with.
     * @param {Bookmark} [args.bookmark] Opt. Bookmark to assoc. with.
     */
    constructor({
        url,
        text,
        fullUrl,
        fullTitle,
        terms,
        urlTerms,
        titleTerms,
        domain,
        bookmark,
        visits = [],
    }) {
        super()
        this.url = url
        this.fullUrl = fullUrl
        this.fullTitle = fullTitle
        this.text = text
        this.terms = terms
        this.urlTerms = urlTerms
        this.titleTerms = titleTerms
        this.domain = domain

        Object.defineProperties(this, {
            [visitsProp]: {
                value: visits,
                ...AbstractModel.DEF_NON_ENUM_PROP,
            },
            [bookmarkProp]: {
                value: bookmark,
                ...AbstractModel.DEF_NON_ENUM_PROP,
            },
        })
    }

    get hasBookmark() {
        return this[bookmarkProp] != null
    }

    get latestVisitTime() {
        return this[visitsProp].sort((a, b) => b.time - a.time)[0].time
    }

    /**
     * @param {number} [time=Date.now()]
     */
    addVisit(time = Date.now()) {
        this[visitsProp].push(new Visit({ url: this.url, time }))
    }

    setBookmark(time = Date.now()) {
        this[bookmarkProp] = new Bookmark({ url: this.url, time })
    }

    delBookmark() {
        this[bookmarkProp] = undefined
    }

    async loadRels(db) {
        this[visitsProp] = await db.visits.where({ url: this.url }).toArray()
        this[bookmarkProp] = await db.bookmarks.get(this.url)
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
                    this[visitsProp].map(visit => visit.save(db)),
                )

                // Either try to update or delete the assoc. bookmark
                if (this[bookmarkProp] != null) {
                    this[bookmarkProp].save(db)
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
