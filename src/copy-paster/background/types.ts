import type { Template } from '../types'
import type { UnifiedSearchParams } from 'src/search/background/types'

export interface RemoteCopyPasterInterface {
    createTemplate(args: Omit<Template, 'id'>): Promise<number>
    findTemplate(args: { id: number }): Promise<Template>
    updateTemplate(args: Template): Promise<void>
    deleteTemplate(args: { id: number }): Promise<void>
    findAllTemplates(): Promise<Template[]>
    renderTemplateForPageSearch(args: {
        id: number
        searchParams: UnifiedSearchParams
    }): Promise<string>
    renderPreviewForPageSearch(args: {
        template: Template
        searchParams: UnifiedSearchParams
        templateType: string
    }): Promise<string>
    renderTemplateForAnnotationSearch(args: {
        id: number
        searchParams: UnifiedSearchParams
    }): Promise<string>
    renderPreviewForAnnotationSearch(args: {
        template: Template
        searchParams: UnifiedSearchParams
        templateType: string
    }): Promise<string>
    renderTemplate(args: {
        id: number
        annotationUrls: string[]
        normalizedPageUrls: string[]
        skipNotes?: boolean
    }): Promise<string>
    renderPreview(args: {
        template: Template
        annotationUrls: string[]
        normalizedPageUrls: string[]
        templateType: string
        skipNotes?: boolean
    }): Promise<string>
}
