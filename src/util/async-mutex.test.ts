import expect from 'expect'
import { AsyncMutex } from '@worldbrain/memex-common/lib/utils/async-mutex'

describe('AsyncMutex', () => {
    it('should work', async () => {
        let allFinished = false
        const mutex = new AsyncMutex()
        const lockResult1 = await mutex.lock()

        let secondLockObtained = false
        const lockPromise2 = mutex.lock().then((result) => {
            secondLockObtained = true
            return result
        })
        const waitPromise = mutex.wait().then(() => {
            allFinished = true
        })

        expect(secondLockObtained).toEqual(false)
        expect(allFinished).toEqual(false)
        expect(lockResult1).toEqual(
            expect.objectContaining({ releaseMutex: expect.any(Function) }),
        )

        lockResult1.releaseMutex()
        const lockResult2 = await lockPromise2
        expect(lockResult2).toEqual(
            expect.objectContaining({ releaseMutex: expect.any(Function) }),
        )
        expect(secondLockObtained).toEqual(true)
        expect(allFinished).toEqual(false)

        lockResult2.releaseMutex()
        await waitPromise
        expect(allFinished).toEqual(true)
    })
})
