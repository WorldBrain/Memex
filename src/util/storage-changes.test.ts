import { browser, Storage } from 'webextension-polyfill-ts'

import { storageChangesManager, StorageAreaName } from './storage-changes'

const storageAreas: StorageAreaName[] = ['sync', 'local', 'managed']
const testKeyA = 'testA'
const testKeyB = 'testB'

describe('Storage changes listeners manager', () =>
    storageAreas.forEach(areaName =>
        describe(`${areaName} storage`, () => {
            beforeEach(() => storageChangesManager.resetListeners())

            test('Can schedule new listeners', () => {
                const mockListenerA = jest.fn()
                const mockListenerB = jest.fn()

                storageChangesManager.addListener(
                    areaName,
                    testKeyA,
                    mockListenerA,
                )

                const storedListenerA = storageChangesManager['listeners']
                    .get(areaName)
                    .get(testKeyA)
                expect(storedListenerA).toEqual(mockListenerA)

                storageChangesManager.addListener(
                    areaName,
                    testKeyB,
                    mockListenerB,
                )
                const storedListenerB = storageChangesManager['listeners']
                    .get(areaName)
                    .get(testKeyB)
                expect(storedListenerB).toEqual(mockListenerB)
            })

            test('Can invoke scheduled listeners', async () => {
                const newData = 'test'
                const mockListenerA = jest.fn()
                const mockListenerB = jest.fn()

                storageChangesManager.addListener(
                    areaName,
                    testKeyA,
                    mockListenerA,
                )
                storageChangesManager.addListener(
                    areaName,
                    testKeyB,
                    mockListenerB,
                )

                // Simulate change that affects A
                expect(mockListenerA.mock.calls.length).toBe(0)
                const change = { oldValue: undefined, newValue: newData }
                storageChangesManager['handleChanges'](
                    { [testKeyA]: { ...change } },
                    areaName,
                )
                expect(mockListenerA.mock.calls.length).toBe(1)
                expect(mockListenerA.mock.calls[0][0]).toEqual(change)

                // Simulate change that affects B
                expect(mockListenerB.mock.calls.length).toBe(0)
                storageChangesManager['handleChanges'](
                    { [testKeyB]: { ...change } },
                    areaName,
                )
                expect(mockListenerB.mock.calls.length).toBe(1)
                expect(mockListenerB.mock.calls[0][0]).toEqual(change)

                // Simulate change that affects both
                expect(mockListenerA.mock.calls.length).toBe(1)
                expect(mockListenerB.mock.calls.length).toBe(1)
                storageChangesManager['handleChanges'](
                    {
                        [testKeyB]: { ...change },
                        [testKeyA]: { ...change },
                    },
                    areaName,
                )
                expect(mockListenerA.mock.calls.length).toBe(2)
                expect(mockListenerB.mock.calls.length).toBe(2)
                expect(mockListenerA.mock.calls[0][0]).toEqual(change)
                expect(mockListenerB.mock.calls[0][0]).toEqual(change)
            })
        }),
    ))
