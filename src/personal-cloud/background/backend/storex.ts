import createResolvable from '@josephg/resolvable'
import {
    PersonalCloudBackend,
    PersonalCloudObjectBatch,
    PersonalCloudObject,
} from './types'
// import StorageManager from '@worldbrain/storex';

export class StorexPersonalCloudBackend implements PersonalCloudBackend {
    constructor(
        public options: {
            // storageManager: StorageManager
            changeSource: PersonalCloudChangeSourceView
        },
    ) {}

    async pushObject(
        params: {
            schemaVersion: Date
        } & PersonalCloudObject,
    ): Promise<void> {
        this.options.changeSource.pushObject({ objects: [params] })
    }

    async *streamObjects(): AsyncIterableIterator<PersonalCloudObjectBatch> {
        yield* this.options.changeSource.streamObjects()
    }
}

export class PersonalCloudChangeSourceView {
    nextObjects = createResolvable<PersonalCloudObjectBatch>()

    constructor(public bus: PersonalCloudChangeSourceBus, public id: number) {}

    async pushObject(batch: PersonalCloudObjectBatch): Promise<void> {
        this.bus.pushObjects(this.id, batch)
    }

    async *streamObjects(): AsyncIterableIterator<PersonalCloudObjectBatch> {
        while (true) {
            const nextObjects = await this.nextObjects
            yield nextObjects
        }
    }

    receiveObjects(batch: PersonalCloudObjectBatch) {
        const oldNextObjects = this.nextObjects
        this.nextObjects = createResolvable()
        oldNextObjects.resolve(batch)
    }
}

export class PersonalCloudChangeSourceBus {
    _generatedIds = 0
    _views: PersonalCloudChangeSourceView[] = []

    getView(): PersonalCloudChangeSourceView {
        const source = new PersonalCloudChangeSourceView(
            this,
            ++this._generatedIds,
        )
        this._views.push(source)
        return source
    }

    pushObjects(sourceId: number, batch: PersonalCloudObjectBatch) {
        for (const view of this._views) {
            if (view.id !== sourceId) {
                view.receiveObjects(batch)
            }
        }
    }
}
