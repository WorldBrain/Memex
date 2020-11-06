import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

import CopyPasterBackground from '.'

async function setupTest() {
    const { backgroundModules } = await setupBackgroundIntegrationTest()

    const copyPaster: CopyPasterBackground = backgroundModules.copyPaster

    return { copyPaster }
}

describe('Copy-paster template storage tests', () => {
    test('should be able to create and find a template', async () => {
        const { copyPaster } = await setupTest()

        const newTemplate = {
            title: 'template test',
            code: '',
            isFavourite: false,
        }

        const id = await copyPaster.createTemplate(newTemplate)

        const result = await copyPaster.findTemplate({ id })

        expect(result).toEqual({ ...newTemplate, id })
    })

    test('should be able to update a template', async () => {
        const { copyPaster } = await setupTest()

        const id = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            isFavourite: false,
        })

        await copyPaster.updateTemplate({
            id,
            title: 'test 2',
            code: '',
            isFavourite: false,
        })

        const result = await copyPaster.findTemplate({ id })

        expect(result).toEqual({
            id,
            title: 'test 2',
            code: '',
            isFavourite: false,
        })
    })

    test('should be able to delete a template', async () => {
        const { copyPaster } = await setupTest()
        let result

        const id = await copyPaster.createTemplate({
            title: 'template test',
            code: '',
            isFavourite: false,
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
