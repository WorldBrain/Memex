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
            const collectionName =
                parentCollectionName !== ''
                    ? `${parentCollectionName} > ${element.children[0].textContent}`
                    : element.children[0].textContent
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

const parseNoFolders = (doc) => {
    const links = Array.from(doc.getElementsByTagName('a'))
    const collectionName = 'Imported Bookmarks'
    const items: Item[] = links
        .filter((link: Element) => link.hasAttribute('href'))
        .map((link: Element) => parseNetscapeLink(link, collectionName))
    return items
}

const parseNetscape: ServiceParser = (doc) => {
    const isRaindrop = doc
        .querySelector('title')
        .innerText.includes('Raindrop.io')
    return isRaindrop
        ? parseDescriptionList(doc.querySelector('dl'), [], '')
        : parseNoFolders(doc)
}

export default parseNetscape
