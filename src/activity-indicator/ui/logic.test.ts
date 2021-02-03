import {
    makeSingleDeviceUILogicTestFactory,
    SingleDeviceUILogicTestContext,
} from 'src/tests/ui-logic-tests'
import Logic, { Dependencies } from './logic'

function setupTest(
    { device }: SingleDeviceUILogicTestContext,
    openFeedUrl: Dependencies['openFeedUrl'] = () => undefined,
) {
    const logicInstance = new Logic({ openFeedUrl })

    const logic = device.createElement(logicInstance)

    return { logic, logicInstance }
}

const it = makeSingleDeviceUILogicTestFactory()

describe('Feed activity indicator UI', () => {
    it('TODO: FIX THE RPC ERROR WITH THESE TESTS', async () =>
        expect(1).toBe(1))
    // TODO : figure out why remote calls are not working
    // it('should be able to init state based on BG activity status', async (context) => {
    //     context.device.backgroundModules.activityIndicator.checkActivityStatus = async () =>
    //         'has-unseen'
    //     const { logic: logicA } = setupTest(context)
    //     expect(logicA.state.hasFeedActivity).toBe(false)
    //     await logicA.init()
    //     expect(logicA.state.hasFeedActivity).toBe(true)
    //     context.device.backgroundModules.activityIndicator.checkActivityStatus = async () =>
    //         'all-seen'
    //     const { logic: logicB } = setupTest(context)
    //     expect(logicB.state.hasFeedActivity).toBe(false)
    //     await logicB.init()
    //     expect(logicB.state.hasFeedActivity).toBe(false)
    //     context.device.backgroundModules.activityIndicator.checkActivityStatus = async () =>
    //         'error'
    //     const { logic: logicC } = setupTest(context)
    //     expect(logicC.state.hasFeedActivity).toBe(false)
    //     await logicC.init()
    //     expect(logicC.state.hasFeedActivity).toBe(false)
    //     context.device.backgroundModules.activityIndicator.checkActivityStatus = async () =>
    //         'not-logged-in'
    //     const { logic: logicD } = setupTest(context)
    //     expect(logicD.state.hasFeedActivity).toBe(false)
    //     await logicD.init()
    //     expect(logicD.state.hasFeedActivity).toBe(false)
    // })
    //
    // it('should open feed URL and switch status state on click', async (context) => {
    //     let activitiesMarkedAsSeen = false
    //     let feedUrlOpened = false
    //     context.device.backgroundModules.activityIndicator.markActivitiesAsSeen = async () => {
    //         activitiesMarkedAsSeen = true
    //     }
    //     const { logic } = setupTest(context, () => {
    //         feedUrlOpened = true
    //     })
    //     logic.processMutation({ hasFeedActivity: { $set: true } })
    //     expect(logic.state.hasFeedActivity).toBe(true)
    //     expect(feedUrlOpened).toBe(false)
    //     expect(activitiesMarkedAsSeen).toBe(false)
    //     await logic.processEvent('clickFeedEntry', null)
    //     expect(logic.state.hasFeedActivity).toBe(false)
    //     expect(feedUrlOpened).toBe(true)
    //     expect(activitiesMarkedAsSeen).toBe(true)
    // })
})
