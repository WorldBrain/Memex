import { makeId, setupDiscordTestContext } from './event-processor.test-setup'
import { DISCORD_LIST_USER_ID } from '@worldbrain/memex-common/lib/chat-bots/constants'
import { getListShareUrl } from 'src/content-sharing/utils'
import type { DiscordList } from '@worldbrain/memex-common/lib/discord/types'
import type {
    SharedListKey,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

const missingGuildId = makeId('gld', 99)
const missingGuildName = 'test guild'
const missingChannelId = makeId('chl', 99)
const missingChannelName = 'test channel'

describe('Discord channel management module', () => {
    it('should create a new sharedList and enabled discordList when enabling a channel that does not yet exist in the DB, returning memex.social link to the sharedList', async () => {
        const { channelManager, serverStorage } = await setupDiscordTestContext(
            {},
        )

        expect(
            await serverStorage.manager
                .collection('sharedList')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([])

        expect(
            await channelManager.enableChannel({
                channelName: missingChannelName,
                channelId: missingChannelId,
                guildName: missingGuildName,
                guildId: missingGuildId,
            }),
        ).toEqual({
            changed: true,
            memexSocialLink: expect.any(String),
        })

        const sharedLists: any[] = await serverStorage.manager
            .collection('sharedList')
            .findAllObjects({})
        expect(sharedLists).toEqual([
            {
                id: expect.any(Number),
                creator: DISCORD_LIST_USER_ID,
                createdWhen: expect.any(Number),
                updatedWhen: expect.any(Number),
                title: missingChannelName,
                description: null,
                platform: 'discord',
            },
        ])
        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                sharedList: sharedLists[0].id,
                guildId: missingGuildId,
                guildName: missingGuildName,
                channelId: missingChannelId,
                channelName: missingChannelName,
                enabled: true,
            },
        ])
    })

    it('should set discordList as enabled when enabling a channel that already exists in the DB, returing memex.social link to the associated sharedList', async () => {
        const {
            serverStorage,
            channelManager,
            defaultListDetails,
        } = await setupDiscordTestContext({ withDefaultList: true })

        const discordLists: DiscordList[] = await serverStorage.manager
            .collection('discordList')
            .findAllObjects({})
        const sharedListKeys: Array<
            SharedListKey & { id: AutoPk }
        > = await serverStorage.manager
            .collection('sharedListKey')
            .findAllObjects({})
        const memexSocialLink = getListShareUrl({
            remoteListId: discordLists[0].sharedList.toString(),
            collaborationKey: sharedListKeys[0].id.toString(),
        })

        expect(discordLists).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: false,
            },
        ])

        expect(
            await channelManager.enableChannel({
                channelName: defaultListDetails.channelName,
                channelId: defaultListDetails.channelId,
                guildName: defaultListDetails.guildName,
                guildId: defaultListDetails.guildId,
            }),
        ).toEqual({ changed: true, memexSocialLink })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: true,
            },
        ])

        // Calling it again shouldn't result in any changes
        expect(
            await channelManager.enableChannel({
                channelName: defaultListDetails.channelName,
                channelId: defaultListDetails.channelId,
                guildName: defaultListDetails.guildName,
                guildId: defaultListDetails.guildId,
            }),
        ).toEqual({ changed: false, memexSocialLink })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: true,
            },
        ])
    })

    it('should generate a collaborative link for an already enabled discordList when enabling it for a second time - prev collab keys were not auto-created on list enable', async () => {
        const {
            serverStorage,
            channelManager,
        } = await setupDiscordTestContext({ withDefaultList: false })

        // Seed discordList data to simulate a discord list created prior to when collab keys were auto-created
        const testDiscordList: DiscordList = {
            sharedList: 1,
            enabled: true,
            guildId: 'test-guild-1',
            guildName: 'test-guild-1',
            channelId: 'test-channel-id-1',
            channelName: 'test-channel-name-1',
        }
        const listReference: SharedListReference = {
            type: 'shared-list-reference',
            id: testDiscordList.sharedList,
        }

        await serverStorage.manager
            .collection('discordList')
            .createObject(testDiscordList)

        expect(
            await serverStorage.modules.contentSharing.getListKeys({
                listReference,
            }),
        ).toEqual([])

        const enabledChannelResult = await channelManager.enableChannel({
            channelName: testDiscordList.channelName,
            channelId: testDiscordList.channelId,
            guildName: testDiscordList.guildName,
            guildId: testDiscordList.guildId,
        })

        const [
            collabKey,
        ] = await serverStorage.modules.contentSharing.getListKeys({
            listReference,
        })
        const memexSocialLink = getListShareUrl({
            remoteListId: testDiscordList.sharedList.toString(),
            collaborationKey: collabKey.reference.id.toString(),
        })

        expect(enabledChannelResult).toEqual({
            changed: 'new-collab-key',
            memexSocialLink,
        })

        // Calling it again shouldn't result in any changes
        expect(
            await channelManager.enableChannel({
                channelName: testDiscordList.channelName,
                channelId: testDiscordList.channelId,
                guildName: testDiscordList.guildName,
                guildId: testDiscordList.guildId,
            }),
        ).toEqual({ changed: false, memexSocialLink })
    })

    it('should set discordList as disabled when disabling a channel that already exists in the DB', async () => {
        const {
            serverStorage,
            channelManager,
            defaultListDetails,
        } = await setupDiscordTestContext({
            withDefaultList: true,
            defaultListEnabled: true,
        })

        const discordLists: DiscordList[] = await serverStorage.manager
            .collection('discordList')
            .findAllObjects({})
        const memexSocialLink = getListShareUrl({
            remoteListId: discordLists[0].sharedList.toString(),
        })

        expect(discordLists).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: true,
            },
        ])

        expect(
            await channelManager.disableChannel({
                channelId: defaultListDetails.channelId,
                guildId: defaultListDetails.guildId,
            }),
        ).toEqual({ changed: true, memexSocialLink })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: false,
            },
        ])

        // Calling it again shouldn't result in any changes
        expect(
            await channelManager.disableChannel({
                channelId: defaultListDetails.channelId,
                guildId: defaultListDetails.guildId,
            }),
        ).toEqual({ changed: false, memexSocialLink })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                guildName: defaultListDetails.guildName,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: false,
            },
        ])
    })

    it('should do nothing when disabling a channel that does not yet exist in the DB (out-of-scope)', async () => {
        const { serverStorage, channelManager } = await setupDiscordTestContext(
            {},
        )

        expect(
            await serverStorage.manager
                .collection('sharedList')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([])

        expect(
            await channelManager.disableChannel({
                channelId: missingChannelId,
                guildId: missingGuildId,
            }),
        ).toEqual({ changed: false, memexSocialLink: null })

        expect(
            await serverStorage.manager
                .collection('sharedList')
                .findAllObjects({}),
        ).toEqual([])
        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([])
    })

    it('should be able to list all enabled discordLists for a given guild, with their memex.social links to the associated sharedLists', async () => {
        const { channelManager } = await setupDiscordTestContext({})

        const guildIdA = makeId('gld', 998)
        const guildIdB = makeId('gld', 999)
        const guildName = 'test guild'
        const channelIds = [...Array(10).keys()]
        const channelIdxToLink = new Map<number, string>()

        expect(
            await channelManager.listEnabledChannels({ guildId: guildIdA }),
        ).toEqual([])

        for (const i of channelIds) {
            const { memexSocialLink } = await channelManager.enableChannel({
                guildId: guildIdA,
                guildName,
                channelId: makeId('chl', i),
                channelName: String(i),
            })
            channelIdxToLink.set(i, memexSocialLink)
        }

        const {
            memexSocialLink: guildBSocialLink,
        } = await channelManager.enableChannel({
            guildId: guildIdB,
            guildName: 'test guild 2',
            channelId: makeId('chl', 999),
            channelName: 'test channel guild 2',
        })

        expect(
            await channelManager.listEnabledChannels({ guildId: guildIdA }),
        ).toEqual(
            channelIds.map((i) => ({
                channelId: makeId('chl', i),
                memexSocialLink: channelIdxToLink.get(i),
            })),
        )

        for (const i of channelIds) {
            if (i % 2 === 0) {
                await channelManager.disableChannel({
                    guildId: guildIdA,
                    channelId: makeId('chl', i),
                })
            }
        }

        expect(
            await channelManager.listEnabledChannels({ guildId: guildIdA }),
        ).toEqual(
            channelIds
                .filter((v, i) => i % 2 !== 0)
                .map((i) => ({
                    channelId: makeId('chl', i),
                    memexSocialLink: channelIdxToLink.get(i),
                })),
        )

        expect(
            await channelManager.listEnabledChannels({ guildId: guildIdB }),
        ).toEqual([
            {
                channelId: makeId('chl', 999),
                memexSocialLink: guildBSocialLink,
            },
        ])
    })
})
