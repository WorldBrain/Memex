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
import SearchBackground from 'src/search/background'
import {
    AnnotsByPageUrl,
    AnnotationsSearchResponse,
} from 'src/search/background/types'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCopyPasterInterface

    constructor(
        private options: {
            storageManager: Storex
            search: Pick<SearchBackground, 'searchPages' | 'searchAnnotations'>
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
            findAllTemplates: bindMethod(this, 'findAllTemplates'),
            renderTemplate: this.renderTemplate,
            renderTemplateForPageSearch: this.renderTemplateForPageSearch,
            renderTemplateForAnnotationSearch: this
                .renderTemplateForAnnotationSearch,
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

    renderTemplate: RemoteCopyPasterInterface['renderTemplate'] = async ({
        id,
        annotationUrls,
        normalizedPageUrls,
    }) => {
        const template = await this.storage.findTemplate({ id })
        const templateDocs = await generateTemplateDocs({
            annotationUrls,
            normalizedPageUrls,
            templateAnalysis: analyzeTemplate(template),
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    renderTemplateForPageSearch: RemoteCopyPasterInterface['renderTemplateForPageSearch'] = async ({
        id,
        searchParams,
    }) => {
        const template = await this.storage.findTemplate({ id })
        const searchResponse = await this.options.search.searchPages({
            ...searchParams,
            skip: 0,
            limit: 100000,
        })

        const normalizedPageUrls = searchResponse.docs.map((page) => page.url)

        const templateDocs = await generateTemplateDocs({
            annotationUrls: [],
            normalizedPageUrls,
            templateAnalysis: analyzeTemplate(template),
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }

    renderTemplateForAnnotationSearch: RemoteCopyPasterInterface['renderTemplateForAnnotationSearch'] = async ({
        id,
        searchParams,
    }) => {
        const template = await this.storage.findTemplate({ id })
        const searchResponse = (await this.options.search.searchAnnotations({
            ...searchParams,
            skip: 0,
            limit: 100000,
        })) as AnnotationsSearchResponse

        let annotationUrls: string[]
        let normalizedPageUrls: string[]

        // The results shape differ depending on whether or not a terms query was specified
        if (searchResponse.isAnnotsSearch) {
            // TODO: Properly work out how to use this horrible shape again
            const annotsByPages: AnnotsByPageUrl[] = Object.values(
                searchResponse.annotsByDay,
            )
            const pageUrlSet = new Set<string>()
            const annotUrlSet = new Set<string>()

            // for (const annotsByPage of annotsByPages){
            //     pageUrlSet.add(pageUrl)
            //     (annotations as Annotation[]).forEach(a => annotUrlSet.add(a.url))
            // }

            normalizedPageUrls = [...pageUrlSet]
        } else {
            normalizedPageUrls = [
                ...new Set(searchResponse.docs.map((page) => page.url)),
            ]
            const annotations = searchResponse.docs
                .map((page) => page.annotations)
                .flat()
            annotationUrls = [...new Set(annotations.map((a) => a.url))]
        }

        const templateDocs = await generateTemplateDocs({
            annotationUrls,
            normalizedPageUrls,
            templateAnalysis: analyzeTemplate(template),
            dataFetchers: getTemplateDataFetchers(this.options),
        })
        return joinTemplateDocs(templateDocs, template)
    }
}
