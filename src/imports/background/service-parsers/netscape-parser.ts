import { Item, ServiceParser, RecursiveNetscapeParser } from '../types'

const parseNetscapeLink: (link: Element, collectionName: string) => Item = (
    link,
    collectionName,
) => {
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
    return item
}

const parseDescriptionList: RecursiveNetscapeParser = (
    element,
    items = [],
    parentCollectionName = '',
) => {
    // parseDescriptionList recursively gets items from collections and sub-collections.
    // element contains nested description lists <dl> elements with <dt> and <dd> elements
    // dt may contain collection names as headers (h1, h2, h3) followed by another dl element (containing items and maybe more collections)

    if (element.tagName === 'DT') {
        if (['H3', 'H2', 'H1'].includes(element.children[0].tagName)) {
            // if dt contains a h3 element, it is a collection name, get it.
            const subCollectionName =
                element.children[0].textContent !== ''
                    ? element.children[0].textContent
                    : 'Imported Bookmarks'
            const collectionName =
                parentCollectionName !== ''
                    ? `${parentCollectionName} > ${subCollectionName}`
                    : subCollectionName
            // if a dl element follows h3, it is a sub-collection, get sub-collection names
            if (element.children[1].tagName === 'DL') {
                return parseDescriptionList(
                    element.children[1],
                    items,
                    collectionName,
                )
            }
        } else {
            // if dt contains a elements, they are bookmarks
            const links = Array.from(element.querySelectorAll('a'))
            const newItems = links
                .filter((link) => link.hasAttribute('href'))
                .map((link) => parseNetscapeLink(link, parentCollectionName))
            return items.concat(newItems)
        }
    } else if (element.tagName === 'DL') {
        for (let child of element.children) {
            if (child.tagName === 'DT') {
                items = parseDescriptionList(child, items, parentCollectionName)
            }
        }
    }
    console.log('Raindrop Import', { items })
    return items
}

const parseShallowList: ServiceParser = (doc) => {
    // h1 are collection names, bookmarks are <a> elements, no nested collections
    let items = []
    const headers = doc.querySelectorAll('body > h1')
    for (let header of headers) {
        const collectionName =
            header.textContent !== ''
                ? header.textContent
                : 'Imported Bookmarks'
        const links = Array.from(
            header.nextElementSibling.querySelectorAll('a'),
        )
        const newItems = links
            .filter((link) => link.hasAttribute('href'))
            .map((link) => parseNetscapeLink(link, collectionName))
        items = items.concat(newItems)
    }
    return items
}

const parseNoFolders: ServiceParser = (doc) => {
    const links = Array.from(doc.getElementsByTagName('a'))
    const collectionName = 'Imported Bookmarks'
    const items: Item[] = links
        .filter((link: Element) => link.hasAttribute('href'))
        .map((link: Element) => parseNetscapeLink(link, collectionName))
    return items
}

const identifyService: (doc: Document) => string = (doc) => {
    const title = doc.querySelector('title')
    if (title) {
        if (title.textContent.includes('Pocket')) {
            return 'pocket'
        } else if (title.textContent.includes('Raindrop.io')) {
            return 'raindrop'
        } else if (title.textContent.includes('Instapaper')) {
            return 'instapaper' //same as pocket
        } else if (title.textContent.includes('Pinboard')) {
            return 'pinboard' //same as pocket
        } else if (title.textContent.includes('Bookmarks')) {
            // Could be diigo or BookmarkOS, but they both work with parseDescriptionList
            return 'bookmarks'
        }
    }
    return 'netscape'
}
const parseNetscape: ServiceParser = (doc) => {
    const serviceName = identifyService(doc)
    switch (serviceName) {
        case 'pocket':
            return parseShallowList(doc)
        case 'raindrop':
            return parseDescriptionList(doc.querySelector('dl'), [], '')
        case 'instapaper':
            return parseShallowList(doc)
        case 'diigo':
            return parseNoFolders(doc)
        case 'pinboard':
            return parseNoFolders(doc)
        case 'bookmarks':
            return parseDescriptionList(doc.querySelector('dl'), [], '')
        default:
            return parseNoFolders(doc)
    }
}

export default parseNetscape
