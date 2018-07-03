import DataURI from 'datauri'

const datauri = new DataURI()

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

        const matches = url.match(regex)
        const ext = matches[1]
        const data = matches[2]
        return new Buffer(data, 'base64')
    }

    public abstract async save()
}
