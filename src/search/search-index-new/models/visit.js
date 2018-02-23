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

    save(db) {
        return db.visits.put(this)
    }
}
