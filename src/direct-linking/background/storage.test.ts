import * as omitBy from 'lodash/omitBy'
import * as endsWith from 'lodash/endsWith'
import Storex from '@worldbrain/storex'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import initStorageManager from '../../search/memory-storex'
import normalize from '../../util/encode-url-for-id'
import AnnotationBackground from './'
import AnnotationStorage from './storage'
import CustomListBackground from 'src/custom-lists/background'
import * as DATA from './storage.test.data'

describe('Annotations storage', () => {
    let annotationStorage: AnnotationStorage
    let storageManager: Storex
    let customListsBg: CustomListBackground
    let coll1Id: number

    async function insertTestData() {
        for (const annot of [
            DATA.directLink,
            DATA.highlight,
            DATA.annotation,
            DATA.comment,
            DATA.hybrid,
        ]) {
            // Pages also need to be seeded to match domains filters against
            await storageManager.collection('pages').createObject({
                url: annot.pageUrl,
                fullUrl: annot.url,
                hostname: normalize(annot.pageUrl),
                domain: normalize(annot.pageUrl),
                title: annot.pageTitle,
                text: '',
                canonicalUrl: annot.url,
            })

            await annotationStorage.createAnnotation(annot as any)
        }

        // Insert bookmarks
        await annotationStorage.toggleAnnotBookmark({
            url: DATA.directLink.url,
        })
        await annotationStorage.toggleAnnotBookmark({ url: DATA.hybrid.url })

        // Insert collections + collection entries
        coll1Id = await customListsBg.createCustomList({
            name: DATA.coll1,
        })
        await customListsBg.createCustomList({ name: DATA.coll2 })
        await annotationStorage.insertAnnotToList({
            listId: coll1Id,
            url: DATA.hybrid.url,
        })

        // Insert tags
        await annotationStorage.modifyTags(true)(DATA.tag1, DATA.annotation.url)
        await annotationStorage.modifyTags(true)(DATA.tag2, DATA.annotation.url)
    }

    beforeEach(async () => {
        storageManager = initStorageManager()
        const annotBg = new AnnotationBackground({
            storageManager,
            socialBg: {} as any,
        })
        customListsBg = new CustomListBackground({ storageManager })
        annotationStorage = annotBg.annotationStorage

        registerModuleMapCollections(storageManager.registry, {
            annotations: annotationStorage,
            customList: customListsBg.storage,
        })

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

        test('fetch tags for an annotation', async () => {
            const url = DATA.annotation.url
            const tags = await annotationStorage.getTagsByAnnotationUrl(url)
            expect(tags).toBeDefined()
            expect(tags).not.toBeNull()
            expect(tags.length).toBe(2)
            assertTag(tags[0], DATA.tag1)
        })

        describe('Update operations: ', () => {
            const checkIsDefined = async annotation => {
                expect(annotation).toBeDefined()
                expect(annotation).not.toBeNull()
            }

            test('update comment', async () => {
                const stripTerms = comment =>
                    omitBy(comment, (value, key) => endsWith(key, '_terms'))

                const oldComment = await annotationStorage.getAnnotationByPk(
                    DATA.comment.url,
                )
                expect(stripTerms(oldComment)).toEqual({
                    ...DATA.comment,
                    lastEdited: expect.any(Date),
                })

                await annotationStorage.editAnnotation(
                    DATA.comment.url,
                    'Edited comment',
                )
                const newComment = await annotationStorage.getAnnotationByPk(
                    DATA.comment.url,
                )
                expect(stripTerms(newComment)).toEqual({
                    ...DATA.comment,
                    lastEdited: expect.any(Date),
                    comment: 'Edited comment',
                })
                expect(newComment.lastEdited.getTime()).toBeGreaterThan(
                    oldComment.lastEdited.getTime(),
                )
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

                checkIsDefined(oldHighlight)
                checkIsDefined(newHighlight)
                expect(oldHighlight.comment).toBe('')
                expect(newHighlight.comment).toBe(
                    'Adding a comment to the highlight.',
                )
            })
        })

        describe('Delete operations: ', () => {
            test('delete annotation', async () => {
                const url = DATA.directLink.url
                const directLink = await annotationStorage.getAnnotationByPk(
                    url,
                )
                await annotationStorage.deleteAnnotation(url)
                const afterDeletion = await annotationStorage.getAnnotationByPk(
                    url,
                )

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

                await annotationStorage.modifyTags(false)(
                    tagsBefore[0].name,
                    url,
                )

                const tagsAfter1 = await annotationStorage.getTagsByAnnotationUrl(
                    url,
                )
                expect(tagsAfter1).toBeDefined()

                expect(tagsAfter1.length).toBe(1)

                await annotationStorage.modifyTags(false)(
                    tagsAfter1[0].name,
                    url,
                )

                const tagsAfter2 = await annotationStorage.getTagsByAnnotationUrl(
                    url,
                )
                expect(tagsAfter2).toBeDefined()
                expect(tagsAfter2.length).toBe(0)
            })
        })
    })
})
