import whenAllSettled from 'src/util/when-all-settled'
import { inlineUrlsInAttributes } from './common'

function getUrlsFromSrcset(srcsetValue) {
    // srcset example: srcset="http://image 2x, http://other-image 1.5x"
    const URLs = srcsetValue.split(',').map(srcsetItem =>
        srcsetItem.trim().split(/\s+/)[0]
    )
    return URLs
}

const attributesToInline = [
    {
        elements: 'img',
        attributes: 'src',
        fixIntegrity: true,
    },
    {
        elements: 'img',
        attributes: 'srcset',
        attrToUrls: getUrlsFromSrcset,
    },
    {
        elements: 'link[rel*=icon]',
        attributes: 'href',
        fixIntegrity: true,
    },
]

export default async function inlineImages({rootElement, docUrl}) {
    const jobs = attributesToInline.map(options =>
        inlineUrlsInAttributes({...options, rootElement, docUrl})
    )
    await whenAllSettled(jobs)
}
