import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { ChatEventActionProcessor } from '@worldbrain/memex-common/lib/chat-bots/storage-hooks'
import { createDiscordEventProcessor } from '@worldbrain/memex-common/lib/discord/event-processor'
import type {
    DiscordEvent,
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

    const actionProcessor = new ChatEventActionProcessor({
        chatEventActionCollection: 'discordEventAction',
        chatEventCollection: 'discordEvent',
        storageManager: serverStorage.manager,
        fetch: setup.fetch,
    })

    return {
        storageManager: serverStorage.manager,
        fetchMock: setup.fetch,
        actionProcessor,
        eventProcessor,
        // TODO: find better way of asserting error (couldn't get `expect().toThrow()` to work)
        assertErrorIsThrownOnActionProcessingAttempt: async (
            action: DiscordEventAction,
        ) => {
            let error: Error = null
            try {
                await actionProcessor.processChatEventAction(action)
            } catch (err) {
                error = err
            }
            expect(error).not.toBe(null)
        },
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

        const [discordEvent] = (await storageManager
            .collection('discordEvent')
            .findAllObjects({})) as [DiscordEvent]

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([
            {
                id: expect.any(Number),
                discordEvent: discordEvent.id,
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

        await actionProcessor.processChatEventAction(discordEventAction)

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

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
    })

    it('should not attempt fetch if sharedListEntry title already different to the URL when processing discordEventAction', async () => {
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

        const [discordEventActionA] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        expect(discordEventActionA).toEqual({
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
        expect(fetchMock.calls().length).toBe(0)

        await actionProcessor.processChatEventAction(discordEventActionA)

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
        expect(fetchMock.calls().length).toBe(1)

        await eventProcessor.processMessageCreate({
            author: defaultDiscordUser,
            content: 'another test message with the same link: http://test.com',
            discordMessageLink: 'https://discord.com/blah-2',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-2',
            },
        })

        const [discordEventActionB] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        expect(discordEventActionB).toEqual({
            id: expect.any(Number),
            discordEvent: expect.any(Number),
        })

        await actionProcessor.processChatEventAction(discordEventActionB)

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
        expect(fetchMock.calls().length).toBe(1)
        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
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

        try {
            await actionProcessor.processChatEventAction(discordEventAction)
        } catch (err) {}

        expect(
            await storageManager
                .collection('sharedListEntry')
                .findAllObjects({}),
        ).toEqual(sharedListEntriesPre)

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
    })

    it('should throw an error when processing discordEventAction when fetch is unsuccessful', async () => {
        const {
            storageManager,
            actionProcessor,
            eventProcessor,
            fetchMock,
            assertErrorIsThrownOnActionProcessingAttempt,
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

        await assertErrorIsThrownOnActionProcessingAttempt(discordEventAction)

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
    })

    it('should throw an error when processing discordEventAction with a discordEvent not of `link` type or no associated discordEvent', async () => {
        const {
            storageManager,
            eventProcessor,
            assertErrorIsThrownOnActionProcessingAttempt,
        } = await setupTest({ withDefaultList: true })

        const messageCreateInfo = {
            author: defaultDiscordUser,
            content: 'test message with link: http://test.com',
            discordMessageLink: 'https://discord.com/blah',
            reference: {
                channelId: defaultChannelId,
                guildId: defaultGuildId,
                messageId: 'message-1',
            },
        }

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate(messageCreateInfo)

        const [discordEventActionA] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        // Delete associated discordEvent to verify it errors out on processing attempt
        await storageManager.collection('discordEvent').deleteObjects({})

        await assertErrorIsThrownOnActionProcessingAttempt(discordEventActionA)

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])

        await eventProcessor.processMessageCreate(messageCreateInfo)

        const [discordEventActionB] = (await storageManager
            .collection('discordEventAction')
            .findAllObjects({})) as [DiscordEventAction]

        // Update associated discordEvent to be non-link type to verify it errors out on processing attempt
        await storageManager
            .collection('discordEvent')
            .updateOneObject(
                { id: discordEventActionB.discordEvent },
                { type: 'reply' },
            )

        await assertErrorIsThrownOnActionProcessingAttempt(discordEventActionB)

        expect(
            await storageManager
                .collection('discordEventAction')
                .findAllObjects({}),
        ).toEqual([])
    })
})
