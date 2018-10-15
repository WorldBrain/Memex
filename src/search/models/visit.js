import db from '..'
import EventModel from './event-model'

export default class Visit extends EventModel {
    /**
     * @type {number} duration Time user was active during visit (ms).
     */
    duration

    /**
     * @type {number} scrollPx Y-axis pixel scrolled to at point in time.
     */
    scrollPx

    /**
     * @type {number} scrollPerc
     */
    scrollPerc

    /**
     * @type {number} scrollMaxPx Furthest y-axis pixel scrolled to during visit.
     */
    scrollMaxPx

    /**
     * @type {number} scrollMaxPerc
     */
    scrollMaxPerc

    constructor({ url, time, ...props }) {
        super({ url, time })

        this.duration = props.duration
        this.scrollPx = props.scrollPx
        this.scrollPerc = props.scrollPerc
        this.scrollMaxPx = props.scrollMaxPx
        this.scrollMaxPerc = props.scrollMaxPerc
    }

    get pk() {
        return [this.time, this.url]
    }

    /**
     * @param {Visit} visit
     * @returns {boolean}
     */
    _hasChanged(visit) {
        return (
            visit == null ||
            visit.duration !== this.duration ||
            visit.scrollPx !== this.scrollPx ||
            visit.scrollPerc !== this.scrollPerc ||
            visit.scrollMaxPx !== this.scrollMaxPx ||
            visit.scrollMaxPerc !== this.scrollMaxPerc
        )
    }

    async save() {
        // Only update if changes detected between existing visit and this one
        const existingVisit = await db.visits.get(this.pk)
        if (!this._hasChanged(existingVisit)) {
            return this.pk
        }

        return db.visits.put(this)
    }
}
