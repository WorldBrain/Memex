import * as expect from 'expect'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import CustomListBackground from '.'
import initStorageManager from 'src/search/memory-storex'

async function setupTest() {
    const storageManager = initStorageManager()
    const background = new CustomListBackground({ storageManager })

    registerModuleMapCollections(storageManager.registry, {
        customLists: background.storage,
    })
    await storageManager.finishInitialization()

    return { background }
}

describe('custom list background tests', () => {
    it('should be able to bulk insert lists without affecting existing lists', async () => {
        const { background } = await setupTest()

        const listNames = ['listA', 'listB', 'listC', 'listD', 'listE']

        // Ensure some lists exists first
        const listAId = await background.createCustomList({
            name: listNames[0],
        })
        const listBId = await background.createCustomList({
            name: listNames[1],
        })

        // Try bulk inserting, including those lists that already exist
        const listIds = await background.createCustomLists({ names: listNames })

        expect(listIds.length).toBe(listNames.length)
        // Those previously created list IDs should be present in the bulk output
        expect(listIds).toEqual(expect.arrayContaining([listAId, listBId]))
    })
})
