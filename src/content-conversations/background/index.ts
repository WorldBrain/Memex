import type { ContentConversationsInterface } from './types'
import type { ServerStorageModules } from 'src/storage/types'
import type { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export default class ContentConversationsBackground {
    remoteFunctions: ContentConversationsInterface

    constructor(
        private options: {
            services: Pick<Services, 'contentConversations'>
            serverStorage: Pick<ServerStorageModules, 'contentConversations'>
        },
    ) {
        this.remoteFunctions = {
            submitReply: async (params) => {
                const { contentConversations } = options.services
                return contentConversations.submitReply(params)
            },
            editReply: async (params) => {
                const { contentConversations } = options.services
                return contentConversations.editReply(params)
            },
            deleteReply: async (params) => {
                const { contentConversations } = options.services
                return contentConversations.deleteReply(params)
            },
            getThreadsForSharedAnnotations: async ({
                sharedAnnotationReferences,
                sharedListReference,
            }) => {
                const { contentConversations } = this.options.serverStorage
                return contentConversations.getThreadsForAnnotations({
                    annotationReferences: sharedAnnotationReferences,
                    sharedListReference,
                })
            },
            getRepliesBySharedAnnotation: async ({
                sharedAnnotationReference,
                sharedListReference,
            }) => {
                const { contentConversations } = this.options.serverStorage
                return contentConversations.getRepliesByAnnotation({
                    annotationReference: sharedAnnotationReference,
                    sharedListReference,
                })
            },
            getOrCreateThread: async ({
                sharedAnnotationReference,
                ...params
            }) => {
                const { contentConversations } = this.options.serverStorage
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
