import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { DiscordEventActionProcessor } from '@worldbrain/memex-common/lib/discord/storage/hooks'
import { createDiscordEventProcessor } from '@worldbrain/memex-common/lib/discord/event-processor'
import {
    DiscordEventAction,
    DiscordUser,
} from '@worldbrain/memex-common/lib/discord/types'
import { DiscordChannelManager } from '@worldbrain/memex-common/lib/discord/channel-manager'

const defaultGuildId = 'guild-1'
const defaultChannelId = 'channel-1'
const defaultDiscordUser: DiscordUser = {
    id: 'test-user-1',
    username: 'test user',
}

async function setupTest(ops: { withDefaultList: boolean }) {
    const setup = await setupBackgroundIntegrationTest()
    const serverStorage = await setup.getServerStorage()
    const eventProcessor = createDiscordEventProcessor({
        getNow: () => Date.now(),
        storage: serverStorage,
    })
    const channelManager = new DiscordChannelManager({
        storageModules: serverStorage.modules,
    })

    await eventProcessor.deps.ensureDiscordUser({ user: defaultDiscordUser })

    if (ops.withDefaultList) {
        await channelManager.enableChannel({
            guildId: defaultGuildId,
            channelId: defaultChannelId,
            guildName: defaultGuildId,
            channelName: defaultChannelId,
        })
    }

    const actionProcessor = new DiscordEventActionProcessor({
        storageManager: serverStorage.manager,
        fetch: setup.fetch,
    })

    return {
        storageManager: serverStorage.manager,
        fetchMock: setup.fetch,
        actionProcessor,
        eventProcessor,
    }
}

describe('Discord integration data fetch tests', () => {
    it('should create discordEventAction record upon processing of a Discord message with a link', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
        } = await setupTest({ withDefaultList: true })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'test message with link: http://test.com',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                discordEvent: expect.any(Number),
            },
        ])
    })

    it('should NOT create discordEventAction record upon processing of a Discord message with NO link', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
        } = await setupTest({ withDefaultList: true })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'test message without link',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
    })

    it('should be able to process a discordEventAction, updating the assoc. sharedListEntry title with fetched data', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
            fetchMock,
        } = await setupTest({ withDefaultList: true })

        const testTitle = 'My test title'
        fetchMock.mock('*', 200, {
            response: `<html><head><title>${testTitle}</title></head><body>Hi</body></html>`,
        })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'test message with link: http://test.com',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        })

        const [discordEventAction] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        expect(discordEventAction).toEqual({
            id: expect.any(Number),
            discordEvent: expect.any(Number),
        })

        expect(
            await storageManager
                .collection('sharedListEntry')
                .findAllObjects({}),
        ).toEqual([
            expect.objectContaining({
                normalizedUrl: 'test.com',
                entryTitle: 'test.com',
            }),
        ])

        await actionProcessor.processDiscordEventAction(discordEventAction)

        expect(
            await storageManager
                .collection('sharedListEntry')
                .findAllObjects({}),
        ).toEqual([
            expect.objectContaining({
                normalizedUrl: 'test.com',
                entryTitle: testTitle,
            }),
        ])
    })

    it('should not write anything if unable to extract title from fetched data when processing a discordEventAction', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
            fetchMock,
        } = await setupTest({ withDefaultList: true })

        const testTitle = 'My test title'
        fetchMock.mock('*', 200, {
            // NOTE: The <title> tag is now missing
            response: `<html><head></head><body>No title tag!</body></html>`,
        })

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'test message with link: http://test.com',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        })

        const [discordEventAction] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        expect(discordEventAction).toEqual({
            id: expect.any(Number),
            discordEvent: expect.any(Number),
        })

        const sharedListEntriesPre = await storageManager
            .collection('sharedListEntry')
            .findAllObjects({})

        expect(sharedListEntriesPre).toEqual([
            expect.objectContaining({
                normalizedUrl: 'test.com',
                entryTitle: 'test.com',
            }),
        ])

        await actionProcessor.processDiscordEventAction(discordEventAction)

        expect(
            await storageManager
                .collection('sharedListEntry')
                .findAllObjects({}),
        ).toEqual(sharedListEntriesPre)
    })

    it('should throw an error when processing discordEventAction when fetch is unsuccessful', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
            fetchMock,
        } = await setupTest({ withDefaultList: true })

        fetchMock.mock('*', 404)

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'test message with link: http://test.com',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        })

        const [discordEventAction] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        let error: Error = null
        try {
            await actionProcessor.processDiscordEventAction(discordEventAction)
        } catch (err) {
            error = err
        }
        expect(error).not.toBe(null)
    })
})
