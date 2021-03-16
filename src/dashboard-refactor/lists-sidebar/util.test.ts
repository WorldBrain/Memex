import { isListNameUnique, filterListsByQuery, ListsState } from './util'

const testData: ListsState = {
    listData: {
        [0]: {
            id: 0,
            listCreationState: 'pristine',
            name: 'test-0',
        },
        [1]: {
            id: 1,
            listCreationState: 'pristine',
            name: 'test-1',
        },
        [2]: {
            id: 2,
            listCreationState: 'pristine',
            name: 'test-2',
        },
        [3]: {
            id: 3,
            listCreationState: 'pristine',
            name: 'test-3',
        },
        [4]: {
            id: 4,
            listCreationState: 'pristine',
            name: 'test-4',
        },
        [5]: {
            id: 5,
            listCreationState: 'pristine',
            name: 'test-5',
        },

        [6]: {
            id: 6,
            listCreationState: 'pristine',
            name: 'elephant',
        },
        [7]: {
            id: 7,
            listCreationState: 'pristine',
            name: 'elevator',
        },
    },
    followedLists: {
        allListIds: [4, 5],
        filteredListIds: [4, 5],
        isExpanded: true,
        loadingState: 'pristine',
    },
    localLists: {
        allListIds: [0, 1, 2, 3, 6, 7],
        filteredListIds: [0, 1, 2, 3, 6, 7],
        isExpanded: true,
        loadingState: 'pristine',
        isAddInputShown: true,
    },
}

describe('dashboard list sidebar util tests', () => {
    const localListData = testData.localLists.allListIds.map(
        (id) => testData.listData[id],
    )
    it('should be able to determine if a given list name is unique compared with existing lists', () => {
        for (const { name: existingName } of localListData) {
            expect(isListNameUnique(existingName, testData)).toBe(false)
        }

        expect(isListNameUnique('new-name', testData)).toBe(true)
        expect(isListNameUnique('test', testData)).toBe(true)
        expect(isListNameUnique('test-9', testData)).toBe(true)
        expect(isListNameUnique('test-1123', testData)).toBe(true)
    })

    it('should be able to skip lists upon specification, for the purpose of editing list names', () => {
        for (const { name: existingName, id } of localListData) {
            expect(
                isListNameUnique(existingName, testData, {
                    listIdToSkip: id,
                }),
            ).toBe(true)
        }
    })

    it('should be able to filter lists by name query', () => {
        const testLocalListIds = [0, 1, 2, 3]

        expect(filterListsByQuery('tes', testData)).toEqual({
            localListIds: testLocalListIds,
            followedListIds: testData.followedLists.allListIds,
        })
        expect(filterListsByQuery('test', testData)).toEqual({
            localListIds: testLocalListIds,
            followedListIds: testData.followedLists.allListIds,
        })
        expect(filterListsByQuery('test-', testData)).toEqual({
            localListIds: testLocalListIds,
            followedListIds: testData.followedLists.allListIds,
        })
        expect(filterListsByQuery('test-5', testData)).toEqual({
            localListIds: [],
            followedListIds: [5],
        })
        expect(filterListsByQuery('test-1', testData)).toEqual({
            localListIds: [1],
            followedListIds: [],
        })
        expect(filterListsByQuery('ele', testData)).toEqual({
            localListIds: [6, 7],
            followedListIds: [],
        })
        expect(filterListsByQuery('elE', testData)).toEqual({
            localListIds: [6, 7],
            followedListIds: [],
        })
        expect(filterListsByQuery('ELE', testData)).toEqual({
            localListIds: [6, 7],
            followedListIds: [],
        })
        expect(filterListsByQuery('elev', testData)).toEqual({
            localListIds: [7],
            followedListIds: [],
        })
        expect(filterListsByQuery('eleph', testData)).toEqual({
            localListIds: [6],
            followedListIds: [],
        })
        expect(filterListsByQuery('eleeeee', testData)).toEqual({
            localListIds: [],
            followedListIds: [],
        })
    })
})
