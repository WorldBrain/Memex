import { Template } from '../types'

export interface RemoteCopyPasterInterface {
    createTemplate(args: Omit<Template, 'id'>): Promise<number>
    findTemplate(args: { id: number }): Promise<Template>
    updateTemplate(args: Template): Promise<void>
    deleteTemplate(args: { id: number }): Promise<void>
    findAllTemplates(): Promise<Template[]>
    renderTemplate(args: {
        id: number
        annotationUrls: string[]
        normalizedPageUrls: string[]
    }): Promise<string>
}
