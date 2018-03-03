/* eslint-disable eqeqeq */

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

    /**
     * @param {Blob} blob
     * @return {string} Data URI representation of input `blob`.
     */
    static blobToDataURL = blob => URL.createObjectURL(blob)

    /**
     * See: https://stackoverflow.com/a/12300351
     *
     * @param {string} url Data URI.
     * @return {Blob} Blob representation of input `url`.
     */
    static dataURLToBlob = url => {
        const byteString = atob(url.split(',')[1])
        const mimeType = url
            .split(',')[0]
            .split(':')[1]
            .split(';')[0]
        const buffer = new ArrayBuffer(byteString.length)
        const bufferView = new Uint8Array(buffer)

        for (let i = 0; i < byteString.length; i++) {
            bufferView[i] = byteString.charCodeAt(i)
        }

        return new Blob([buffer], { type: mimeType })
    }

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
