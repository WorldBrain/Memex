import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

import type CopyPasterBackground from '.'
import type { Template } from '../types'

async function setupTest() {
    const { backgroundModules } = await setupBackgroundIntegrationTest()

    const copyPaster: CopyPasterBackground = backgroundModules.copyPaster

    return { copyPaster }
}

describe('Copy-paster template storage tests', () => {
    test('should be able to create and find a template', async () => {
        const { copyPaster } = await setupTest()

        const newTemplate: Omit<Template, 'id'> = {
            title: 'template test',
            code: '',
            order: 0,
            isFavourite: false,
            outputFormat: 'markdown',
        }

        const id = await copyPaster.createTemplate(newTemplate)

        const result = await copyPaster.findTemplate({ id })

        expect(result).toEqual({ ...newTemplate, id })
    })

    // TODO: Fix this test
    test.skip('should be able to update a template', async () => {
        return
        const { copyPaster } = await setupTest()

        const id = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            order: 1,
            isFavourite: false,
            outputFormat: 'markdown',
        })

        await copyPaster.updateTemplate({
            id,
            title: 'test 2',
            code: '',
            order: 2,
            isFavourite: false,
            outputFormat: 'markdown',
        })

        const result = await copyPaster.findTemplate({ id })

        expect(result).toEqual({
            id,
            title: 'test 2',
            code: '',
            isFavourite: false,
            order: 2,
        })
    })

    test('should be able to delete a template', async () => {
        const { copyPaster } = await setupTest()
        let result

        const id = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            order: 2,
            isFavourite: false,
            outputFormat: 'markdown',
        })

        result = await copyPaster.findAllTemplates()
        expect(result.length).toBe(1)

        await copyPaster.deleteTemplate({
            id,
        })

        result = await copyPaster.findAllTemplates()
        expect(result.length).toBe(0)
    })
})
