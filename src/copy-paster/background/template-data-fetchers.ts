import Storex from '@worldbrain/storex'
import { Page } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/types'
import { Tag } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/types'
import { Note } from '@worldbrain/memex-storage/lib/mobile-app/features/page-editor/types'

import { getNoteShareUrl, getPageShareUrl } from 'src/content-sharing/utils'
import ContentSharingBackground from 'src/content-sharing/background'
import { TemplateDataFetchers } from '../types'
import fromPairs from 'lodash/fromPairs'
import flatten from 'lodash/flatten'

export function getTemplateDataFetchers({
    storageManager,
    contentSharing,
}: {
    storageManager: Storex
    contentSharing: Pick<
        ContentSharingBackground,
        | 'shareAnnotations'
        | 'shareAnnotationsToLists'
        | 'storage'
        | 'ensureRemotePageId'
    >
}): TemplateDataFetchers {
    const getTagsForUrls = async (urls: string[]) => {
        const tags: Tag[] = await storageManager
            .collection('tags')
            .findObjects({ url: { $in: urls } })

        const tagsForUrls: { [url: string]: string[] } = {}
        for (const tag of tags) {
            tagsForUrls[tag.url] = [...(tagsForUrls[tag.url] ?? []), tag.name]
        }
        return tagsForUrls
    }

    return {
        getPages: async (normalizedPageUrls) => {
            const pages: Page[] = await storageManager
                .collection('pages')
                .findObjects({ url: { $in: normalizedPageUrls } })

            return pages.reduce(
                (acc, page) => ({
                    ...acc,
                    [page.url]: {
                        fullTitle: page.fullTitle,
                        fullUrl: page.fullUrl,
                    },
                }),
                {},
            )
        },
        getNotes: async (annotationUrls) => {
            const notes: Note[] = await storageManager
                .collection('annotations')
                .findObjects({ url: { $in: annotationUrls } })

            return notes.reduce(
                (acc, note) => ({
                    ...acc,
                    [note.url]: {
                        url: note.url,
                        body: note.body,
                        comment: note.comment,
                        pageUrl: note.pageUrl,
                    },
                }),
                {},
            )
        },
        getNoteIdsForPages: async (normalizedPageUrls) => {
            const notes: Note[] = await storageManager
                .collection('annotations')
                .findObjects({ pageUrl: { $in: normalizedPageUrls } })

            return notes.reduce(
                (acc, note) => ({
                    ...acc,
                    [note.pageUrl]: [...(acc[note.pageUrl] ?? []), note.url],
                }),
                {},
            )
        },
        getNoteLinks: async (annotationUrls) => {
            await contentSharing.shareAnnotations({
                annotationUrls,
                queueInteraction: 'skip-queue',
            })
            await contentSharing.shareAnnotationsToLists({
                annotationUrls,
                queueInteraction: 'skip-queue',
            })
            const remoteIds = await contentSharing.storage.getRemoteAnnotationIds(
                {
                    localIds: annotationUrls,
                },
            )
            const noteLinks: { [annotationUrl: string]: string } = {}
            for (const [annotationUrl, remoteId] of Object.entries(remoteIds)) {
                noteLinks[annotationUrl] = getNoteShareUrl({
                    remoteAnnotationId:
                        typeof remoteId === 'string'
                            ? remoteId
                            : remoteId.toString(),
                })
            }
            return noteLinks
        },
        getPageLinks: async (notes) => {
            const annotationUrls = flatten(
                Object.values(notes).map((note) => note.annotationUrls),
            )
            await contentSharing.shareAnnotations({
                annotationUrls,
                queueInteraction: 'skip-queue',
            })
            await contentSharing.shareAnnotationsToLists({
                annotationUrls,
                queueInteraction: 'skip-queue',
            })
            const pairs = await Promise.all(
                Object.keys(notes).map(async (normalizedPageUrl) => [
                    normalizedPageUrl,
                    getPageShareUrl({
                        remotePageInfoId: await contentSharing.ensureRemotePageId(
                            normalizedPageUrl,
                        ),
                    }),
                ]),
            )
            return fromPairs(pairs)
        },
        getTagsForPages: getTagsForUrls,
        getTagsForNotes: getTagsForUrls,
    }
}
