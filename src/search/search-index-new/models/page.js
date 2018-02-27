import db from '..'
import AbstractModel from './abstract-model'
import Visit from './visit'
import Bookmark from './bookmark'
import Tag from './tag'

// Keep these properties as Symbols to avoid storing them to DB
const visitsProp = Symbol('assocVisits')
const tagsProp = Symbol('assocTags')
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
            [tagsProp]: {
                value: [],
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
     * Pages should be deleted if no events associated with them any more.
     *
     * @return {boolean}
     */
    get shouldDelete() {
        return !this.hasBookmark && !this[visitsProp].length
    }

    /**
     * @param {number} [time=Date.now()]
     */
    addVisit(time = Date.now()) {
        this[visitsProp].push(new Visit({ url: this.url, time }))
    }

    addTag(name) {
        const index = this[tagsProp].findIndex(tag => tag.name === name)

        if (index === -1) {
            this[tagsProp].push(new Tag({ url: this.url, name }))
        }
    }

    delTag(name) {
        const index = this[tagsProp].findIndex(tag => tag.name === name)

        if (index !== -1) {
            this[tagsProp] = [
                ...this[tagsProp].slice(0, index),
                ...this[tagsProp].slice(index + 1),
            ]
        }
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
        const tags = await db.tags.where({ url: this.url }).toArray()
        const bookmark = await db.bookmarks.get(this.url)

        this[visitsProp] = visits
        this[tagsProp] = tags
        this[bookmarkProp] = bookmark

        // Derive latest time of either bookmark or visits
        let latest = bookmark != null ? bookmark.time : 0

        if (latest < (visits[visits.length - 1] || { time: 0 }).time) {
            latest = visits[visits.length - 1].time
        }

        this[latestProp] = latest
    }

    delete() {
        return db.transaction(
            'rw',
            db.pages,
            db.visits,
            db.bookmarks,
            db.tags,
            async () => {
                console.log('deleting', this)
                await db.visits.where({ url: this.url }).delete()
                await db.bookmarks.where({ url: this.url }).delete()
                await db.tags.where({ url: this.url }).delete()
                await db.pages.where({ url: this.url }).delete()
            },
        )
    }

    save() {
        return db.transaction(
            'rw',
            db.pages,
            db.visits,
            db.bookmarks,
            db.tags,
            async () => {
                await db.pages.put(this)

                // Insert or update all associated visits
                const visitIds = await Promise.all(
                    this[visitsProp].map(visit => visit.save()),
                )
                // Insert or update all associated tags
                const tagIds = await Promise.all(
                    this[tagsProp].map(tag => tag.save()),
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

                // Remove any tags no longer associated with this page
                const tagsSet = new Set(tagIds.map(([name]) => name))
                await db.tags
                    .where({ url: this.url })
                    .filter(tag => !tagsSet.has(tag.name))
                    .delete()
            },
        )
    }
}
