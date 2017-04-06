import whenAllSettled from 'src/util/when-all-settled'
import { inlineAttributes } from './common'

const attributesToInline = [
    {
        elements: 'img',
        attributes: 'src',
    },
    {
        elements: 'link[rel*=icon]',
        attributes: 'href',
    },
]

export default async function inlineImages({rootElement, docUrl}) {
    const jobs = attributesToInline.map(options =>
        inlineAttributes({...options, rootElement, docUrl})
    )
    await whenAllSettled(jobs)
}
