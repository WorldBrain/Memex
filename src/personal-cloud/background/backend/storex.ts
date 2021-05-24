import createResolvable from '@josephg/resolvable'
import {
    PersonalCloudBackend,
    PersonalCloudUpdateBatch,
    PersonalCloudUpdate,
} from './types'
// import StorageManager from '@worldbrain/storex';

export class StorexPersonalCloudBackend implements PersonalCloudBackend {
    constructor(
        public options: {
            // storageManager: StorageManager
            changeSource: PersonalCloudChangeSourceView
        },
    ) {}

    pushUpdates: PersonalCloudBackend['pushUpdates'] = async (updates) => {
        await this.options.changeSource.pushUpdates(updates)
    }

    async *streamUpdates(): AsyncIterableIterator<PersonalCloudUpdateBatch> {
        yield* this.options.changeSource.streamObjects()
    }
}

export class PersonalCloudChangeSourceView {
    nextObjects = createResolvable<PersonalCloudUpdateBatch>()

    constructor(public bus: PersonalCloudChangeSourceBus, public id: number) {}

    pushUpdates: PersonalCloudBackend['pushUpdates'] = async (updates) => {
        this.bus.pushUpdate(this.id, updates)
    }

    async *streamObjects(): AsyncIterableIterator<PersonalCloudUpdateBatch> {
        while (true) {
            const nextObjects = await this.nextObjects
            yield nextObjects
        }
    }

    receiveUpdates(updates: PersonalCloudUpdateBatch) {
        const oldNextObjects = this.nextObjects
        this.nextObjects = createResolvable()
        oldNextObjects.resolve(updates)
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

    pushUpdate(sourceId: number, updates: PersonalCloudUpdateBatch) {
        for (const view of this._views) {
            if (view.id !== sourceId) {
                view.receiveUpdates(updates)
            }
        }
    }
}
