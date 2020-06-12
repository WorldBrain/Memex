export interface Template {
    id: number
    title: string
    code: string
    isFavourite: boolean
}

export interface TemplateDoc {
    url: string
    title: string
    tags: string[]
}
