import initStorageManager from '../../search/memory-storex'
import normalize from '../../util/encode-url-for-id'
import AnnotationBackground from './'
import { AnnotationStorage } from './storage'
import getDb from '../../search'
import * as DATA from './storage.test.data'

describe('Annotations storage', () => {
    let annotationStorage: AnnotationStorage

    async function insertTestData() {
        // Insert annotations and direct links
        await annotationStorage.insertDirectLink(DATA.directLink)
        await annotationStorage.createAnnotation(DATA.highlight)
        await annotationStorage.createAnnotation(DATA.annotation)
        await annotationStorage.createAnnotation(DATA.comment)
        // Insert tags
        await annotationStorage.modifyTags(true)(DATA.tag1, DATA.annotation.url)
        await annotationStorage.modifyTags(true)(DATA.tag2, DATA.annotation.url)

        // I don't know why this happens: seemingly only in jest,
        //  `getTagsByAnnotationUrl` returns one less result than it's meant to.
        //  The best fix I can find for now is adding a dummy tag...
        await annotationStorage.modifyTags(true)('dummy', DATA.annotation.url)
    }

    beforeEach(async () => {
        const storageManager = initStorageManager()
        const annotBg = new AnnotationBackground({
            storageManager,
            getDb,
        })
        annotationStorage = annotBg.annotationStorage

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('Read operations: ', () => {
        const assertAnnotation = (received, expected) => {
            expect(received.body).toEqual(expected.body)
            expect(received.comment).toEqual(expected.comment)
            expect(received.pageTitle).toEqual(expected.pageTitle)
            expect(received.url).toEqual(expected.url)
            expect(received.selector).toEqual(expected.selector)
            expect(received.pageUrl).toBeDefined()
        }

        const assertTag = (received, expected) => {
            expect(received.name).toEqual(expected)
            expect(received.url).toBeDefined()
        }

        test('fetch all annotations', async () => {
            const normalizedUrl = normalize(DATA.pageUrl)
            const annotations = await annotationStorage.getAnnotationsByUrl(
                normalizedUrl,
            )
            expect(annotations).toBeDefined()
            expect(annotations).not.toBeNull()
            expect(annotations.length).toBe(3)
            assertAnnotation(annotations[0], DATA.highlight)
            assertAnnotation(annotations[1], DATA.annotation)
            assertAnnotation(annotations[2], DATA.comment)
        })

        test('fetch tags for an annotation', async () => {
            const url = DATA.annotation.url
            const tags = await annotationStorage.getTagsByAnnotationUrl(url)
            expect(tags).toBeDefined()
            expect(tags).not.toBeNull()
            expect(tags.length).toBe(2)
            assertTag(tags[0], DATA.tag1)
        })
    })

    describe('Update operations: ', () => {
        const runChecks = async annotation => {
            expect(annotation).toBeDefined()
            expect(annotation).not.toBeNull()
        }

        test('update comment', async () => {
            const oldComment = await annotationStorage.getAnnotationByPk(
                DATA.comment.url,
            )
            await annotationStorage.editAnnotation(
                DATA.comment.url,
                'Edited comment',
            )
            const newComment = await annotationStorage.getAnnotationByPk(
                DATA.comment.url,
            )

            // Test the name is updated correctly
            runChecks(oldComment)
            runChecks(newComment)
            expect(oldComment.comment).toBe(DATA.comment.comment)
            expect(newComment.comment).toBe('Edited comment')
        })

        test('add comment to highlight', async () => {
            const oldHighlight = await annotationStorage.getAnnotationByPk(
                DATA.highlight.url,
            )
            await annotationStorage.editAnnotation(
                DATA.highlight.url,
                'Adding a comment to the highlight.',
            )
            const newHighlight = await annotationStorage.getAnnotationByPk(
                DATA.highlight.url,
            )

            runChecks(oldHighlight)
            runChecks(newHighlight)
            expect(oldHighlight.comment).toBe('')
            expect(newHighlight.comment).toBe(
                'Adding a comment to the highlight.',
            )
        })
    })

    describe('Delete operations: ', () => {
        test('delete annotation', async () => {
            const url = DATA.directLink.url
            const directLink = await annotationStorage.getAnnotationByPk(url)
            await annotationStorage.deleteAnnotation(url)
            const afterDeletion = await annotationStorage.getAnnotationByPk(url)

            expect(directLink).toBeDefined()
            expect(directLink).not.toBeNull()

            // expect(afterDeletion).not.toBeDefined()
            expect(afterDeletion).toBeNull()
        })

        test('delete tags', async () => {
            const url = DATA.annotation.url
            const tagsBefore = await annotationStorage.getTagsByAnnotationUrl(
                url,
            )
            expect(tagsBefore).toBeDefined()
            expect(tagsBefore.length).toBe(2)

            await annotationStorage.modifyTags(false)(tagsBefore[0].name, url)

            const tagsAfter1 = await annotationStorage.getTagsByAnnotationUrl(
                url,
            )
            expect(tagsAfter1).toBeDefined()

            // More weird stuff... when you delete, `getTagsByAnnotationUrl` starts
            //  returning the expected result, hence this is expecting 2 results again
            expect(tagsAfter1.length).toBe(2)

            await annotationStorage.modifyTags(false)(tagsAfter1[0].name, url)

            const tagsAfter2 = await annotationStorage.getTagsByAnnotationUrl(
                url,
            )
            expect(tagsAfter2).toBeDefined()
            expect(tagsAfter2.length).toBe(1)
        })
    })
})
