const dataURI = require('datauri')

const datauri = new dataURI()

export default abstract class AbstractModel {
    public static DEF_NON_ENUM_PROP: PropertyDescriptor = {
        enumerable: false,
        writable: true,
    }

    public static getBlobURL = (buffer: Buffer) => {
        datauri.format('.png', buffer)
        return datauri.content
    }

    public static dataURLToBlob = (url: string) => {
        const regex = /^data:.+\/(.+);base64,(.*)$/

        const [, , data] = url.match(regex)
        return Buffer.from(data, 'base64')
    }

    public abstract async save()
}
