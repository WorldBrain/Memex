import expect from 'expect'
import { generateSyncPatterns } from './sync-patterns'

describe('Sync pattern generator', () => {
    it('should generate interesting combinations for 2 devices with 3 steps', () => {
        expect(Array.from(generateSyncPatterns(['A', 'B'], 3))).toEqual([
            ['A', 'B', 'A'],
            ['A', 'A', 'B'],
        ])
    })

    it('should generate interesting combinations for 2 devices with 4 steps', () => {
        expect(Array.from(generateSyncPatterns(['A', 'B'], 4))).toEqual([
            ['A', 'A', 'B', 'A'],
            ['A', 'B', 'B', 'A'],
            ['A', 'A', 'A', 'B'],
            ['A', 'B', 'A', 'B'],
        ])
    })

    it('should generate interesting combinations for 2 devices with 5 steps', () => {
        expect(Array.from(generateSyncPatterns(['A', 'B'], 5))).toEqual([
            ['A', 'A', 'A', 'B', 'A'],
            ['A', 'B', 'A', 'B', 'A'],
            ['A', 'A', 'B', 'B', 'A'],
            ['A', 'B', 'B', 'B', 'A'],
            ['A', 'A', 'A', 'A', 'B'],
            ['A', 'B', 'A', 'A', 'B'],
            ['A', 'A', 'B', 'A', 'B'],
            ['A', 'B', 'B', 'A', 'B'],
        ])
    })

    it('should generate interesting combinations for 2 devices with 6 steps', () => {
        expect(Array.from(generateSyncPatterns(['A', 'B'], 6))).toEqual([
            ['A', 'A', 'A', 'A', 'B', 'A'],
            ['A', 'B', 'A', 'A', 'B', 'A'],
            ['A', 'A', 'B', 'A', 'B', 'A'],
            ['A', 'B', 'B', 'A', 'B', 'A'],
            ['A', 'A', 'A', 'B', 'B', 'A'],
            ['A', 'B', 'A', 'B', 'B', 'A'],
            ['A', 'A', 'B', 'B', 'B', 'A'],
            ['A', 'B', 'B', 'B', 'B', 'A'],
            ['A', 'A', 'A', 'A', 'A', 'B'],
            ['A', 'B', 'A', 'A', 'A', 'B'],
            ['A', 'A', 'B', 'A', 'A', 'B'],
            ['A', 'B', 'B', 'A', 'A', 'B'],
            ['A', 'A', 'A', 'B', 'A', 'B'],
            ['A', 'B', 'A', 'B', 'A', 'B'],
            ['A', 'A', 'B', 'B', 'A', 'B'],
            ['A', 'B', 'B', 'B', 'A', 'B'],
        ])
    })
})
