import { ContentConversationsInterface } from './types'
import { ServerStorageModules } from 'src/storage/types'

export default class ContentConversationsBackground {
    remoteFunctions: ContentConversationsInterface

    constructor(
        private options: {
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentConversations'>
            >
        },
    ) {
        this.remoteFunctions = {
            getThreadsForSharedAnnotation: async ({
                sharedAnnotationReferences,
            }) => {
                const {
                    contentConversations,
                } = await this.options.getServerStorage()
                return contentConversations.getThreadsForAnnotations({
                    annotationReferences: sharedAnnotationReferences,
                })
            },
            getRepliesBySharedAnnotation: async ({
                sharedAnnotationReference,
            }) => {
                const {
                    contentConversations,
                } = await this.options.getServerStorage()
                return contentConversations.getRepliesByAnnotation({
                    annotationReference: sharedAnnotationReference,
                })
            },
            getOrCreateThread: async ({
                sharedAnnotationReference,
                ...params
            }) => {
                const {
                    contentConversations,
                } = await this.options.getServerStorage()
                return contentConversations.getOrCreateThread({
                    ...params,
                    annotationReference: sharedAnnotationReference,
                })
            },
        }
    }
}
