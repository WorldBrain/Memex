import { PipelineRes } from 'src/search'

export function pageIsStub(page: PipelineRes): boolean {
    return page.text == null && (page.terms == null || !page.terms.length)
}
