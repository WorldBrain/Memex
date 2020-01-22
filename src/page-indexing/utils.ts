import { Page } from 'src/search'

export function pageIsStub(page: Page): boolean {
    return page.text == null && (page.terms == null || !page.terms.length)
}
