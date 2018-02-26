import db from '..'
import AbstractModel from './abstract-model'
import Visit from './visit'
import Bookmark from './bookmark'

// Keep these properties as Symbols to avoid storing them to DB
const visitsProp = Symbol('assocVisits')
const bookmarkProp = Symbol('assocBookmark')
const latestProp = Symbol('latestEvent')

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
            [latestProp]: AbstractModel.DEF_NON_ENUM_PROP,
        })
    }

    get latest() {
        return this[latestProp]
    }

    get hasBookmark() {
        return this[bookmarkProp] != null
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

    async loadRels() {
        // Grab DB data
        const visits = await db.visits.where({ url: this.url }).toArray()
        const bookmark = await db.bookmarks.get(this.url)

        this[visitsProp] = visits
        this[bookmarkProp] = bookmark

        // Derive latest time of either bookmark or visits
        let latest = bookmark != null ? bookmark.time : 0

        if (latest < (visits[visits.length - 1] || { time: 0 }).time) {
            latest = visits[visits.length - 1].time
        }

        this[latestProp] = latest
    }

    save() {
        return db.transaction(
            'rw',
            db.pages,
            db.visits,
            db.bookmarks,
            async () => {
                await db.pages.put(this)

                // Insert or update all associated visits
                const visitIds = await Promise.all(
                    this[visitsProp].map(visit => visit.save()),
                )

                // Either try to update or delete the assoc. bookmark
                if (this[bookmarkProp] != null) {
                    this[bookmarkProp].save()
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
