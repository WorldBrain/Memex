/* eslint-env jest */

import { getAllNodes, getRoot } from './tree-walker'

const testTrees = (() => {
    const _edges = {
        // Tree one.
        a: { parent: undefined, children: ['b', 'c'] },
        b: { parent: 'a', children: [] },
        c: { parent: 'a', children: ['d', 'e'] },
        d: { parent: 'c', children: [] },
        e: { parent: 'c', children: [] },
        // Tree two.
        f: { parent: undefined, children: ['g'] },
        g: { parent: 'f', children: ['h'] },
        h: { parent: 'g', children: [] },
    }
    return {
        _edges,
        getParent: async node => _edges[node].parent,
        getChildren: async node => _edges[node].children,
    }
})()

describe('getAllNodes', () => {
    const getAllNodesOfTestTree = getAllNodes(testTrees)

    test('gets all nodes given a leaf node', async () => {
        const nodes = [
            (await getAllNodesOfTestTree('e')).sort(),
            (await getAllNodesOfTestTree('h')).sort(),
        ]
        expect(nodes).toEqual([['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h']])
    })

    test('gets all nodes given a non-leaf node', async () => {
        const nodes = [
            (await getAllNodesOfTestTree('c')).sort(),
            (await getAllNodesOfTestTree('g')).sort(),
        ]
        expect(nodes).toEqual([['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h']])
    })

    test('gets all nodes given the root node', async () => {
        const nodes = [
            (await getAllNodesOfTestTree('a')).sort(),
            (await getAllNodesOfTestTree('f')).sort(),
        ]
        expect(nodes).toEqual([['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h']])
    })
})

describe('getRoot', () => {
    const getRootOfTestTree = getRoot(testTrees)

    test('gets the root given a leaf node', async () => {
        const roots = [
            await getRootOfTestTree('e'),
            await getRootOfTestTree('h'),
        ]
        expect(roots).toEqual(['a', 'f'])
    })

    test('gets the root given a non-leaf node', async () => {
        const roots = [
            await getRootOfTestTree('c'),
            await getRootOfTestTree('g'),
        ]
        expect(roots).toEqual(['a', 'f'])
    })

    test('gets the root given the root node itself', async () => {
        const roots = [
            await getRootOfTestTree('a'),
            await getRootOfTestTree('f'),
        ]
        expect(roots).toEqual(['a', 'f'])
    })
})
