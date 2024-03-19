import TurndownService from 'turndown/src/turndown'
import { parseHTML } from 'linkedom/worker'

// TOOD: Refactor this into a service which can instantiated then passed down into BG modules
export function htmlToMarkdown(
    html: string,
    applyCustomRules?: (turndown: TurndownService) => void,
): string {
    if (!html?.length) {
        return ''
    }

    const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        codeBlockStyle: 'fenced',
        htmlParser: {
            parseFromString: (html: string) => {
                const { document } = parseHTML(html)
                return document
            },
        },
    })
    applyCustomRules?.(turndownService)
    const markdown = turndownService.turndown(html)
    return markdown
}
