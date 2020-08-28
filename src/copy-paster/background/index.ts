import Storex from '@worldbrain/storex'
import { bindMethod } from 'src/util/functions'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'
import { Template, TemplateDataFetchers } from '../types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { generateTemplateDocs, renderTemplate } from '../utils'

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
            dataFetchers: this._getTemplateDataFetchers(),
        })
        return templateDocs
            .map((templateDoc) => renderTemplate(template, templateDoc))
            .join('\n\n')
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
            dataFetchers: this._getTemplateDataFetchers(),
        })
        return templateDocs
            .map((templateDoc) => renderTemplate(template, templateDoc))
            .join('\n\n')
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
            dataFetchers: this._getTemplateDataFetchers(),
        })
        return templateDocs
            .map((templateDoc) => renderTemplate(template, templateDoc))
            .join('\n\n')
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
            dataFetchers: this._getTemplateDataFetchers(),
        })
        return templateDocs
            .map((templateDoc) => renderTemplate(template, templateDoc))
            .join('\n\n')
    }

    _getTemplateDataFetchers(): TemplateDataFetchers {
        return {
            getPages: async () => ({}),
            getTagsForPages: async () => ({}),
            getNotes: async () => ({}),
            getNoteTags: async () => ({}),
        }
    }
}
