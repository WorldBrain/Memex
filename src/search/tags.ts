import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'
import { initErrHandler } from './storage'
import { DBGet } from './types'
import { pageIsStub } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import TagStorage from 'src/tags/background/storage'

// const modifyTag = (shouldAdd: boolean) => (pageStorage: PageStorage, tagStorage: TagStorage) =>
//     async function (params: {
//         url: string
//         tag: string
//         tabId?: number
//     }) {
//         let page = await pageStorage.getPage(params.url)

//         if (page == null || pageIsStub(page)) {
//             page = await createPageViaBmTagActs(pageStorage)({
//                 url: params.url,
//                 tabId: params.tabId,
//             })
//         }

//         // Add new visit if none, else page won't appear in results
//         await pageStorage.addPageVisitIfHasNone(page.url, Date.now())

//         if (shouldAdd) {
//             await tagStorage.addTag({ url: params.url, name: params.tag }).catch(initErrHandler())
//         } else {
//             await tagStorage.delTag({ url: params.url, name: params.tag }).catch(initErrHandler())
//         }
//     }

// export const delTag = modifyTag(false)
// export const addTag = modifyTag(true)

// export const fetchPageTags = (tagStorage: TagStorage) => async (url: string) => {
//     return tagStorage.fetchPageTags({ url })
// }
