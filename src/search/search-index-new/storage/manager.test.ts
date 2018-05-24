/* eslint-env jest */
import { StorageManager } from './manager'
import { getDexieHistory } from './dexie-schema'

describe('StorageManager', () => {
    describe('Dexie schema generation', () => {
        test('it should work', () => {
            const storageManager = new StorageManager()
            storageManager.registerCollection('spam', {
                version: new Date(2018, 5, 20),
                fields: {
                    slug: { type: 'string', pk: true },
                    field1: { type: 'string' },
                },
                indices: ['slug'],
            })

            const migrateEggs = () => Promise.resolve()
            storageManager.registerCollection('eggs', [
                {
                    version: new Date(2018, 5, 20),
                    fields: {
                        slug: { type: 'string', pk: true },
                        field1: { type: 'string' },
                    },
                    indices: ['slug'],
                },
                {
                    version: new Date(2018, 5, 25),
                    fields: {
                        slug: { type: 'string', pk: true },
                        field1: { type: 'string' },
                        field2: { type: 'text' },
                    },
                    indices: ['slug', 'field2'],
                    migrate: migrateEggs,
                },
            ])
            storageManager.registerCollection('foo', {
                version: new Date(2018, 5, 28),
                fields: {
                    slug: { type: 'string', pk: true },
                    field1: { type: 'string' },
                },
                indices: ['slug'],
            })
            expect(getDexieHistory(storageManager.registry)).toEqual([
                {
                    version: 1,
                    schema: {
                        eggs: 'slug, field1',
                        spam: 'slug, field1',
                    },
                    migrations: [],
                },
                {
                    version: 2,
                    schema: {
                        eggs: 'slug, *field2, field1',
                        spam: 'slug, field1',
                    },
                    migrations: [migrateEggs],
                },
                {
                    version: 3,
                    schema: {
                        eggs: 'slug, *field2, field1',
                        foo: 'slug, field1',
                        spam: 'slug, field1',
                    },
                    migrations: [],
                },
            ])
        })
    })
})
