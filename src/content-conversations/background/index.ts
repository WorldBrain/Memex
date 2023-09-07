import type { ContentConversationsInterface } from './types'
import type { ServerStorageModules } from 'src/storage/types'
import type { Services } from 'src/services/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export default class ContentConversationsBackground {
    remoteFunctions: ContentConversationsInterface

    constructor(
        private options: {
            servicesPromise: Promise<Pick<Services, 'contentConversations'>>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'contentConversations'>
            >
        },
    ) {
        this.remoteFunctions = {
            submitReply: async (params) => {
                const { contentConversations } = await options.servicesPromise
                return contentConversations.submitReply(params)
            },
            editReply: async (params) => {
                const { contentConversations } = await options.servicesPromise
                return contentConversations.editReply(params)
            },
            deleteReply: async (params) => {
                const { contentConversations } = await options.servicesPromise
                return contentConversations.deleteReply(params)
            },
            getThreadsForSharedAnnotations: async ({
                sharedAnnotationReferences,
                sharedListReference,
            }) => {
                const {
                    contentConversations,
                } = await this.options.getServerStorage()
                return contentConversations.getThreadsForAnnotations({
                    annotationReferences: sharedAnnotationReferences,
                    sharedListReference,
                })
            },
            getRepliesBySharedAnnotation: async ({
                sharedAnnotationReference,
                sharedListReference,
            }) => {
                const {
                    contentConversations,
                } = await this.options.getServerStorage()
                return contentConversations.getRepliesByAnnotation({
                    annotationReference: sharedAnnotationReference,
                    sharedListReference,
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
