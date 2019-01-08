import { remoteFunction } from '../util/webextensionRPC'
import { Anchor } from '../direct-linking/content_script/interactions'

export default class AnnotationsManager {
    private _processEventRPC = remoteFunction('processEvent')
    private _createAnnotationRPC = remoteFunction('createAnnotation')
    private _addAnnotationTagRPC = remoteFunction('addAnnotationTag')

    public createAnnotation = async ({
        url,
        title,
        body,
        comment,
        anchor,
        tags,
    }: {
        url: string
        title: string
        body: string
        comment: string
        anchor: Anchor
        tags: string[]
    }) => {
        this._processEventRPC({ type: 'createAnnotation' })

        // Write annotation to database.
        const uniqueUrl = await this._createAnnotationRPC({
            url,
            title,
            body,
            comment,
            selector: anchor,
        })

        // Write tags to database.
        tags.forEach(async tag => {
            await this._addAnnotationTagRPC({ tag, url: uniqueUrl })
        })
    }
}
