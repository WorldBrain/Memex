/* eslint-disable eqeqeq */
import Dexie from 'dexie'
import { blobToDataURL, dataURLToBlob } from 'blob-util'

/**
 * Basic Model blueprint. Each Model representing a Dexie index table should extend this.
 */
export default class AbstractModel {
    /**
     * Models can have properties that we don't want to be enumerable, and hence not stored in the DB when
     *  writing statements like `db.put(someModelInstance)`. This is default props that can be passed to
     *  `Object.defineProperty`.
     */
    static DEF_NON_ENUM_PROP = {
        enumerable: false,
        writable: true,
    }

    static blobToDataURL = blob => Dexie.waitFor(blobToDataURL(blob))
    static dataURLToBlob = url => Dexie.waitFor(dataURLToBlob(url))

    constructor() {
        if (this.constructor == AbstractModel) {
            throw new Error("Abstract classes can't be instantiated.")
        }
    }

    /**
     * Persist the current Modol instance to the `db`.
     *
     * @return {Promise<any>}
     */
    save() {
        throw new Error(`Method 'save' not implemented by subclass`)
    }
}
