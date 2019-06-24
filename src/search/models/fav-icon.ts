import Storex from '@worldbrain/storex'

import AbstractModel from './abstract-model'

const favIcon = Symbol('favIconURI')

export interface Props {
    hostname: string
    favIconURI: string
}

export default class FavIcon extends AbstractModel {
    public hostname: string
    public favIcon: Blob

    constructor(db: Storex, { hostname, favIconURI }: Props) {
        super(db)

        this.hostname = hostname
        this.favIconURI = favIconURI

        // Non-enumerable prop to hold the favIcon in-mem Blob link
        Object.defineProperty(this, favIcon, AbstractModel.DEF_NON_ENUM_PROP)
    }

    get data() {
        return {
            hostname: this.hostname,
            favIcon: this.favIcon,
        }
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
        return this.db
            .collection('favIcons')
            .deleteOneObject({ hostname: this.hostname })
    }

    public async save() {
        if (this.favIcon !== null) {
            const { object } = await this.db
                .collection('favIcons')
                .createObject(this.data)
            return object.hostname
        }
    }
}
