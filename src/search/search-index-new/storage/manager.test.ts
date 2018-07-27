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
                    slug: { type: 'string' },
                    field1: { type: 'string' },
                },
                indices: [{ field: 'slug', pk: true }],
            })

            const migrateEggs = () => Promise.resolve()
            storageManager.registerCollection('eggs', [
                {
                    version: new Date(2018, 5, 20),
                    fields: {
                        slug: { type: 'string' },
                        field1: { type: 'string' },
                    },
                    indices: [{ field: 'slug', pk: true }],
                },
                {
                    version: new Date(2018, 5, 25),
                    fields: {
                        slug: { type: 'string' },
                        field1: { type: 'string' },
                        field2: { type: 'text' },
                    },
                    indices: [{ field: 'slug', pk: true }, { field: 'field2' }],
                    migrate: migrateEggs,
                },
            ])

            storageManager.registerCollection('foo', {
                version: new Date(2018, 5, 28),
                fields: {
                    slug: { type: 'string' },
                    field1: { type: 'string' },
                },
                indices: [{ field: 'slug', pk: true }],
            })

            storageManager.registerCollection('ham', {
                version: new Date(2018, 6, 20),
                fields: {
                    nameFirst: { type: 'string' },
                    nameLast: { type: 'string' },
                },
                indices: [
                    { field: ['nameLast', 'nameFirst'], pk: true },
                    { field: 'nameLast' },
                ],
            })

            storageManager.registerCollection('people', {
                version: new Date(2018, 6, 23),
                fields: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    ssn: { type: 'string' },
                },
                indices: [
                    { field: 'id', pk: true, autoInc: true },
                    { field: 'ssn', unique: true },
                ],
            })

            storageManager.registerCollection('dogs', {
                version: new Date(2018, 6, 26),
                fields: {
                    id: { type: 'string' },
                    biography: { type: 'text' },
                },
                indices: [
                    { field: 'biography', fullTextIndexName: 'biographyTerms' },
                    { field: 'id', pk: true },
                ],
            })

            const dexieSchemas = getDexieHistory(storageManager.registry)

            expect(dexieSchemas[0]).toEqual({
                version: 1,
                schema: {
                    eggs: 'slug',
                    spam: 'slug',
                },
                migrations: [],
            })

            expect(dexieSchemas[1]).toEqual({
                version: 2,
                schema: {
                    eggs: 'slug, *_field2_terms',
                    spam: 'slug',
                },
                migrations: [migrateEggs],
            })

            expect(dexieSchemas[2]).toEqual({
                version: 3,
                schema: {
                    eggs: 'slug, *_field2_terms',
                    foo: 'slug',
                    spam: 'slug',
                },
                migrations: [],
            })

            expect(dexieSchemas[3]).toEqual({
                version: 4,
                schema: {
                    eggs: 'slug, *_field2_terms',
                    foo: 'slug',
                    spam: 'slug',
                    ham: '[nameLast+nameFirst], nameLast',
                },
                migrations: [],
            })

            expect(dexieSchemas[4]).toEqual({
                version: 5,
                schema: {
                    eggs: 'slug, *_field2_terms',
                    foo: 'slug',
                    spam: 'slug',
                    ham: '[nameLast+nameFirst], nameLast',
                    people: '++id, &ssn',
                },
                migrations: [],
            })

            expect(dexieSchemas[5]).toEqual({
                version: 6,
                schema: {
                    eggs: 'slug, *_field2_terms',
                    foo: 'slug',
                    spam: 'slug',
                    ham: '[nameLast+nameFirst], nameLast',
                    people: '++id, &ssn',
                    dogs: 'id, *biographyTerms',
                },
                migrations: [],
            })
        })
    })
})
