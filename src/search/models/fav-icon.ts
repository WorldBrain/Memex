import db from '..'
import AbstractModel from './abstract-model'

const favIcon = Symbol('favIconURI')

export interface Props {
    hostname: string
    favIconURI: string
}

export default class FavIcon extends AbstractModel {
    public hostname: string
    public favIcon: Blob

    constructor({ hostname, favIconURI }: Props) {
        super()

        this.hostname = hostname
        this.favIconURI = favIconURI

        // Non-enumerable prop to hold the favIcon in-mem Blob link
        Object.defineProperty(this, favIcon, AbstractModel.DEF_NON_ENUM_PROP)
    }

    get favIconURI() {
        if (this.favIcon && !this[favIcon]) {
            return AbstractModel.getBlobURL(this.favIcon)
        }

        return this[favIcon]
    }

    set favIconURI(dataURI: string) {
        if (dataURI) {
            try {
                this.favIcon = AbstractModel.dataURLToBlob(dataURI)
                this[favIcon] = AbstractModel.getBlobURL(this.favIcon)
            } catch (err) {
                console.error(err)
            }
        }
    }

    public async delete() {
        return db.transaction('rw', db.favIcons, () =>
            db.favIcons.delete(this.hostname),
        )
    }

    public async save() {
        return db.transaction('rw', db.favIcons, () => {
            // Could have been errors converting the data url to blob
            if (this.favIcon !== null) {
                db.favIcons.put(this)
            }
        })
    }
}
