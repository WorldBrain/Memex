import omitBy from 'lodash/omitBy'
import endsWith from 'lodash/endsWith'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

async function insertTestData({
    storageManager,
    backgroundModules: {
        contentSharing: { storage: contentSharingStorage },
        directLinking: { annotationStorage },
        customLists,
    },
}: BackgroundIntegrationTestSetup) {
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
            hostname: normalizeUrl(annot.pageUrl),
            domain: normalizeUrl(annot.pageUrl),
            title: annot.pageTitle,
            text: '',
            canonicalUrl: annot.url,
        })

        await annotationStorage.createAnnotation({
            ...annot,
            url: annot.url,
        } as any)

        await contentSharingStorage.setAnnotationPrivacyLevel({
            annotation: annot.url,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
        })
    }

    // Insert bookmarks
    await annotationStorage.toggleAnnotBookmark({
        url: DATA.directLink.url,
    })
    await annotationStorage.toggleAnnotBookmark({ url: DATA.hybrid.url })

    // Insert collections + collection entries
    const { localListId: coll1Id } = await customLists.createCustomList({
        name: DATA.coll1,
        id: Date.now(),
    })
    const { localListId: coll2Id } = await customLists.createCustomList({
        name: DATA.coll2,
        id: Date.now(),
    })
    await customLists.createCustomList({ name: DATA.coll2, id: Date.now() })
    await annotationStorage.insertAnnotToList({
        listId: coll1Id,
        url: DATA.hybrid.url,
    })
    await annotationStorage.insertAnnotToList({
        listId: coll2Id,
        url: DATA.hybrid.url,
    })

    // Insert tags
    await annotationStorage.modifyTags(true)(DATA.tag1, DATA.annotation.url)
    await annotationStorage.modifyTags(true)(DATA.tag2, DATA.annotation.url)
}

async function setupTest() {
    const setup = await setupBackgroundIntegrationTest()

    await insertTestData(setup)

    return {
        annotationStorage:
            setup.backgroundModules.directLinking.annotationStorage,
        contentSharingStorage: setup.backgroundModules.contentSharing.storage,
        backgroundModules: setup.backgroundModules,
    }
}

describe('Annotations storage', () => {
    describe('Read operations: ', () => {
        const assertTag = (received, expected) => {
            expect(received.name).toEqual(expected)
            expect(received.url).toBeDefined()
        }

        // TODO: Fix this test
        test.skip('fetch tags for an annotation', async () => {
            const { annotationStorage } = await setupTest()

            const url = DATA.annotation.url
            const tags = await annotationStorage.getTagsByAnnotationUrl(url)
            expect(tags).toBeDefined()
            expect(tags).not.toBeNull()
            expect(tags.length).toBe(2)
            assertTag(tags[0], DATA.tag1)
        })

        test('fetch list entries for an annotation', async () => {
            const { annotationStorage } = await setupTest()

            const url = DATA.hybrid.url
            const lists = await annotationStorage.findListEntriesByUrl({ url })
            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(2)
        })

        test('fetch privacy level for an annotation', async () => {
            const { contentSharingStorage } = await setupTest()

            const url = DATA.annotation.url
            expect(
                await contentSharingStorage.findAnnotationPrivacyLevel({
                    annotation: url,
                }),
            ).toEqual(
                expect.objectContaining({
                    annotation: url,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    createdWhen: expect.any(Date),
                }),
            )
        })

        describe('Update operations: ', () => {
            const checkIsDefined = async (annotation) => {
                expect(annotation).toBeDefined()
                expect(annotation).not.toBeNull()
            }

            // TODO: Fix this test
            test.skip('update comment', async () => {
                const { annotationStorage } = await setupTest()

                const stripTerms = (comment) =>
                    omitBy(comment, (value, key) => endsWith(key, '_terms'))

                const oldComment = await annotationStorage.getAnnotationByPk({
                    url: DATA.comment.url,
                })
                expect(stripTerms(oldComment)).toEqual({
                    ...DATA.comment,
                    lastEdited: expect.any(Date),
                })

                await annotationStorage.editAnnotation(
                    DATA.comment.url,
                    'Edited comment',
                    'one',
                    'updated body',
                )
                const newComment = await annotationStorage.getAnnotationByPk({
                    url: DATA.comment.url,
                })
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
                const { annotationStorage } = await setupTest()

                const oldHighlight = await annotationStorage.getAnnotationByPk({
                    url: DATA.highlight.url,
                })
                await annotationStorage.editAnnotation(
                    DATA.highlight.url,
                    'Adding a comment to the highlight.',
                    'two',
                    'updated body',
                )
                const newHighlight = await annotationStorage.getAnnotationByPk({
                    url: DATA.highlight.url,
                })

                checkIsDefined(oldHighlight)
                checkIsDefined(newHighlight)
                expect(oldHighlight.comment).toBeUndefined()
                expect(newHighlight.comment).toBe(
                    'Adding a comment to the highlight.',
                )
            })

            test('update annotation privacy level', async () => {
                const { contentSharingStorage } = await setupTest()

                const url = DATA.annotation.url
                const origPrivacyLevel = await contentSharingStorage.findAnnotationPrivacyLevel(
                    { annotation: url },
                )
                expect(origPrivacyLevel).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        createdWhen: expect.any(Date),
                    }),
                )

                await contentSharingStorage.deleteAnnotationPrivacyLevel({
                    annotation: url,
                })

                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(null)

                const updatedWhen = new Date()

                await contentSharingStorage.setAnnotationPrivacyLevel({
                    annotation: url,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    updatedWhen,
                })

                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        createdWhen: updatedWhen,
                    }),
                )

                await contentSharingStorage.setAnnotationPrivacyLevel({
                    annotation: url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    updatedWhen,
                })

                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                        createdWhen: updatedWhen,
                    }),
                )

                await contentSharingStorage.setAnnotationPrivacyLevel({
                    annotation: url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                    updatedWhen,
                })

                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                        createdWhen: updatedWhen,
                    }),
                )
            })
        })

        describe('Delete operations: ', () => {
            test('delete annotation', async () => {
                const { annotationStorage } = await setupTest()

                const url = DATA.directLink.url
                const directLink = await annotationStorage.getAnnotationByPk({
                    url: url,
                })
                await annotationStorage.deleteAnnotation(url)
                const afterDeletion = await annotationStorage.getAnnotationByPk(
                    { url: url },
                )

                expect(directLink).toBeDefined()
                expect(directLink).not.toBeNull()

                expect(afterDeletion).toBeNull()
            })

            test('delete annotation should result in delete of any privacy level', async () => {
                const {
                    backgroundModules,
                    contentSharingStorage,
                } = await setupTest()

                const url = DATA.directLink.url
                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        createdWhen: expect.any(Date),
                    }),
                )

                await backgroundModules.directLinking.deleteAnnotation(
                    undefined,
                    url,
                )
                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(null)
            })

            test('delete tags', async () => {
                const { annotationStorage } = await setupTest()

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

            test('delete tags bulk', async () => {
                const { annotationStorage } = await setupTest()

                const url = DATA.annotation.url
                const before = await annotationStorage.getTagsByAnnotationUrl(
                    url,
                )
                expect(before).toBeDefined()
                expect(before.length).toBe(2)

                await annotationStorage.deleteTagsByUrl({ url })

                const after = await annotationStorage.getTagsByAnnotationUrl(
                    url,
                )
                expect(after).toBeDefined()
                expect(after.length).toBe(0)
            })

            test('delete bookmark', async () => {
                const { annotationStorage } = await setupTest()

                const url = DATA.directLink.url

                expect(await annotationStorage.annotHasBookmark({ url })).toBe(
                    true,
                )
                await annotationStorage.deleteBookmarkByUrl({ url })
                expect(await annotationStorage.annotHasBookmark({ url })).toBe(
                    false,
                )
            })

            test('delete list entries', async () => {
                const { annotationStorage } = await setupTest()

                const url = DATA.hybrid.url

                const before = await annotationStorage.findListEntriesByUrl({
                    url,
                })

                expect(before.length).toBe(2)
                await annotationStorage.deleteListEntriesByUrl({ url })
                const after = await annotationStorage.findListEntriesByUrl({
                    url,
                })
                expect(after.length).toBe(0)
            })

            test('delete annotation privacy level', async () => {
                const { contentSharingStorage } = await setupTest()

                const url = DATA.directLink.url
                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(
                    expect.objectContaining({
                        annotation: url,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        createdWhen: expect.any(Date),
                    }),
                )

                await contentSharingStorage.deleteAnnotationPrivacyLevel({
                    annotation: url,
                })

                expect(
                    await contentSharingStorage.findAnnotationPrivacyLevel({
                        annotation: url,
                    }),
                ).toEqual(null)
            })
        })
    })
})
