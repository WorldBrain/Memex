import mapValues from 'lodash/mapValues'
import { SidebarContainerLogic } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import { Annotation } from 'src/annotations/types'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state'
import { PageUrlsByDay } from 'src/search/background/types'

function insertBackgroundFunctionTab(remoteFunctions, tab: any) {
    return mapValues(remoteFunctions, (f) => {
        return (...args: any[]) => {
            return f({ tab }, ...args)
        }
    })
}

const setupLogicHelper = async ({
    device,
    currentTabUrl = DATA.CURRENT_TAB_URL_1,
    initSearchType = 'pages',
}: {
    device: UILogicTestDevice
    currentTabUrl?: string
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

    const highlighter = {
        removeAnnotationHighlights: () => undefined,
        removeTempHighlights: () => undefined,
        renderHighlight: () => undefined,
    } as any

    const currentTab = {
        id: 654,
        url: currentTabUrl,
        title: 'Foo.com: Home',
    }
    const inPageUI = new SharedInPageUIState({
        loadComponent: async () => {},
        annotations,
        highlighter,
        pageUrl: currentTab.url,
    })

    const sidebarLogic = new SidebarContainerLogic({
        currentTab,
        tags: backgroundModules.tags.remoteFunctions,
        customLists: backgroundModules.customLists.remoteFunctions,
        annotations,
        normalizeUrl: (url) => url,
        search: {
            ...backgroundModules.search.remoteFunctions.search,
        },
        bookmarks: backgroundModules.search.remoteFunctions.bookmarks,
        inPageUI,
        highlighter,
        env: 'inpage',
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

            await sidebar.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
                tags: [],
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

            await sidebar.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
                tags: [DATA.TAG_1, DATA.TAG_2],
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

            expect(sidebar.state.annotations[0].hasBookmark).toBe(undefined)
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations[0].hasBookmark).toBe(true)
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations[0].hasBookmark).toBe(false)
        })

        it('should be able to go to an annotation highlight on the page', async () => {})
    })

    describe('annotation search results', () => {
        const context = 'searchResults'

        // Dealing with this object really sucks! There's gotta be a way nicer solution we can employ here
        function findAnnotationInAnnotsByDay(
            annotationUrl: string,
            annotsByDay: PageUrlsByDay,
        ): Annotation | undefined {
            for (const [time, annotsByPageObj] of Object.entries(annotsByDay)) {
                for (const [pageUrl, annotations] of Object.entries(
                    annotsByPageObj as { [pageUrl: string]: Annotation[] },
                )) {
                    for (const annotation of annotations) {
                        if (annotation.url === annotationUrl) {
                            return annotation
                        }
                    }
                }
            }
        }

        it('should be able to delete an annotation', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            sidebar.processMutation({
                annotsByDay: {
                    $set: {
                        123: {
                            [DATA.PAGE_URL_1]: [DATA.ANNOT_1 as any],
                        },
                    },
                },
            })

            expect(
                findAnnotationInAnnotsByDay(
                    DATA.ANNOT_1.url,
                    sidebar.state.annotsByDay,
                ),
            ).toBeTruthy()
            await sidebar.processEvent('deleteAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(
                findAnnotationInAnnotsByDay(
                    DATA.ANNOT_1.url,
                    sidebar.state.annotsByDay,
                ),
            ).toBeFalsy()
        })

        it("should be able to toggle an annotation's bookmark", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({ device })

            sidebar.processMutation({
                annotsByDay: {
                    $set: {
                        123: {
                            [DATA.PAGE_URL_1]: [DATA.ANNOT_1 as any],
                        },
                    },
                },
            })

            expect(
                sidebar.state.annotsByDay[123][DATA.PAGE_URL_1][0].hasBookmark,
            ).toBeFalsy()
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(
                sidebar.state.annotsByDay[123][DATA.PAGE_URL_1][0].hasBookmark,
            ).toBe(true)
            await sidebar.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(
                sidebar.state.annotsByDay[123][DATA.PAGE_URL_1][0].hasBookmark,
            ).toBe(false)
        })

        it("should be able to edit an annotation's comment", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            sidebar.processMutation({
                annotsByDay: {
                    $set: {
                        123: {
                            [DATA.PAGE_URL_1]: [DATA.ANNOT_1 as any],
                        },
                    },
                },
            })

            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            const before = findAnnotationInAnnotsByDay(
                DATA.ANNOT_1.url,
                sidebar.state.annotsByDay,
            )
            expect(before).not.toBeUndefined()
            expect(before.comment).toEqual(DATA.ANNOT_1.comment)

            await sidebar.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
                tags: [],
            })

            const after = findAnnotationInAnnotsByDay(
                DATA.ANNOT_1.url,
                sidebar.state.annotsByDay,
            )
            expect(after).not.toBeUndefined()
            expect(after.comment).toEqual(editedComment)
        })
    })

    describe('page search results', () => {
        it('should be able to delete a page via confirm', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            sidebar.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            shouldDisplayTagPopup: false,
                        } as any,
                    },
                },
            })

            expect(Object.keys(sidebar.state.resultsByUrl).length).toBe(1)

            expect(
                sidebar.state.deletePageConfirm.pageUrlToDelete,
            ).toBeUndefined()
            await sidebar.processEvent('showPageDeleteConfirm', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(sidebar.state.deletePageConfirm.pageUrlToDelete).toEqual(
                DATA.PAGE_URL_1,
            )

            await sidebar.processEvent('deletePage', null)
            expect(
                sidebar.state.deletePageConfirm.pageUrlToDelete,
            ).toBeUndefined()
            expect(Object.keys(sidebar.state.resultsByUrl).length).toBe(0)
        })

        it("should be able to toggle a page's bookmark status", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            sidebar.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            hasBookmark: false,
                        } as any,
                    },
                },
            })

            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1].hasBookmark,
            ).toBe(false)
            await sidebar.processEvent('togglePageBookmark', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1].hasBookmark,
            ).toBe(true)
            await sidebar.processEvent('togglePageBookmark', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1].hasBookmark,
            ).toBe(false)
        })

        it("should be able to toggle a page's tag picker", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            sidebar.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            shouldDisplayTagPopup: false,
                        } as any,
                    },
                },
            })

            await sidebar.processEvent('togglePageTagPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayTagPopup,
            ).toBe(true)
            await sidebar.processEvent('togglePageTagPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayTagPopup,
            ).toBe(false)
        })

        it("should be able to toggle a page's collection picker", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            sidebar.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            shouldDisplayTagPopup: false,
                        } as any,
                    },
                },
            })

            await sidebar.processEvent('togglePageListPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayListPopup,
            ).toBe(true)
            await sidebar.processEvent('togglePageListPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                sidebar.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayListPopup,
            ).toBe(false)
        })

        it("should be able to toggle a page's annotations view", async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
            })

            const testTitle = 'test'
            const testUrl = 'test.com'

            expect(sidebar.state.showAnnotsForPage).toBeUndefined()
            await sidebar.processEvent('togglePageAnnotationsView', {
                pageTitle: testTitle,
                pageUrl: testUrl,
            })
            expect(sidebar.state.showAnnotsForPage).toEqual({
                url: testUrl,
                title: testTitle,
            })
            expect(sidebar.state.searchType).toEqual('notes')
            expect(sidebar.state.pageType).toEqual('page')
            await sidebar.processEvent('resetPageAnnotationsView', null)
            expect(sidebar.state.showAnnotsForPage).toBeUndefined()
            expect(sidebar.state.searchType).toEqual('page')
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

            expect(sidebar.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            await sidebar.processEvent('toggleNewPageCommentBookmark', null)
            expect(sidebar.state.commentBox.form.isCommentBookmarked).toBe(true)

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
            expect(sidebar.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
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
            expect(sidebar.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            expect(sidebar.state.commentBox.form.commentText).toEqual('')
            expect(sidebar.state.showCommentBox).toBe(false)
        })
    })

    describe('search-type switch', () => {
        it('should be able to set search type', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            await sidebar.processEvent('switchSearch', {
                changes: { searchType: 'notes' },
            })
            expect(sidebar.state.searchType).toEqual('notes')
            await sidebar.processEvent('switchSearch', {
                changes: { searchType: 'page' },
            })
            expect(sidebar.state.searchType).toEqual('page')
            await sidebar.processEvent('switchSearch', {
                changes: { searchType: 'social' },
            })
            expect(sidebar.state.searchType).toEqual('social')
        })

        it('should be able to set page type', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            await sidebar.processEvent('switchSearch', {
                changes: { pageType: 'all' },
            })
            expect(sidebar.state.pageType).toEqual('all')
            await sidebar.processEvent('switchSearch', {
                changes: { pageType: 'page' },
            })
            expect(sidebar.state.pageType).toEqual('page')
        })
    })
})
