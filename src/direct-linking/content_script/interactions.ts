import { remoteFunction } from 'src/util/webextensionRPC'
import { copyToClipboard } from './utils'
import { extractAnchor } from 'src/highlighting/ui'

export const createAndCopyDirectLink = async () => {
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    const url = window.location.href

    const anchor = await extractAnchor(selection)
    const result: { url: string } = await remoteFunction('createDirectLink')({
        url,
        anchor,
    })
    copyToClipboard(result.url)

    selection.removeAllRanges()
    selection.addRange(range)

    return result
}
