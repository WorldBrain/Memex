import BlobPolyfill from 'node-blob'
import atobPolyfill from 'atob'
import * as sinon from 'sinon'
import expect from 'expect'
import { BackupBackend, ObjectChange } from '../../backend'
import { BackupRestoreProcedure } from '.'
import encodeBlob from 'src/util/encode-blob'

describe('BackupRestoreProcedure', () => {
    it('the top-level procedure for restoring change sets and images should work', async () => {
        const writtenChanges = []
        const writtenImages = []
        const backupObjects = {
            'change-sets': {
                11111: { changes: ['change 1', 'change 2'] },
                22222: { changes: ['change 3', 'change 4'] },
            },
            images: {
                11111: { images: ['image 1', 'image 2'] },
                22222: { images: ['image 3', 'image 4'] },
            },
        }

        const reportedInfo = []
        const expectedInfo = [
            { info: { status: 'preparing', processedChanges: 0 } },
            {
                info: {
                    status: 'synching',
                    processedChanges: 0,
                    totalChanges: 4,
                },
            },
            {
                info: {
                    status: 'synching',
                    processedChanges: 1,
                    totalChanges: 4,
                },
            },
            {
                info: {
                    status: 'synching',
                    processedChanges: 2,
                    totalChanges: 4,
                },
            },
            {
                info: {
                    status: 'synching',
                    processedChanges: 3,
                    totalChanges: 4,
                },
            },
            {
                info: {
                    status: 'synching',
                    processedChanges: 4,
                    totalChanges: 4,
                },
            },
        ]

        const storage = {
            recording: null,
            startRecordingChanges: () => (storage.recording = true),
            stopRecordingChanges: () => (storage.recording = false),
        }
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: null,
            storage: storage as any,
        })
        expect(restoreProcedure.running).toBe(false)
        restoreProcedure._clearDatabase = async () => null
        restoreProcedure._listBackupCollection = async collection =>
            Object.keys(backupObjects[collection])
        restoreProcedure._createBackupObjectFetcher = () => {
            return async ([collection, object]) => {
                return backupObjects[collection][object]
            }
        }
        restoreProcedure._writeChange = async change => {
            expect(restoreProcedure.running).toBe(true)
            writtenChanges.push(change)
        }
        restoreProcedure._writeImage = async image => {
            expect(restoreProcedure.running).toBe(true)
            writtenImages.push(image)
        }

        const runner = restoreProcedure.runner()
        expect(storage.recording).toBe(null)
        await new Promise((resolve, reject) => {
            restoreProcedure.events.on('info', info => {
                if (info.status === 'synching') {
                    expect(storage.recording).toBe(false)
                }
                reportedInfo.push(info)
            })
            restoreProcedure.events.on('success', () => {
                resolve()
            })
            restoreProcedure.events.on('fail', err => {
                reject(err)
            })
            runner()
        })
        expect(storage.recording).toBe(true)

        expect(writtenChanges).toEqual([
            'change 1',
            'change 2',
            'change 3',
            'change 4',
        ])
        expect(writtenImages).toEqual([
            'image 1',
            'image 2',
            'image 3',
            'image 4',
        ])
        expect(restoreProcedure.running).toBe(false)
        expect(reportedInfo).toEqual(expectedInfo)
    })

    it('should list and fetch from backend correctly', async () => {
        const lists = []
        const retrievals = []
        const backend = {
            listObjects: async (collection: string) => {
                lists.push(collection)
                return ['one', 'two']
            },
            retrieveObject: async (collection: string, object: string) => {
                retrievals.push([collection, object])
                return 'bla'
            },
        } as BackupBackend
        const restoreProcedure = new BackupRestoreProcedure({
            backend,
            storageManager: null,
            storage: null,
        })
        restoreProcedure._startRecordingChanges = () => {}
        restoreProcedure._stopRecordingChanges = () => {}

        expect(await restoreProcedure._listBackupCollection('foo')).toEqual([
            'one',
            'two',
        ])
        expect(lists).toEqual(['foo'])

        expect(
            await restoreProcedure._createBackupObjectFetcher()([
                'eggs',
                'spam',
            ]),
        ).toEqual('bla')
        expect(lists).toEqual(['foo'])
        expect(retrievals).toEqual([['eggs', 'spam']])
    })

    it('should propagate errors correctly', async () => {
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: null,
            logErrors: false,
            storage: null,
        })
        restoreProcedure._clearDatabase = async () => {
            throw new Error('Muahaha!')
        }
        restoreProcedure._startRecordingChanges = () => {}
        restoreProcedure._stopRecordingChanges = () => {}

        const runner = restoreProcedure.runner()
        const boom = new Promise((resolve, reject) => {
            restoreProcedure.events.on('success', resolve)
            restoreProcedure.events.on('fail', reject)
            runner()
        })

        let rejected = false
        try {
            await boom
        } catch (e) {
            rejected = true
        }

        expect(rejected).toBe(true)
    })

    it('should not restore empty objects in place of Blobs', async () => {
        const favCreateChange: ObjectChange = {
            collection: 'favIcons',
            operation: 'create',
            objectPk: 'test.com',
            object: { favIcon: {}, hostname: 'test.com' },
            timestamp: 0,
        }
        const pageCreateChange: ObjectChange = {
            collection: 'pages',
            operation: 'create',
            objectPk: 'test.com/route',
            object: {
                url: 'test.com/route',
                screenshot: {},
                hostname: 'test.com',
            },
            timestamp: 0,
        }
        const pageUpdateChange: ObjectChange = {
            collection: 'pages',
            operation: 'update',
            objectPk: 'test.com/route',
            object: {
                url: 'test.com/route',
                screenshot: {},
                hostname: 'test.com',
            },
            timestamp: 0,
        }
        const pageDeleteChange: ObjectChange = {
            collection: 'pages',
            operation: 'delete',
            objectPk: 'test.com/route',
            timestamp: 0,
        }

        const createObject = sinon.fake()
        const updateOneObject = sinon.fake()
        const updateObjects = sinon.fake()
        const deleteOneObject = sinon.fake()
        const deleteObjects = sinon.fake()

        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: {
                collection: () => ({
                    createObject,
                    deleteOneObject,
                    deleteObjects,
                    updateOneObject,
                    updateObjects,
                }),
                registry: {
                    collections: {
                        pages: { pkIndex: 'test' },
                        favIcons: { pkIndex: 'test' },
                    },
                },
            } as any,
            logErrors: false,
            storage: null,
        })
        restoreProcedure._getBlobClass = () =>
            typeof Blob !== 'undefined' ? Blob : BlobPolyfill
        restoreProcedure._getAtobFunction = () =>
            typeof atob !== 'undefined' ? atob : atobPolyfill

        const {
            screenshot,
            ...pageWithoutScreenshotKey
        } = pageCreateChange.object

        expect(createObject.callCount).toBe(0)
        await restoreProcedure._writeChange(favCreateChange)
        expect(createObject.callCount).toBe(0)

        await restoreProcedure._writeChange(pageCreateChange)
        expect(createObject.lastCall.calledWith(pageWithoutScreenshotKey)).toBe(
            true,
        )

        await restoreProcedure._writeChange(pageUpdateChange)
        expect(
            updateObjects.lastCall.calledWith(
                {
                    test: pageUpdateChange.objectPk,
                },
                pageWithoutScreenshotKey,
            ),
        ).toBe(true)

        await restoreProcedure._writeChange(pageDeleteChange)
        expect(
            deleteObjects.lastCall.calledWith({
                test: pageDeleteChange.objectPk,
            }),
        ).toBe(true)
    })

    it('should correctly restore screenshot blobs', async () => {
        const updates = []
        const storageManager = {
            collection: collectionName => ({
                updateOneObject: async (...args) => {
                    updates.push([collectionName, ...args])
                },
            }),
        }
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: storageManager as any,
            storage: null,
        })
        restoreProcedure._getBlobClass = () =>
            typeof Blob !== 'undefined' ? Blob : BlobPolyfill
        restoreProcedure._getAtobFunction = () =>
            typeof atob !== 'undefined' ? atob : atobPolyfill
        restoreProcedure._getChangeWhere = () => ({ boo: 'bla' })
        const dataUrl = 'data:text/plain;charset=utf-8;base64,dGVzdA=='
        await restoreProcedure._writeImage({
            collection: 'pages',
            type: 'screenshot',
            data: dataUrl,
        })
        expect(updates).toEqual([
            [
                'pages',
                { boo: 'bla' },
                { $set: { screenshot: expect.any(Blob) } },
            ],
        ])
        const blob = updates[0][2].$set.screenshot
        expect(await encodeBlob(blob)).toEqual('test')
    })

    it('should correctly restore favIcon blobs', async () => {
        const updates = []
        const storageManager = {
            collection: collectionName => ({
                updateObjects: async (...args) => {
                    updates.push([collectionName, ...args])
                },
            }),
        }
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: storageManager as any,
            storage: null,
        })
        restoreProcedure._getBlobClass = () =>
            typeof Blob !== 'undefined' ? Blob : BlobPolyfill
        restoreProcedure._getAtobFunction = () =>
            typeof atob !== 'undefined' ? atob : atobPolyfill
        restoreProcedure._getChangeWhere = () => ({ boo: 'bla' })
        await restoreProcedure._writeChange({
            timestamp: 1,
            collection: 'favIcons',
            operation: 'update',
            objectPk: 'bla',
            object: {
                favIcon: 'data:text/plain;charset=utf-8;base64,dGVzdA==',
            },
        })
        expect(updates).toEqual([
            ['favIcons', { boo: 'bla' }, { favIcon: expect.any(Blob) }],
        ])
        const blob = updates[0][2].favIcon
        expect(await encodeBlob(blob)).toEqual('test')
    })

    it('should not attempt to restore empty objects', async () => {
        const changes = []
        const storageManager = {
            collection: collectionName => ({
                createObject: async (...args) => {
                    changes.push([collectionName, ...args])
                },
            }),
        }
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: storageManager as any,
            storage: null,
        })
        await restoreProcedure._writeChange({
            timestamp: 1,
            collection: 'test',
            operation: 'create',
            objectPk: 'test',
            object: {},
        })
        expect(changes).toEqual([])
    })
})
