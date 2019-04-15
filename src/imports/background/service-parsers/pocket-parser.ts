import { Item, ServiceParser } from '../types'

const POCKET_PRE = 'Pocket-'
const readingTimePattern = /^[0-9]+\s+\bmin\b/

const parsePocket: ServiceParser = doc => {
    const collections = []
    const items: Item[] = []
    const collectionElements = doc.getElementsByTagName('h1')
    const lists = doc.getElementsByTagName('ul')

    for (const element of collectionElements) {
        collections.push(element.textContent)
    }

    for (const [index, list] of Object.entries(lists)) {
        const links = list.getElementsByTagName('a')
        for (const link of links) {
            if (!link.hasAttribute('href')) {
                continue
            }

            const tags = link.hasAttribute('tags')
                ? link.getAttribute('tags').length !== 0
                    ? link.getAttribute('tags').split(',')
                    : []
                : []

            const item: Item = {
                url: link.getAttribute('href'),
                title: link.textContent || link.getAttribute('href'),
                tags: tags
                    .map(tag =>
                        tag
                            .trim()
                            .replace(/\s\s+/g, ' ')
                            .toLowerCase(),
                    )
                    .filter(tag => !tag.match(readingTimePattern)),
                collections: collections[index]
                    ? [POCKET_PRE + collections[index]]
                    : [],
                timeAdded: link.hasAttribute('time_added')
                    ? Number(link.getAttribute('time_added'))
                    : null,
            }
            items.push(item)
        }
    }
    return items
}

export default parsePocket
