import TurndownService from 'turndown'
import { parseHTML } from 'linkedom/worker'

// TOOD: Refactor this into a service which can instantiated then passed down into BG modules
export function htmlToMarkdown(
    html: string,
    applyCustomRules?: (turndown: TurndownService) => void,
): string {
    if (!html?.length) {
        return ''
    }

    const { document: doc } = parseHTML(html)

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        codeBlockStyle: 'fenced',
    })

    applyCustomRules?.(turndownService)

    let markdown = turndownService.turndown(doc)

    // Replace escaped backslashes with nothing
    markdown = markdown.replace(/\\(.)/g, '$1')

    return markdown
}
