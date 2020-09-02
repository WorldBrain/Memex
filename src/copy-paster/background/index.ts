import Storex from '@worldbrain/storex'
import { Page } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/types'
import { Tag } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/types'
import { Note } from '@worldbrain/memex-storage/lib/mobile-app/features/page-editor/types'

import { bindMethod } from 'src/util/functions'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'
import { Template, TemplateDataFetchers } from '../types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { generateTemplateDocs } from '../template-doc-generation'
import { joinTemplateDocs } from '../utils'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCopyPasterInterface

    constructor(
        private options: {
            storageManager: Storex
        },
    ) {
        // makes the custom copy paster table in indexed DB
        this.storage = new CopyPasterStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            createTemplate: bindMethod(this, 'createTemplate'),
            findTemplate: bindMethod(this, 'findTemplate'),
            updateTemplate: bindMethod(this, 'updateTemplate'),
            deleteTemplate: bindMethod(this, 'deleteTemplate'),
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

    async renderSinglePageTemplate(params: {
        templateId: number
        normalizedPageUrl: string
    }) {
        const template = await this.storage.findTemplate({
            id: params.templateId,
        })
        const templateDocs = await generateTemplateDocs({
            template,
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
            template,
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
            template,
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
            template,
            normalizedPageUrls: [params.normalizedPageUrl],
            annotationUrls: params.annotationUrls,
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }
}

export function getTemplateDataFetchers({
    storageManager,
}: {
    storageManager: Storex
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

    const getLinksForUrls = async (urls: string[]) => {
        // TODO: hook this up to proper call
        return urls.reduce((acc, url) => ({ ...acc, [url]: url }), {})
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
        getTagsForPages: getTagsForUrls,
        getTagsForNotes: getTagsForUrls,
        getNoteLinks: getLinksForUrls,
        getPageLinks: getLinksForUrls,
    }
}
