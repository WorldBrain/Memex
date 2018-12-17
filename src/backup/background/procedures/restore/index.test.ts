import * as expect from 'expect'
import { BackupBackend } from '../../backend'
import { BackupRestoreProcedure } from '.'

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

        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: null,
        })
        expect(restoreProcedure.running).toBe(false)
        restoreProcedure._listBackupCollection = async collection =>
            Object.keys(backupObjects[collection])
        restoreProcedure._createBackupObjectFetcher = () => {
            return async ([collection, object]) =>
                backupObjects[collection][object]
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
        await new Promise((resolve, reject) => {
            restoreProcedure.events.on('info', info => {
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
        })

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
        })
        restoreProcedure._clearDatabase = () => {
            throw new Error('Muahaha!')
        }

        const runner = restoreProcedure.runner()
        const boom = new Promise((resolve, reject) => {
            restoreProcedure.events.on('success', () => {
                resolve()
            })
            restoreProcedure.events.on('fail', err => {
                reject(err)
            })
            runner()
        })

        expect(boom).rejects.toThrow('Muahaha!')
    })
})
