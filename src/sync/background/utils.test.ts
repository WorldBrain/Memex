import { StorageModuleCollections } from '@worldbrain/storex-pattern-modules'
import { mapCollectionVersions } from './utils'

const TEST_STORAGE_COLLECTIONS: StorageModuleCollections = {
    foo: {
        history: [
            {
                version: new Date('2019-01-01'),
                fields: {
                    spam: { type: 'text' },
                },
            },
            {
                version: new Date('2019-03-03'),
                fields: {
                    spam: { type: 'text' },
                    eggs: { type: 'text' },
                },
            },
        ],
        version: new Date('2019-05-05'),
        fields: {
            spam: { type: 'text' },
            eggs: { type: 'text' },
        },
    },
}

describe('Collection version mapping', () => {
    it('should work', () => {
        expect(
            mapCollectionVersions({
                collectionDefinitions: TEST_STORAGE_COLLECTIONS,
                mappings: [
                    {
                        moduleVersion: new Date('2019-01-01'),
                        applicationVersion: new Date('2019-02-02'),
                    },
                    {
                        moduleVersion: new Date('2019-03-03'),
                        applicationVersion: new Date('2019-04-04'),
                    },
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...TEST_STORAGE_COLLECTIONS.foo,
                version: new Date('2019-06-06'),
                history: [
                    {
                        ...TEST_STORAGE_COLLECTIONS.foo.history![0],
                        version: new Date('2019-02-02'),
                    },
                    {
                        ...TEST_STORAGE_COLLECTIONS.foo.history![1],
                        version: new Date('2019-04-04'),
                    },
                ],
            },
        })
    })

    it('should ignore collection history from before the module was used in the application', () => {
        expect(
            mapCollectionVersions({
                collectionDefinitions: TEST_STORAGE_COLLECTIONS,
                mappings: [
                    {
                        moduleVersion: new Date('2019-03-03'),
                        applicationVersion: new Date('2019-04-04'),
                    },
                    {
                        moduleVersion: new Date('2019-05-05'),
                        applicationVersion: new Date('2019-06-06'),
                    },
                ],
            }),
        ).toEqual({
            foo: {
                ...TEST_STORAGE_COLLECTIONS.foo,
                version: new Date('2019-06-06'),
                history: [
                    {
                        ...TEST_STORAGE_COLLECTIONS.foo.history![1],
                        version: new Date('2019-04-04'),
                    },
                ],
            },
        })
    })
})
