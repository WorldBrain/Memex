import createResolvable from '@josephg/resolvable'
import { setupBackgroundIntegrationTest } from '../tests/background-integration-tests'
import ActionQueue from '../../external/@worldbrain/memex-common/ts/action-queue'

async function setupTest() {
    const { backgroundModules } = await setupBackgroundIntegrationTest()
    const { actionQueue } = backgroundModules.personalCloud
    return {
        actionQueue: actionQueue as ActionQueue<any>,
    }
}

describe('Action queue', () => {
    it('should be able to skip the queue', async () => {
        const { actionQueue } = await setupTest()

        let executed = false
        actionQueue.options.executeAction = async () => {
            executed = true
        }
        actionQueue.storage.queueAction = async () => {
            throw new Error(`Action should not be queued`)
        }
        await actionQueue.scheduleAction(
            { type: 'test' },
            { queueInteraction: 'skip-queue' },
        )
    })

    it('should be able to schedule a skipping action while another skipping action is being executed', async () => {
        const { actionQueue } = await setupTest()

        let executing = createResolvable()
        const resolvable = createResolvable()
        actionQueue.options.executeAction = async () => {
            executing.resolve()
            await resolvable
        }
        const first = actionQueue.scheduleAction(
            { type: 'test' },
            { queueInteraction: 'skip-queue' },
        )
        await executing
        executing = createResolvable()
        const second = actionQueue.scheduleAction(
            { type: 'test' },
            { queueInteraction: 'skip-queue' },
        )
        await executing
        resolvable.resolve()
        await first
        await second
    })
})
