import type { UnifiedList } from 'src/annotations/cache/types'
import { filterListsByQuery } from './util'

const testData: Pick<UnifiedList, 'unifiedId' | 'name'>[] = [
    {
        unifiedId: '0',
        name: 'test-0',
    },
    {
        unifiedId: '1',
        name: 'test-1',
    },
    {
        unifiedId: '2',
        name: 'test-2',
    },
    {
        unifiedId: '3',
        name: 'test-3',
    },
    {
        unifiedId: '4',
        name: 'test-4',
    },
    {
        unifiedId: '5',
        name: 'test-5',
    },
    {
        unifiedId: '6',
        name: 'elephant',
    },
    {
        unifiedId: '7',
        name: 'elevator',
    },
]

describe('dashboard list sidebar util tests', () => {
    it('should be able to filter lists by name query', () => {
        expect(filterListsByQuery('tes', testData)).toEqual([
            testData[0],
            testData[1],
            testData[2],
            testData[3],
            testData[4],
            testData[5],
        ])
        expect(filterListsByQuery('test', testData)).toEqual([
            testData[0],
            testData[1],
            testData[2],
            testData[3],
            testData[4],
            testData[5],
        ])
        expect(filterListsByQuery('test-', testData)).toEqual([
            testData[0],
            testData[1],
            testData[2],
            testData[3],
            testData[4],
            testData[5],
        ])
        expect(filterListsByQuery('test-5', testData)).toEqual([testData[5]])
        expect(filterListsByQuery('test-1', testData)).toEqual([testData[1]])
        expect(filterListsByQuery('ele', testData)).toEqual([
            testData[6],
            testData[7],
        ])
        expect(filterListsByQuery('elE', testData)).toEqual([
            testData[6],
            testData[7],
        ])
        expect(filterListsByQuery('ELE', testData)).toEqual([
            testData[6],
            testData[7],
        ])
        expect(filterListsByQuery('elev', testData)).toEqual([testData[7]])
        expect(filterListsByQuery('eleph', testData)).toEqual([testData[6]])
        expect(filterListsByQuery('eleeeee', testData)).toEqual([])
    })
})
