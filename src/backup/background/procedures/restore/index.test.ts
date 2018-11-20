import * as expect from 'expect'
import { BackupRestoreProcedure } from '.'
import { BackupBackend } from 'src/backup/background/backend'

describe('BackupRestoreProcedure', () => {
    it('the top-level procedure for restoring change sets and images should work', async () => {
        const writtenChanges = []
        const writtenImages = []
        const backupObjects = {
            'change-sets': {
                11111: ['change 1', 'change 2'],
                22222: ['change 3', 'change 4'],
            },
            images: {
                11111: ['image 1', 'image 2'],
                22222: ['image 3', 'image 4'],
            },
        }

        const reportedInfo = []
        const expectedInfo = [
            { status: 'preparing', processedObjects: 0 },
            { status: 'synching', processedObjects: 0, totalObjects: 4 },
            { status: 'synching', processedObjects: 1, totalObjects: 4 },
            { status: 'synching', processedObjects: 2, totalObjects: 4 },
            { status: 'synching', processedObjects: 3, totalObjects: 4 },
            { status: 'synching', processedObjects: 4, totalObjects: 4 },
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
