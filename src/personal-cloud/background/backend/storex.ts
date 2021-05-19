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
        // this.options.changeSource.pushObject({ objects: [params] })
    }

    async *streamObjects(): AsyncIterableIterator<PersonalCloudObjectBatch> {
        return this.options.changeSource.streamObjects()
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
            yield await this.nextObjects
        }
    }

    receiveObjects(batch: PersonalCloudObjectBatch) {
        this.nextObjects.resolve(batch)
        this.nextObjects = createResolvable()
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
