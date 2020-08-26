import mapValues from 'lodash/mapValues'

import { SidebarContainerLogic, createEditFormsForAnnotations } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import { AnnotationsCache } from 'src/annotations/annotations-cache'
import * as sharingTestData from 'src/content-sharing/background/index.test.data'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

function insertBackgroundFunctionTab(remoteFunctions, tab: any) {
    return mapValues(remoteFunctions, (f) => {
        return (...args: any[]) => {
            return f({ tab }, ...args)
        }
    })
}

const setupLogicHelper = async ({
    device,
    pageUrl = DATA.CURRENT_TAB_URL_1,
    initSearchType = 'pages',
}: {
    device: UILogicTestDevice
    pageUrl?: string
    initSearchType?: 'pageAnnots' | 'allAnnots' | 'pages'
}) => {
    const { backgroundModules } = device

    const annotations = {
        // ...insertBackgroundFunctionTab(
        //     backgroundModules.directLinking.remoteFunctions,
        //     currentTab,
        // ),
        editAnnotation: () => undefined,
        createAnnotation: () => undefined,
        addAnnotationTag: () => undefined,
        deleteAnnotation: () => undefined,
        toggleAnnotBookmark: () => undefined,
        updateAnnotationTags: () => undefined,
        getAllAnnotationsByUrl: () => undefined,
    } as any

    const annotationsCache = new AnnotationsCache({
        backendOperations: {
            // TODO: (sidebar-refactor) massage the params from Annotation to the likes of CreateAnnotationParams
            load: async (url) => [],
            create: async (annotation) => null,
            update: async (annotation) => null,
            delete: async (annotation) => null,
            updateTags: async (annotation) => null,
        },
    })

    const sidebarLogic = new SidebarContainerLogic({
        pageUrl,
        auth: backgroundModules.auth.remoteFunctions,
        tags: backgroundModules.tags.remoteFunctions,
        customLists: backgroundModules.customLists.remoteFunctions,
        contentSharing: backgroundModules.contentSharing.remoteFunctions,
        annotations,
        // search: {
        //     ...backgroundModules.search.remoteFunctions.search,
        // },
        // bookmarks: backgroundModules.search.remoteFunctions.bookmarks,
        // inPageUI,
        // highlighter,
        annotationsCache,
        initialState: 'hidden',
        searchResultLimit: 10,
    })

    let initSearchTypeMutation
    switch (initSearchType) {
        case 'allAnnots':
            initSearchTypeMutation = {
                searchType: { $set: 'notes' },
                pageType: { $set: 'all' },
            }
            break
        case 'pageAnnots':
            initSearchTypeMutation = {
                searchType: { $set: 'notes' },
                pageType: { $set: 'page' },
            }
            break
        case 'pages':
        default:
            initSearchTypeMutation = { searchType: { $set: 'page' } }
    }

    const sidebar = device.createElement(sidebarLogic)
    sidebar.processMutation(initSearchTypeMutation)
    await sidebar.init()
    return { sidebar, sidebarLogic }
}

describe('SidebarContainerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    describe('page annotation results', () => {
        const context = 'pageAnnotations'

        it("should be able to edit an annotation's comment", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            sidebar.processMutation({
                annotations: { $set: [DATA.ANNOT_1] },
                editForms: {
                    $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
                },
            })

            const annotation = sidebar.state.annotations[0]
            expect(annotation.comment).toEqual(DATA.ANNOT_1.comment)

            await sidebar.processEvent('switchAnnotationMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                mode: 'edit',
            })
            expect(
                sidebar.state.annotationModes[context][DATA.ANNOT_1.url],
            ).toEqual('edit')

            await sidebar.processEvent('changeEditCommentText', {
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
            })
            await sidebar.processEvent('editAnnotation', {
                annotationUrl: DATA.ANNOT_1.url,
                context,
            })
            expect(
                sidebar.state.annotationModes[context][annotation.url],
            ).toEqual('default')
            expect(sidebar.state.annotations[0].comment).toEqual(editedComment)
            expect(sidebar.state.annotations[0].tags).toEqual([])
            expect(sidebar.state.annotations[0].lastEdited).not.toEqual(
                annotation.lastEdited,
            )
        })

        it("should be able to edit an annotation's comment and tags", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            sidebar.processMutation({
                annotations: { $set: [DATA.ANNOT_1] },
                editForms: {
                    $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
                },
            })

            const annotation = sidebar.state.annotations[0]
            expect(annotation.comment).toEqual(DATA.ANNOT_1.comment)

            await sidebar.processEvent('switchAnnotationMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                mode: 'edit',
            })
            expect(
                sidebar.state.annotationModes[context][DATA.ANNOT_1.url],
            ).toEqual('edit')

            await sidebar.processEvent('changeEditCommentText', {
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
            })
            await sidebar.processEvent('updateTagsForEdit', {
                annotationUrl: DATA.ANNOT_1.url,
                added: DATA.TAG_1,
            })
            await sidebar.processEvent('updateTagsForEdit', {
                annotationUrl: DATA.ANNOT_1.url,
                added: DATA.TAG_2,
            })
            await sidebar.processEvent('editAnnotation', {
                annotationUrl: DATA.ANNOT_1.url,
                context,
            })
            expect(
                sidebar.state.annotationModes[context][annotation.url],
            ).toEqual('default')
            expect(sidebar.state.annotations[0].comment).toEqual(editedComment)
            expect(sidebar.state.annotations[0].tags).toEqual([
                DATA.TAG_1,
                DATA.TAG_2,
            ])
            expect(sidebar.state.annotations[0].lastEdited).not.toEqual(
                annotation.lastEdited,
            )
        })

        it('should be able to delete an annotation', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            sidebar.processMutation({
                annotations: { $set: [DATA.ANNOT_1] },
                editForms: {
                    $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
                },
            })

            await sidebar.processEvent('deleteAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations.length).toBe(0)
        })

        it("should be able to toggle an annotation's bookmark status", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            sidebar.processMutation({
                annotations: { $set: [DATA.ANNOT_1] },
                editForms: {
                    $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
                },
            })

            expect(sidebar.state.annotations[0].isBookmarked).toBe(undefined)
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations[0].isBookmarked).toBe(true)
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations[0].isBookmarked).toBe(false)
        })

        it('should be able to go to an annotation highlight on the page', async () => {})

        it('should be able to change annotation sharing access', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.annotationSharingAccess).toEqual(
                'feature-disabled',
            )
            await sidebar.processEvent('receiveSharingAccessChange', {
                sharingAccess: 'page-not-shared',
            })
            expect(sidebar.state.annotationSharingAccess).toEqual(
                'page-not-shared',
            )
            await sidebar.processEvent('receiveSharingAccessChange', {
                sharingAccess: 'sharing-allowed',
            })
            expect(sidebar.state.annotationSharingAccess).toEqual(
                'sharing-allowed',
            )
            await sidebar.processEvent('receiveSharingAccessChange', {
                sharingAccess: 'feature-disabled',
            })
            expect(sidebar.state.annotationSharingAccess).toEqual(
                'feature-disabled',
            )
        })
    })

    // TODO: Figure out why we're passing in all the comment data that's already available in state
    describe('new comment box', () => {
        it('should be able to cancel writing a new comment', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.showCommentBox).toBe(false)
            await sidebar.processEvent('addNewPageComment', null)
            expect(sidebar.state.showCommentBox).toBe(true)

            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            await sidebar.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(sidebar.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            await sidebar.processEvent('cancelNewPageComment', null)
            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            expect(sidebar.state.showCommentBox).toBe(false)
        })

        it('should be able to open tag picker when writing a new comment', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.showCommentBox).toBe(false)
            await sidebar.processEvent('addNewPageComment', null)
            expect(sidebar.state.showCommentBox).toBe(true)

            expect(sidebar.state.commentBox.form.isTagInputActive).toBe(false)
            await sidebar.processEvent('toggleNewPageCommentTagPicker', null)
            expect(sidebar.state.commentBox.form.isTagInputActive).toBe(true)
        })

        it('should be able to save a new comment', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.showCommentBox).toBe(false)
            await sidebar.processEvent('addNewPageComment', null)
            expect(sidebar.state.showCommentBox).toBe(true)

            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            await sidebar.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(sidebar.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            await sidebar.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [],
                isBookmarked: false,
                anchor: {} as any,
            })
            expect(sidebar.state.annotations.length).toBe(1)
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [],
                }),
            ])
            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            expect(sidebar.state.showCommentBox).toBe(false)
        })

        it('should be able to save a new comment with a bookmark', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.showCommentBox).toBe(false)
            await sidebar.processEvent('addNewPageComment', null)
            expect(sidebar.state.showCommentBox).toBe(true)

            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            await sidebar.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(sidebar.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            expect(sidebar.state.commentBox.form.isBookmarked).toBe(false)
            await sidebar.processEvent('toggleNewPageCommentBookmark', null)
            expect(sidebar.state.commentBox.form.isBookmarked).toBe(true)

            await sidebar.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [],
                isBookmarked: true,
                anchor: {} as any,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [],
                }),
            ])
            expect(sidebar.state.commentBox.form.isBookmarked).toBe(false)
            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            expect(sidebar.state.showCommentBox).toBe(false)
        })

        it('should be able to save a new comment with tags', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.showCommentBox).toBe(false)
            await sidebar.processEvent('addNewPageComment', null)
            expect(sidebar.state.showCommentBox).toBe(true)

            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            await sidebar.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(sidebar.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            expect(sidebar.state.commentBox.form.tags).toEqual([])
            await sidebar.processEvent('addNewPageCommentTag', {
                tag: DATA.TAG_1,
            })
            expect(sidebar.state.commentBox.form.tags).toEqual([DATA.TAG_1])
            await sidebar.processEvent('addNewPageCommentTag', {
                tag: DATA.TAG_2,
            })
            expect(sidebar.state.commentBox.form.tags).toEqual([
                DATA.TAG_1,
                DATA.TAG_2,
            ])
            await sidebar.processEvent('deleteNewPageCommentTag', {
                tag: DATA.TAG_2,
            })
            expect(sidebar.state.commentBox.form.tags).toEqual([DATA.TAG_1])

            await sidebar.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [DATA.TAG_1],
                isBookmarked: false,
                anchor: {} as any,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [DATA.TAG_1],
                }),
            ])
            expect(sidebar.state.commentBox.form.tags).toEqual([])
            expect(sidebar.state.commentBox.form.isBookmarked).toBe(false)
            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            expect(sidebar.state.showCommentBox).toBe(false)
        })
    })

    // it('should detect if the page in a shared list', async ({ device }) => {
    //     device.authService.setUser(TEST_USER)

    //     const localListId = await sharingTestData.createContentSharingTestList(
    //         device,
    //     )
    //     await device.backgroundModules.contentSharing.shareList({
    //         listId: localListId,
    //     })
    //     await device.backgroundModules.contentSharing.shareListEntries({
    //         listId: localListId,
    //     })

    //     const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url
    //     const { sidebar, sidebarLogic } = await setupLogicHelper({
    //         device,
    //         pageUrl,
    //     })
    //     await sidebarLogic._detectedPageSharingStatus
    //     expect(sidebar.state.annotationSharingAccess).toEqual('???')
    // })

    // it('should share annotations', async ({ device }) => {
    //     device.authService.setUser(TEST_USER)

    //     const localListId = await sharingTestData.createContentSharingTestList(
    //         device,
    //     )
    //     await device.backgroundModules.contentSharing.shareList({
    //         listId: localListId,
    //     })
    //     await device.backgroundModules.contentSharing.shareListEntries({
    //         listId: localListId,
    //     })
    //     const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url
    //     const annotationUrl = await device.backgroundModules.directLinking.createAnnotation(
    //         {} as any,
    //         {
    //             pageUrl,
    //             title: 'Page title',
    //             body: 'Annot body',
    //             comment: 'Annot comment',
    //             selector: {
    //                 descriptor: { content: { foo: 5 }, strategy: 'eedwdwq' },
    //                 quote: 'dawadawd',
    //             },
    //         },
    //         { skipPageIndexing: true },
    //     )

    //     const { sidebar } = await setupLogicHelper({ device, pageUrl })
    //     expect(sidebar.state.annotations).toEqual([])
    //     await sidebar.processEvent('shareAnnotation', {
    //         context: 'pageAnnotations',
    //         annotationUrl,
    //     })
    //     await device.backgroundModules.contentSharing.waitForSync()
    //     const serverStorage = await device.getServerStorage()
    //     expect(
    //         await serverStorage.storageManager
    //             .collection('sharedAnnotation')
    //             .findObjects({}),
    //     ).toEqual([
    //         expect.objectContaining({
    //             body: 'Annot body',
    //             comment: 'Annot comment',
    //             selector: JSON.stringify({
    //                 descriptor: { content: { foo: 5 }, strategy: 'eedwdwq' },
    //                 quote: 'dawadawd',
    //             }),
    //         }),
    //     ])
    // })

    // it('should share annotations', async ({ device }) => {
    //     device.authService.setUser(TEST_USER)

    //     const localListId = await sharingTestData.createContentSharingTestList(
    //         device,
    //     )
    //     await device.backgroundModules.contentSharing.shareList({
    //         listId: localListId,
    //     })
    //     await device.backgroundModules.contentSharing.shareListEntries({
    //         listId: localListId,
    //     })
    //     const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url
    //     const annotationUrl1 = await device.backgroundModules.directLinking.createAnnotation(
    //         {} as any,
    //         {
    //             pageUrl,
    //             title: 'Page title',
    //             body: 'Annot body',
    //             comment: 'Annot comment',
    //             selector: {
    //                 descriptor: { content: { foo: 5 }, strategy: 'eedwdwq' },
    //                 quote: 'dawadawd',
    //             },
    //         },
    //         { skipPageIndexing: true },
    //     )
    //     await device.backgroundModules.directLinking.createAnnotation(
    //         {} as any,
    //         {
    //             pageUrl,
    //             title: 'Page title',
    //             body: 'Annot body 2',
    //             comment: 'Annot comment 2',
    //             selector: {
    //                 descriptor: { content: { foo: 5 }, strategy: 'eedwdwq' },
    //                 quote: 'dawadawd 2',
    //             },
    //         },
    //         { skipPageIndexing: true },
    //     )

    //     await device.backgroundModules.contentSharing.shareAnnotation({
    //         annotationUrl: annotationUrl1,
    //     })
    //     await device.backgroundModules.contentSharing.waitForSync()
    //     const { sidebar, sidebarLogic } = await setupLogicHelper({
    //         device,
    //         pageUrl,
    //     })
    //     await sidebarLogic._detectedSharedAnnotations
    //     expect(sidebar.state.annotationSharingInfo).toEqual({
    //         [annotationUrl1]: {
    //             status: 'shared',
    //             taskState: 'pristine',
    //         },
    //     })
    // })
})
