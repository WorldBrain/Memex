import * as expect from 'expect'
import { BackupRestoreProcedure } from '.'

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

        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: null,
        })
        restoreProcedure._listBackupCollection = collection =>
            Object.keys(backupObjects[collection])
        restoreProcedure._createBackupObjectFetcher = () => {
            return async item => backupObjects[item[0]][item[1]]
        }
        restoreProcedure._writeChange = async change => {
            writtenChanges.push(change)
        }
        restoreProcedure._writeImage = async image => {
            writtenImages.push(image)
        }

        const runner = restoreProcedure.runner()
        await new Promise((resolve, reject) => {
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
    })

    it('should propagate errors correctly', async () => {
        const restoreProcedure = new BackupRestoreProcedure({
            backend: null,
            storageManager: null,
        })
        restoreProcedure._clearAndBlockDatabase = () => {
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
