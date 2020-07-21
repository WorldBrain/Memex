import mapValues from 'lodash/mapValues'

import { SidebarContainerLogic } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import { AnnotationsCache } from 'src/annotations/annotations-cache'

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
        tags: backgroundModules.tags.remoteFunctions,
        customLists: backgroundModules.customLists.remoteFunctions,
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

            await sidebar.processEvent('changePageCommentText', {
                comment: editedComment,
            })
            await sidebar.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
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

            await sidebar.processEvent('changePageCommentText', {
                comment: editedComment,
            })
            await sidebar.processEvent('updateTagsForNewComment', {
                added: DATA.TAG_1,
            })
            await sidebar.processEvent('updateTagsForNewComment', {
                added: DATA.TAG_2,
            })
            await sidebar.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
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

            expect(sidebar.state.commentBox.form.showTagsPicker).toBe(false)
            await sidebar.processEvent('toggleNewPageCommentTagPicker', null)
            expect(sidebar.state.commentBox.form.showTagsPicker).toBe(true)
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
                bookmarked: false,
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
                bookmarked: true,
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
                bookmarked: false,
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
})
