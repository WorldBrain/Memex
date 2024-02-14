import { Template } from '../types'
import { BackgroundSearchParams } from 'src/search/background/types'

export interface RemoteCopyPasterInterface {
    createTemplate(args: Omit<Template, 'id'>): Promise<number>
    findTemplate(args: { id: number }): Promise<Template>
    updateTemplate(args: Template): Promise<void>
    deleteTemplate(args: { id: number }): Promise<void>
    findAllTemplates(): Promise<Template[]>
    renderTemplateForPageSearch(args: {
        id: number
        searchParams: BackgroundSearchParams
    }): Promise<string>
    renderPreviewForPageSearch(args: {
        template: Template
        searchParams: BackgroundSearchParams
        templateType: string
    }): Promise<string>
    renderTemplateForAnnotationSearch(args: {
        id: number
        searchParams: BackgroundSearchParams
    }): Promise<string>
    renderPreviewForAnnotationSearch(args: {
        template: Template
        searchParams: BackgroundSearchParams
        templateType: string
    }): Promise<string>
    renderTemplate(args: {
        id: number
        annotationUrls: string[]
        normalizedPageUrls: string[]
    }): Promise<string>
    renderPreview(args: {
        template: Template
        annotationUrls: string[]
        normalizedPageUrls: string[]
        templateType: string
    }): Promise<string>
}
