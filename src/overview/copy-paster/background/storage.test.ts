import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

import CopyPasterBackground from './'

async function setupTest() {
    const { backgroundModules } = await setupBackgroundIntegrationTest()

    const copyPaster: CopyPasterBackground = backgroundModules.copyPaster

    return { copyPaster }
}

describe('Tempaltes', () => {
    test('should be able to create a template', async () => {
        const { copyPaster } = await setupTest()

        const result = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            isFavourite: false,
        })

        expect(result).toBe(1)
    })

    test('should be able to find a template', async () => {
        const { copyPaster } = await setupTest()

        const newTemplate = {
            title: 'template test',
            code: '',
            isFavourite: false,
        }

        await copyPaster.createTemplate(newTemplate)

        const result = await copyPaster.findTemplate({ id: 1 })

        expect(result).toEqual({ ...newTemplate, id: 1 })
    })

    test('should be able to update a template', async () => {
        const { copyPaster } = await setupTest()

        await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            isFavourite: false,
        })

        await copyPaster.updateTemplate({
            id: 1,
            title: 'test 2',
            code: '',
            isFavourite: false,
        })

        const result = await copyPaster.findTemplate({ id: 1 })

        expect(result).toEqual({
            id: 1,
            title: 'test 2',
            code: '',
            isFavourite: false,
        })
    })

    test('should be able to delete a template', async () => {
        const { copyPaster } = await setupTest()
        let result

        await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            isFavourite: false,
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
