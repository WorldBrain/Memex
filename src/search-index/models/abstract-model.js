/* eslint-disable eqeqeq */

/**
 * Basic Model blueprint. Each Model representing a Dexie index table should extend this.
 */
export default class AbstractModel {
    constructor() {
        if (this.constructor == AbstractModel) {
            throw new Error("Abstract classes can't be instantiated.")
        }
    }

    /**
     * Persist the current Modol instance to the `db`.
     *
     * @param {Dexie} db Dexie DB instance to use to save this model instance.
     * @return {Promise<any>}
     */
    save(db) {
        throw new Error(`Method 'save' not implemented by subclass`)
    }
}
