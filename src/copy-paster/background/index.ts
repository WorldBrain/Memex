import Storex from '@worldbrain/storex'
import { Page } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/types'
import { Tag } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/types'
import { Note } from '@worldbrain/memex-storage/lib/mobile-app/features/page-editor/types'

import { bindMethod } from 'src/util/functions'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'
import { Template, TemplateDataFetchers } from '../types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import generateTemplateDocs from '../template-doc-generation'
import { joinTemplateDocs, analyzeTemplate } from '../utils'
import ContentSharingBackground from 'src/content-sharing/background'
import { getNoteShareUrl, getPageShareUrl } from 'src/content-sharing/utils'
import flatten from 'lodash/flatten'
import fromPairs from 'lodash/fromPairs'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCopyPasterInterface

    constructor(
        private options: {
            storageManager: Storex
            contentSharing: Pick<
                ContentSharingBackground,
                | 'shareAnnotations'
                | 'sharePage'
                | 'storage'
                | 'ensureRemotePageId'
            >
        },
    ) {
        // makes the custom copy paster table in indexed DB
        this.storage = new CopyPasterStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            findTemplate: bindMethod(this, 'findTemplate'),
            createTemplate: bindMethod(this, 'createTemplate'),
            updateTemplate: bindMethod(this, 'updateTemplate'),
            deleteTemplate: bindMethod(this, 'deleteTemplate'),
            renderTemplate: bindMethod(this, 'renderTemplate'),
            findAllTemplates: bindMethod(this, 'findAllTemplates'),
        }

        makeRemotelyCallable(this.remoteFunctions)
    }

    async createTemplate(params: Omit<Template, 'id'>) {
        return this.storage.createTemplate(params)
    }

    async findTemplate(params: { id: number }) {
        return this.storage.findTemplate(params)
    }

    async updateTemplate(params: Template) {
        return this.storage.updateTemplate(params)
    }

    async deleteTemplate(params: { id: number }) {
        return this.storage.deleteTemplate(params)
    }

    async findAllTemplates() {
        return this.storage.findAllTemplates()
    }

    async renderTemplate({
        id,
        annotationUrls,
        normalizedPageUrls,
    }: {
        id: number
        annotationUrls: string[]
        normalizedPageUrls: string[]
    }) {
        const template = await this.storage.findTemplate({ id })
        const templateDocs = await generateTemplateDocs({
            annotationUrls,
            normalizedPageUrls,
            templateAnalysis: analyzeTemplate(template),
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    async renderSinglePageTemplate(params: {
        templateId: number
        normalizedPageUrl: string
    }) {
        const template = await this.storage.findTemplate({
            id: params.templateId,
        })
        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate(template),
            normalizedPageUrls: [params.normalizedPageUrl],
            annotationUrls: [],
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    async renderMultiplePagesTemplate(params: {
        templateId: number
        normalizedPageUrls: string[]
    }) {
        const template = await this.storage.findTemplate({
            id: params.templateId,
        })
        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate(template),
            normalizedPageUrls: params.normalizedPageUrls,
            annotationUrls: [],
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    async renderSingleAnnotationTemplate(params: {
        templateId: number
        normalizedPageUrl: string
        annotationUrl: string
    }) {
        const template = await this.storage.findTemplate({
            id: params.templateId,
        })
        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate(template),
            normalizedPageUrls: [params.normalizedPageUrl],
            annotationUrls: [params.annotationUrl],
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    async renderMultipleAnnotationsTemplate(params: {
        templateId: number
        normalizedPageUrl: string
        annotationUrls: string[]
    }) {
        const template = await this.storage.findTemplate({
            id: params.templateId,
        })
        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate(template),
            normalizedPageUrls: [params.normalizedPageUrl],
            annotationUrls: params.annotationUrls,
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }
}

export function getTemplateDataFetchers({
    storageManager,
    contentSharing,
}: {
    storageManager: Storex
    contentSharing: Pick<
        ContentSharingBackground,
        'shareAnnotations' | 'sharePage' | 'storage' | 'ensureRemotePageId'
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

    const getNoteLinks = async (annotationUrls: string[]) => {
        await contentSharing.shareAnnotations({
            annotationUrls,
            queueInteraction: 'skip-queue',
        })
        const remoteIds = await contentSharing.storage.getRemoteAnnotationIds({
            localIds: annotationUrls,
        })
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
    }
    const getPageLinks = async (notes: {
        [normalizedPageUrl: string]: { annotationUrls: string[] }
    }) => {
        const annotationUrls = flatten(
            Object.values(notes).map((note) => note.annotationUrls),
        )
        await contentSharing.shareAnnotations({
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
                        body: note.body,
                        comment: note.comment,
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
        getTagsForPages: getTagsForUrls,
        getTagsForNotes: getTagsForUrls,
        getNoteLinks,
        getPageLinks,
    }
}
