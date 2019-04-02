import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import { Annotation } from 'src/direct-linking/types'

interface Item {
    url: string
    title?: string
    collections?: string[]
    tags?: string[]
    annotations?: Annotation[]
    comments?: string
    timeAdded?: number
}

const POCKET_PRE = 'Pocket-'

export const parsePocket = doc => {
    const document = doc as HTMLElement
    const collections = []
    const items: Item[] = []
    const collectionElements = document.getElementsByTagName('h1')
    const lists = document.getElementsByTagName('ul')

    for (const element of collectionElements) {
        collections.push(element.innerText)
    }

    for (const [index, list] of Object.entries(lists)) {
        const links = list.getElementsByTagName('a')
        for (const link of links) {
            if (!link.hasAttribute('href')) {
                continue
            }
            const item: Item = {
                url: link.getAttribute('href'),
                title: link.innerText || link.getAttribute('href'),
                tags: link.hasAttribute('tags')
                    ? link.getAttribute('tags').length !== 0
                        ? link.getAttribute('tags').split(',')
                        : []
                    : [],
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

const loadBlob = ({
    url,
    timeout,
    responseType,
}: {
    url: string
    timeout: number
    responseType?: any
}) => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest()
        req.timeout = timeout
        req.responseType = responseType
        req.open('GET', url, true)
        req.onload = () => resolve(req.response)
        req.onerror = () => reject(req.statusText)
        req.send()
    })
}

export const parseFile = async (url, allowTypes) => {
    const contents = await loadBlob({
        url,
        timeout: 10000,
        responseType: 'document',
    })

    return parsePocket(contents)
}
