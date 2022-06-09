import { filterListsByQuery, ListsState } from './util'

const testData: ListsState = {
    listData: {
        [0]: {
            id: 0,
            name: 'test-0',
        },
        [1]: {
            id: 1,
            name: 'test-1',
        },
        [2]: {
            id: 2,
            name: 'test-2',
        },
        [3]: {
            id: 3,
            name: 'test-3',
        },
        [4]: {
            id: 4,
            name: 'test-4',
        },
        [5]: {
            id: 5,
            name: 'test-5',
        },

        [6]: {
            id: 6,
            name: 'elephant',
        },
        [7]: {
            id: 7,
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
