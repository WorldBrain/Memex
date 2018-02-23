import AbstractModel from './abstract-model'

/**
 * Basic event-related data type blueprint.
 * Each Model representing a some kind of event in time should be extended from this.
 */
export default class EventModel extends AbstractModel {
    /**
     * @param {string} args.url The URL/page associated with the event.
     * @param {number} args.time The time at which the event took place.
     */
    constructor({ url, time }) {
        super()

        this.url = url
        this.time = typeof time === 'number' ? time : +time
    }
}
