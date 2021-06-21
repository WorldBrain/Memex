import type { ContentConversationsInterface } from './types'
import type { ServerStorageModules } from 'src/storage/types'
import type { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export default class ContentConversationsBackground {
    remoteFunctions: ContentConversationsInterface

    constructor(
        private options: {
            services: Pick<Services, 'contentConversations'>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentConversations'>
            >
        },
    ) {
        this.remoteFunctions = {
            submitReply: async (params) =>
                options.services.contentConversations.submitReply(params),
            getThreadsForSharedAnnotations: async ({
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

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }
}
