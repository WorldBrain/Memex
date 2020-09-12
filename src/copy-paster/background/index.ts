import Storex from '@worldbrain/storex'

import { bindMethod } from 'src/util/functions'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'
import { Template } from '../types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import generateTemplateDocs from '../template-doc-generation'
import { joinTemplateDocs, analyzeTemplate } from '../utils'
import ContentSharingBackground from 'src/content-sharing/background'
import { getTemplateDataFetchers } from './template-data-fetchers'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCopyPasterInterface

    constructor(
        private options: {
            storageManager: Storex
            contentSharing: Pick<
                ContentSharingBackground,
                | 'shareAnnotations'
                | 'shareAnnotationsToLists'
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
}
