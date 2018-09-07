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

    save() {
        return db.visits.put(this)
    }
}
