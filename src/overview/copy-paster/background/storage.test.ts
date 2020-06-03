import StorageManager from '@worldbrain/storex'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

import CopyPasterBackground from './'

async function setupTest() {
    const {
        backgroundModules,
        storageManager,
    } = await setupBackgroundIntegrationTest()

    const copyPaster: CopyPasterBackground = backgroundModules.copyPaster

    registerModuleMapCollections(storageManager.registry, {
        copyPaster: copyPaster.storage,
    })

    return { copyPaster }
}

describe('create template', () => {
    test('should be able to create template', async () => {
        const { copyPaster } = await setupTest()

        const result = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
        })

        expect(result).toBe(1)
    })

    test('should be able to find template', async () => {
        const { copyPaster } = await setupTest()

        const newTemplate = {
            title: 'template test',
            code: '',
        }

        await copyPaster.createTemplate(newTemplate)

        const result = await copyPaster.findTemplate({ id: 1 })

        expect(result).toEqual({ ...newTemplate, id: 1, isFavourite: false })
    })

    test('should be able to update template', async () => {
        const { copyPaster } = await setupTest()

        await copyPaster.createTemplate({
            title: 'template test',
            code: '',
        })

        await copyPaster.updateTemplate({
            id: 1,
            title: 'test 2',
            code: '',
        })

        const result = await copyPaster.findTemplate({ id: 1 })

        expect(result).toEqual({
            id: 1,
            title: 'test 2',
            code: '',
            isFavourite: false,
        })
    })

    test('should be able to delete template', async () => {
        const { copyPaster } = await setupTest()
        let result

        await copyPaster.createTemplate({
            title: 'template test',
            code: '',
        })

        result = await copyPaster.findAllTemplates()
        expect(result.length).toBe(1)

        await copyPaster.deleteTemplate({
            id: 1,
        })

        result = await copyPaster.findAllTemplates()
        expect(result.length).toBe(0)
    })
})
