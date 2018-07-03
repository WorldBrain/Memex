import db, { VisitInteraction } from '..'
import AbstractModel from './abstract-model'
import Visit from './visit'
import Bookmark from './bookmark'
import Tag from './tag'

// Keep these properties as Symbols to avoid storing them to DB
const visitsProp = Symbol('assocVisits')
const tagsProp = Symbol('assocTags')
const bookmarkProp = Symbol('assocBookmark')
const latestProp = Symbol('latestEvent')
const screenshot = Symbol('screenshotURI')

export interface PageConstructorOptions {
    // Indexed/searchable data
    url: string
    terms: string[]
    urlTerms: string[]
    titleTerms: string[]
    domain: string
    hostname: string

    // Display data
    text: string
    fullUrl: string
    fullTitle: string
    screenshotURI?: string

    // Misc. opt. data
    lang?: string
    canonicalUrl?: string
    description?: string
    keywords?: string[]
    pouchMigrationError?: boolean
}

type TermsIndexName = 'terms' | 'urlTerms' | 'titleTerms'

export default class Page extends AbstractModel
    implements PageConstructorOptions {
    public url: string
    public text: string
    public fullUrl: string
    public fullTitle: string
    public terms: string[]
    public urlTerms: string[]
    public titleTerms: string[]
    public domain: string
    public hostname: string
    public screenshot: Blob
    public lang?: string
    public canonicalUrl?: string
    public description?: string
    public keywords?: string[]
    public pouchMigrationError?: boolean

    constructor(props: PageConstructorOptions) {
        super()
        this.url = props.url
        this.fullUrl = props.fullUrl
        this.fullTitle = props.fullTitle
        this.text = props.text
        this.terms = props.terms
        this.urlTerms = props.urlTerms
        this.titleTerms = props.titleTerms
        this.domain = props.domain
        this.hostname = props.hostname

        if (props.screenshotURI) this.screenshotURI = props.screenshotURI
        if (props.lang) this.lang = props.lang
        if (props.canonicalUrl) this.canonicalUrl = props.canonicalUrl
        if (props.description) this.description = props.description
        if (props.keywords) this.keywords = props.keywords
        if (props.pouchMigrationError)
            this.pouchMigrationError = props.pouchMigrationError

        Object.defineProperties(this, {
            [visitsProp]: {
                value: [],
                ...AbstractModel.DEF_NON_ENUM_PROP,
            },
            [bookmarkProp]: {
                value: undefined,
                ...AbstractModel.DEF_NON_ENUM_PROP,
            },
            [tagsProp]: {
                value: [],
                ...AbstractModel.DEF_NON_ENUM_PROP,
            },
            [screenshot]: AbstractModel.DEF_NON_ENUM_PROP,
            [latestProp]: AbstractModel.DEF_NON_ENUM_PROP,
        })
    }

    get screenshotURI() {
        return this[screenshot]
    }

    get latest() {
        return this[latestProp]
    }

    get hasBookmark() {
        return this[bookmarkProp] != null
    }

    get tags() {
        return this[tagsProp].map(tag => tag.name)
    }

    get visits() {
        return this[visitsProp]
    }

    get bookmark() {
        return this[bookmarkProp]
    }

    /**
     * Pages should be deleted if no events associated with them any more.
     */
    get shouldDelete() {
        return !this.hasBookmark && this[visitsProp].length === 0
    }

    get isStub() {
        return this.text == null && (this.terms == null || !this.terms.length)
    }

    set screenshotURI(input: string) {
        if (input) {
            this.screenshot = AbstractModel.dataURLToBlob(input)
            this[screenshot] = AbstractModel.getBlobURL(this.screenshot)
        }
    }

    /**
     * @param {number} [upperBound]
     * @return {number} Latest event timestamp below `upperBound`.
     */
    public getLatest(upperBound = Date.now()) {
        let max = 0
        let visit: Visit

        for (visit of this[visitsProp]) {
            if (visit.time > max && visit.time <= upperBound) {
                max = visit.time
            }
        }

        const bm: Bookmark = this[bookmarkProp]
        if (bm != null && bm.time > max && bm.time <= upperBound) {
            max = bm.time
        }

        return max
    }

    addVisit(time = Date.now(), data: Partial<VisitInteraction> = {}) {
        this[visitsProp].push(new Visit({ url: this.url, time, ...data }))
    }

    addTag(name: string) {
        const index = (this[tagsProp] as Tag[]).findIndex(
            tag => tag.name === name,
        )

        if (index === -1) {
            this[tagsProp].push(new Tag({ url: this.url, name }))
        }
    }

    delTag(name: string) {
        const index = (this[tagsProp] as Tag[]).findIndex(
            tag => tag.name === name,
        )

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

    /**
     * Merges some terms with the current terms state.
     *
     * @param {TermsIndexName} termProp The name of which terms state to update.
     * @param {string[]} terms Array of terms to merge with current state.
     */
    _mergeTerms(termProp: TermsIndexName, terms: string[]) {
        if (!this[termProp]) {
            this[termProp] = terms
        } else {
            this[termProp] = [...new Set([...this[termProp], ...terms])]
        }
    }

    /**
     * Attempt to load the blobs if they are currently undefined and there is a valid data URI
     * on the corresponding hidden field.
     * Any errors encountered in trying to resolve the URI to a Blob will result in it being unset.
     * Fields accessed by Symbols are the hidden data URI fields.
     * TODO: Find a better way to manage Blobs and Data URIs on models?
     */
    loadBlobs() {
        try {
            // Got Blob, but no data URL
            if (this.screenshot && !this[screenshot]) {
                this[screenshot] = AbstractModel.getBlobURL(this.screenshot)
            }
        } catch (err) {
            this.screenshot = undefined
            this[screenshot] = undefined
        }
    }

    loadRels() {
        return db.transaction('r', db.tables, async () => {
            this.loadBlobs()

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
        })
    }

    delete() {
        return db.transaction('rw', db.tables, () =>
            Promise.all([
                db.visits.where({ url: this.url }).delete(),
                db.bookmarks.where({ url: this.url }).delete(),
                db.tags.where({ url: this.url }).delete(),
                db.pages.where({ url: this.url }).delete(),
            ]),
        )
    }

    save() {
        return db.transaction('rw', db.tables, async () => {
            this.loadBlobs()

            // Merge any new data with any existing
            const existing = await db.pages.get(this.url)
            if (existing) {
                this._mergeTerms('terms', existing.terms)
                this._mergeTerms('urlTerms', existing.urlTerms)
                this._mergeTerms('titleTerms', existing.titleTerms)

                if (!this.screenshot && existing.screenshot) {
                    this.screenshot = existing.screenshot
                }
            }

            // Persist current page state
            await db.pages.put(this)

            // Insert or update all associated visits + tags
            const [visitIds, tagIds] = await Promise.all([
                Promise.all(this[visitsProp].map(visit => visit.save())),
                Promise.all(this[tagsProp].map(tag => tag.save())),
            ])

            // Either try to update or delete the assoc. bookmark
            if (this[bookmarkProp] != null) {
                this[bookmarkProp].save()
            } else {
                await db.bookmarks.where({ url: this.url }).delete()
            }

            // Remove any visits no longer associated with this page
            const visitTimes = new Set(visitIds.map(([time]) => time))
            const tagNames = new Set(tagIds.map(([name]) => name))
            await Promise.all([
                db.visits
                    .where({ url: this.url })
                    .filter(visit => !visitTimes.has(visit.time))
                    .delete(),
                db.tags
                    .where({ url: this.url })
                    .filter(tag => !tagNames.has(tag.name))
                    .delete(),
            ])
        })
    }
}
