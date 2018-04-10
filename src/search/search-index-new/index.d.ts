import { ExportedPageContent, ExportedPageVisit } from '../migration'

export interface PageInput {
    url: string
    content: ExportedPageContent
    [extras: string]: any
}

export type VisitInput = number
export type BookmarkInput = number

export interface AddPageInput {
    pageDoc: PageInput
    visits: VisitInput[]
    bookmark?: BookmarkInput
}

export function addPage(input: AddPageInput): Promise<void>

export function addTag(url: string, tag: string): Promise<void>

export function updateTimestampMeta(
    url: string,
    timestamp: number,
    data: Partial<ExportedPageVisit>,
): Promise<void>
