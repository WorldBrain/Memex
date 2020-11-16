import { Item, ServiceParser } from '../types'

const parseNetscape: ServiceParser = (doc) => {
    const links = doc.getElementsByTagName('a')
    const collectionName = 'Imported Bookmarks'
    const items: Item[] = []
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
            tags: tags.map((tag) =>
                tag.trim().replace(/\s\s+/g, ' ').toLowerCase(),
            ),
            collections: [collectionName],
            timeAdded: link.hasAttribute('add_date')
                ? Number(link.getAttribute('add_date'))
                : Date.now(),
        }
        items.push(item)
    }

    return items
}

export default parseNetscape
