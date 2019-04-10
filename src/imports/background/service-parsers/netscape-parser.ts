import { Item, ServiceParser } from '../types'

const parseNetscape: ServiceParser = doc => {
    const links = doc.getElementsByTagName('a')
    const collectionName = 'Bookmarks Bar'
    const items: Item[] = []
    for (const link of links) {
        if (!link.hasAttribute('href')) {
            continue
        }
        const item: Item = {
            url: link.getAttribute('href'),
            title: link.textContent || link.getAttribute('href'),
            tags: link.hasAttribute('tags')
                ? link.getAttribute('tags').length !== 0
                    ? link.getAttribute('tags').split(',')
                    : []
                : [],
            collections: [collectionName],
            timeAdded: link.hasAttribute('add_date')
                ? Number(link.getAttribute('add_date'))
                : null,
        }
        items.push(item)
    }

    return items
}

export default parseNetscape
