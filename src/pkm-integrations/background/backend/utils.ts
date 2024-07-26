import resolveImgSrc from '@worldbrain/memex-common/lib/annotations/replace-img-src-with-cloud-address.service-worker'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { PKMSyncBackgroundModule } from '..'

export async function shareAnnotationWithPKM(
    annotationData,
    pkmSyncBG,
    checkForFilteredSpaces?,
) {
    let item = {
        type: 'annotation',
        data: annotationData,
    }

    if (
        item.data.pageUrl.includes('twitter.com') ||
        item.data.pageUrl.includes('x.com')
    ) {
        if (item.data.pageTitle.length === 0) {
            return
        }
        let title = item.data.pageTitle?.replace(/[^a-zA-Z0-9]/g, ' ')
        title = item.data.pageTitle?.substring(0, 100).trim()
        title = item.data.pageTitle
            ?.substring(0, 100)
            .trim()
            .replace(/\n/g, ' ')

        if (annotationData.comment) {
            annotationData = resolveImgSrc(
                annotationData.comment,
                process.env.NODE_ENV,
            )
        }

        const itemToSync = {
            annotationId: annotationData.annotationId,
            pageTitle: title,
            body: annotationData.body,
            comment: annotationData.comment,
            createdWhen: annotationData.createdWhen,
            color: annotationData.color,
            pageCreatedWhen: annotationData.pageCreatedWhen,
            pageUrl: annotationData.pageUrl,
        }

        item = {
            type: 'annotation',
            data: itemToSync,
        }

        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    } else {
        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    }
}
export async function sharePageWithPKM(
    pageData,
    pkmSyncBG,
    checkForFilteredSpaces?,
) {
    let item = {
        type: 'page',
        data: pageData,
    }

    if (
        item.data.pageUrl.includes('twitter.com') ||
        item.data.pageUrl.includes('x.com')
    ) {
        if (item.data.pageTitle.length === 0) {
            return
        }
        let title = item.data.pageTitle?.replace(/[^a-zA-Z0-9]/g, ' ')
        title = item.data.pageTitle?.substring(0, 100).trim()
        title = item.data.pageTitle
            ?.substring(0, 100)
            .trim()
            .replace(/\n/g, ' ')

        const annotatinon =
            '<div>' + item.data.pageTitle.replace(/\n/g, '<br/>') + '</div>'

        const itemToSync = {
            annotationId: item.data.pageUrl,
            pageTitle: title,
            pageUrl: item.data.pageUrl,
            pageCreatedWhen: item.data.createdWhen,
            comment: annotatinon,
            createdWhen: item.data.createdWhen,
        }

        item = {
            type: 'annotation',
            data: itemToSync,
        }

        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    } else {
        await pkmSyncBG.pushPKMSyncUpdate(item, checkForFilteredSpaces)
    }
}

export type rabbitHoleDocument = {
    pageTitle: string
    fullUrl: string
    createdWhen: Date | number
    creatorId: string | AutoPk
    contentType: string
    fullHTML: string
}

export async function createRabbitHoleEntry(
    entryData: rabbitHoleDocument,
    pkmSyncBG: PKMSyncBackgroundModule,
) {
    await pkmSyncBG.pushRabbitHoleUpdate(entryData)
}

export async function addFeedSources(feedSources, pkmSyncBG) {
    await pkmSyncBG.addFeedSources(feedSources)
}
