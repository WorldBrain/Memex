import { DISCORD_LIST_USER_ID } from '@worldbrain/memex-common/lib/discord/constants'
import { setupDiscordTestContext, makeId } from './event-processor.test-setup'

const missingGuildId = makeId('gld', 99)
const missingChannelId = makeId('chl', 99)
const missingChannelName = 'test'

describe('Discord channel management module', () => {
    it('should create a new sharedList and enabled discordList when enabling a channel that does not yet exist in the DB', async () => {
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

        await channelManager.enableChannel({
            channelName: missingChannelName,
            channelId: missingChannelId,
            guildId: missingGuildId,
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
            },
        ])
        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                sharedList: sharedLists[0].id,
                guildId: missingGuildId,
                channelId: missingChannelId,
                channelName: missingChannelName,
                enabled: true,
            },
        ])
    })

    it('should set discordList as enabled when enabling a channel that already exists in the DB', async () => {
        const {
            serverStorage,
            channelManager,
            defaultListDetails,
        } = await setupDiscordTestContext({ withDefaultList: true })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: false,
            },
        ])

        await channelManager.enableChannel({
            channelName: defaultListDetails.channelName,
            channelId: defaultListDetails.channelId,
            guildId: defaultListDetails.guildId,
        })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: true,
            },
        ])
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

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
                channelId: defaultListDetails.channelId,
                channelName: defaultListDetails.channelName,
                enabled: true,
            },
        ])

        await channelManager.disableChannel({
            channelId: defaultListDetails.channelId,
            guildId: defaultListDetails.guildId,
        })

        expect(
            await serverStorage.manager
                .collection('discordList')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                sharedList: expect.any(Number),
                guildId: defaultListDetails.guildId,
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

        await channelManager.disableChannel({
            channelId: missingChannelId,
            guildId: missingGuildId,
        })

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
})
