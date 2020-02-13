import AbstractModel from './abstract-model'

export default class Tag extends AbstractModel {
    public name: string
    public url: string

    constructor(db, { name, url }) {
        super(db)
        this.name = name
        this.url = url
    }

    get data() {
        return {
            url: this.url,
            name: this.name,
        }
    }

    async save() {
        const { object } = await this.db
            .collection('tags')
            .createObject(this.data)
        return [object.name, object.url]
    }

    async delete() {
        return this.db
            .collection('tags')
            .deleteOneObject({ name: this.name, url: this.url })
    }
}
