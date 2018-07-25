/**
 * Basic Model blueprint. Each Model representing a Dexie index table should extend this.
 */
export default abstract class AbstractModel {
    /**
     * Models can have properties that we don't want to be enumerable, and hence not stored in the DB when
     *  writing statements like `db.put(someModelInstance)`. This is default props that can be passed to
     *  `Object.defineProperty`.
     */
    public static DEF_NON_ENUM_PROP: PropertyDescriptor = {
        enumerable: false,
        writable: true,
    }

    /**
     * @param {Blob} blob
     * @return {string} URL that links to in-memory `blob`.
     */
    public static getBlobURL = (blob: Blob) => URL.createObjectURL(blob)

    /**
     * See: https://stackoverflow.com/a/12300351
     *
     * @param {string} url Data URI.
     * @return {Blob} Blob representation of input `url`.
     */
    public static dataURLToBlob = (url: string) => {
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

    /**
     * Persist the current Modol instance to the `db`.
     *
     * @return {Promise<any>}
     */
    public abstract async save()
}
