/* eslint-env jest */

import updateDoc from './pouchdb-update-doc'

describe('updateDoc', () => {
    const db = {
        get: jest.fn(),
        put: jest.fn(),
    }

    beforeEach(() => {
        db.get.mockReset()
        db.put.mockReset()
    })

    test('should update the doc with the updateFunc', async () => {
        const docBeforeChange = { test: 1 }
        const docAfterChange = { test: 2 }
        const docId = 'mydoc'
        db.get.mockReturnValueOnce(docBeforeChange)
        const updateFunc = jest.fn().mockReturnValueOnce(docAfterChange)

        await updateDoc(db, docId, updateFunc)

        expect(db.get).toHaveBeenCalledWith(docId)
        expect(updateFunc).toHaveBeenCalledWith(docBeforeChange)
        expect(db.put).toHaveBeenCalledWith(docAfterChange)
    })

    test('should survive a conflict', async () => {
        const docId = 'mydoc'
        const updateFunc = jest.fn()
        const conflictError = { name: 'conflict', status: 409, error: true }
        db.put.mockImplementationOnce(doc => {
            throw conflictError
        })

        await expect(updateDoc(db, docId, updateFunc)).resolves.toBeUndefined()
    })

    test('should give up after persistent conflict', async () => {
        const docId = 'mydoc'
        const updateFunc = jest.fn()
        const conflictError = { name: 'conflict', status: 409, error: true }
        db.put.mockImplementation(doc => {
            throw conflictError
        })

        await expect(updateDoc(db, docId, updateFunc)).rejects.toMatchObject(
            conflictError,
        )
    })
})
