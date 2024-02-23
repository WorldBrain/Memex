import expect from 'expect'
import {
    OrderedItem,
    OrderedItemChanges,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import * as ordering from '@worldbrain/memex-common/lib/utils/item-ordering'

function test(
    items: OrderedItem[],
    getChanges: (items: OrderedItem[]) => OrderedItemChanges,
    expected: OrderedItem[],
) {
    const changed = withChanges(items, getChanges)
    expect(changed).toEqual(expected)
    return changed
}

function withChanges(
    items: OrderedItem[],
    getChanges: (items: OrderedItem[]) => OrderedItemChanges,
): OrderedItem[] {
    const byId: { [id: string]: OrderedItem } = {}
    for (const item of items) {
        byId[item.id] = { id: item.id, key: item.key }
    }

    const changes = getChanges(items)
    for (const change of [
        ...(changes.create ? [changes.create] : []),
        ...(changes.update ?? []),
    ]) {
        byId[change.id] = { id: change.id, key: change.key }
    }
    const values = Object.values(byId)
    values.sort((a, b) => {
        if (a.key === b.key) {
            return 0
        }
        return a.key < b.key ? -1 : 1
    })
    return values
}

function mutations(options: {
    spaceBetween: number
    maxKey: number
    defaultKey: number
}) {
    return {
        push: (items: OrderedItem[], key: string) =>
            ordering.pushOrderedItem(
                items,
                key,
                options.spaceBetween,
                options.defaultKey,
                options.maxKey,
            ),
        insertBeforeIndex: (items: OrderedItem[], id: string, index: number) =>
            ordering.insertOrderedItemBeforeIndex(
                items,
                id,
                index,
                options.spaceBetween,
                options.maxKey,
            ),
    }
}

describe('Item ordering', () => {
    it('should push', () => {
        const { push } = mutations({
            spaceBetween: 5,
            defaultKey: 10,
            maxKey: 20,
        })
        const initial: OrderedItem[] = []
        const changed1 = test(initial, (items) => push(items, 'one'), [
            { id: 'one', key: 10 },
        ])
        const changed2 = test(changed1, (items) => push(items, 'two'), [
            { id: 'one', key: 10 },
            { id: 'two', key: 15 },
        ])
        const changed3 = test(changed2, (items) => push(items, 'three'), [
            { id: 'one', key: 10 },
            { id: 'two', key: 15 },
            { id: 'three', key: 20 },
        ])
        expect(() => push(changed3, 'four')).toThrow(
            new ordering.ItemOrderError(`No space left to push ordered item`),
        )
    })

    it('should insert before index', () => {
        const { insertBeforeIndex } = mutations({
            spaceBetween: 10,
            defaultKey: 10,
            maxKey: 20,
        })
        const initial: OrderedItem[] = [
            { id: 'one', key: 17 },
            { id: 'two', key: 20 },
        ]

        const expectedChanged1: OrderedItem[] = [
            { id: 'one', key: 17 },
            { id: 'three', key: 18 },
            { id: 'two', key: 20 },
        ]
        const changed1 = test(
            initial,
            (items) => insertBeforeIndex(items, 'three', 1),
            expectedChanged1,
        )

        const expectedChanged2: OrderedItem[] = [
            { id: 'one', key: 17 },
            { id: 'three', key: 18 },
            { id: 'four', key: 19 },
            { id: 'two', key: 20 },
        ]
        const changed2 = test(
            changed1,
            (items) => insertBeforeIndex(items, 'four', 2),
            expectedChanged2,
        )
        expect(() => insertBeforeIndex(changed2, 'five', 3)).toThrow(
            new ordering.ItemOrderError(
                `No space left to insert ordered item before index: 3`,
            ),
        )
        expect(() => insertBeforeIndex(changed2, 'five', 50)).toThrow(
            `Tried to insert item before non-existing index: 50`,
        )
    })

    it('should insert at the start', () => {
        const { insertBeforeIndex } = mutations({
            spaceBetween: 10,
            defaultKey: 10,
            maxKey: 20,
        })
        const initial: OrderedItem[] = [
            { id: 'one', key: 17 },
            { id: 'two', key: 20 },
        ]

        const expectedChanged1: OrderedItem[] = [
            { id: 'three', key: 7 },
            { id: 'one', key: 17 },
            { id: 'two', key: 20 },
        ]
        test(
            initial,
            (items) => insertBeforeIndex(items, 'three', 0),
            expectedChanged1,
        )

        // No more space left before the first item (first key - spaceBetween < 0)
        //  TODO: Add support for new start keys when the remaining space is < spaceBetween
        expect(() => insertBeforeIndex(expectedChanged1, 'four', 0)).toThrow(
            new ordering.ItemOrderError(
                `No space left to insert ordered item before index: 0`,
            ),
        )
    })
})
