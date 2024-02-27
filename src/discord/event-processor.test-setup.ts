import flatten from 'lodash/flatten'
import expect from 'expect'
import { createDiscordEventProcessor } from '@worldbrain/memex-common/lib/discord/event-processor'
import { DiscordChannelManager } from '@worldbrain/memex-common/lib/discord/channel-manager'
import { createMemoryServerStorage } from 'src/storage/server.tests'
import type { DiscordMessageCreateInfo } from '@worldbrain/memex-common/lib/discord/types'
import { extractListShareUrlParts } from 'src/content-sharing/utils'

export const makeId = (
    type: 'chl' | 'msg' | 'gld' | 'usr' | 'avt',
    id: number,
) => `${type}-${id}`

export async function setupDiscordTestContext(options: {
    withDefaultList?: boolean
    defaultListEnabled?: boolean
}) {
    const messages: { [messageId: number]: DiscordMessageCreateInfo } = {}
    const sharedLists: { [listId: number]: number | string } = {}
    let defaultGuildId: string
    let defaultGuildName: string
    let defaultChannelId: string
    let defaultChannelName: string

    const serverStorage = await createMemoryServerStorage()

    const eventProcessor = createDiscordEventProcessor({
        storage: serverStorage,
        getNow: () => Date.now(),
    })

    const channelManager = new DiscordChannelManager({
        storageModules: serverStorage.modules,
    })

    if (options.withDefaultList) {
        defaultGuildId = makeId('gld', 1)
        defaultGuildName = 'Guild 1'
        defaultChannelId = makeId('chl', 1)
        defaultChannelName = 'Channel 1'

        const { memexSocialLink } = await channelManager.enableChannel({
            channelId: defaultChannelId,
            channelName: defaultChannelName,
            guildId: defaultGuildId,
            guildName: defaultGuildName,
        })
        if (!options.defaultListEnabled) {
            await channelManager.disableChannel({
                channelId: defaultChannelId,
                guildId: defaultGuildId,
            })
        }

        const { remoteListId } = extractListShareUrlParts(memexSocialLink)
        sharedLists[1] = Number(remoteListId)
    }

    return {
        defaultListDetails: options.withDefaultList && {
            guildId: defaultGuildId,
            guildName: defaultGuildName,
            channelId: defaultChannelId,
            channelName: defaultChannelName,
        },
        serverStorage,
        channelManager,
        postMessage: async (params: {
            messageId: number
            messageLink: string
            content: string
            userId?: number
            guildId?: number
            channelId?: { channel: number } | { message: number }
            replyTo?: number
        }) => {
            const repliedToInfo = params.replyTo && messages[params.replyTo]
            const info: DiscordMessageCreateInfo = {
                reference: {
                    guildId: makeId('gld', params.guildId ?? 1),
                    channelId: params.channelId
                        ? 'channel' in params.channelId
                            ? makeId('chl', params.channelId.channel)
                            : makeId('msg', params.channelId.message)
                        : makeId('chl', 1),
                    messageId: makeId('msg', params.messageId),
                },
                author: {
                    id: makeId('usr', params.userId ?? 1),
                    avatar: makeId('avt', params.userId ?? 1),
                    username: `User ${params.userId ?? 1}`,
                },
                content: params.content,
                discordMessageLink: params.messageLink,
                replyTo: repliedToInfo && repliedToInfo.reference,
                repliedToUser: repliedToInfo && repliedToInfo.author,
            }
            messages[params.messageId] = info
            await eventProcessor.processMessageCreate(info)
        },
        assertData: async (data: {
            users: number[]
            pages: Array<{
                userId: number
                pageId: number
                messageId: number
                normalizedUrl: string
                hasBeenUpdated?: boolean
                /** Denotes whether this page is only here for the purposes of test setup's data model */
                doesNotExistInDB?: boolean
                // originalMessageId?: number
            }>
            annotations: Array<{
                pageId: number
                comment: string
            }>
        }) => {
            const sharedListId = sharedLists[1]
            const storedUsers = await serverStorage.manager.operation(
                'findObjects',
                'user',
                {},
            )
            expect(storedUsers).toEqual(
                data.users.map((id) => ({
                    id: `discord:usr-${id}`,
                    displayName: `User ${id}`,
                    platform: 'discord',
                    platformId: `usr-${id}`,
                })),
            )

            const storedMessages: any[] = await serverStorage.manager.operation(
                'findObjects',
                'discordEvent',
                {},
                { sort: [['createdWhen', 'asc']] },
            )

            const expectedLinkMessages: any[] = data.pages.map((page) => {
                const msg = messages[page.messageId]
                // const origMsg =
                //     messages[page.originalMessageId ?? page.messageId]
                return {
                    id: expect.anything(),
                    createdWhen: expect.any(Number),
                    type: 'link',
                    guildId: msg.reference.guildId,
                    channelId: msg.reference.channelId,
                    messageId: msg.reference.messageId,
                    // originalChannelId: origMsg.reference.channelId,
                    // originalMessageId: origMsg.reference.messageId,
                    normalizedPageUrl: page.normalizedUrl,
                    sharedList: sharedListId,
                }
            })
            expect(storedMessages.filter((msg) => msg.type === 'link')).toEqual(
                expectedLinkMessages,
            )

            const storedListEntries = await serverStorage.manager.operation(
                'findObjects',
                'sharedListEntry',
                {},
                { sort: [['createdWhen', 'asc']] },
            )
            data.pages
                .filter((page) => !page.doesNotExistInDB)
                .forEach((page, i) => {
                    if (page.hasBeenUpdated) {
                        expect(storedListEntries[i].updatedWhen).not.toEqual(
                            storedListEntries[i].createdWhen,
                        )
                    } else {
                        expect(storedListEntries[i].updatedWhen).toEqual(
                            storedListEntries[i].createdWhen,
                        )
                    }
                    expect(storedListEntries[i]).toEqual({
                        id: expect.anything(),
                        creator: `discord:usr-${page.userId}`,
                        createdWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        entryTitle: page.normalizedUrl,
                        normalizedUrl: page.normalizedUrl,
                        originalUrl: `https://${page.normalizedUrl}/`,
                        sharedList: sharedListId,
                    })
                })

            const storedAnnotations = await serverStorage.manager.operation(
                'findObjects',
                'sharedAnnotation',
                {},
                { sort: [['createdWhen', 'asc']] },
            )
            expect(storedAnnotations).toEqual(
                data.annotations.map((annotation) => {
                    const page = data.pages.find(
                        (page) => page.pageId === annotation.pageId,
                    )
                    return {
                        id: expect.anything(),
                        creator: `discord:usr-${page.userId}`,
                        normalizedPageUrl: page.normalizedUrl,
                        createdWhen: expect.any(Number),
                        uploadedWhen: expect.any(Number),
                        updatedWhen: expect.any(Number),
                        comment: annotation.comment,
                    }
                }),
            )

            const storedAnnotationEntries = await serverStorage.manager.operation(
                'findObjects',
                'sharedAnnotationListEntry',
                {},
                { sort: [['createdWhen', 'asc']] },
            )
            let annotationCounter = 0
            expect(storedAnnotationEntries).toEqual(
                flatten(
                    data.annotations.map((annotation) => {
                        const page = data.pages.find(
                            (page) => page.pageId === annotation.pageId,
                        )
                        return {
                            id: expect.anything(),
                            creator: `discord:usr-${page.userId}`,
                            normalizedPageUrl: page.normalizedUrl,
                            createdWhen: expect.any(Number),
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            sharedList: sharedListId,
                            sharedAnnotation:
                                storedAnnotations[annotationCounter++].id,
                        }
                    }),
                ),
            )
        },
    }
}
