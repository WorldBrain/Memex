import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import Logic, { Dependencies } from './logic'

async function setupTest(device: UILogicTestDevice) {
    await device.authService.loginWithEmailAndPassword(
        'user@user.com',
        'password',
    )
    const logicInstance = new Logic({
        activityIndicatorBG: device.backgroundModules.activityIndicator,
        // openFeedUrl,
    })

    const logic = device.createElement(logicInstance)

    return { logic, logicInstance }
}

const it = makeSingleDeviceUILogicTestFactory()

describe('Feed activity indicator UI', () => {
    it('Should set state on init depending what activity status is retrieved', async ({
        device,
    }) => {
        const { logic } = await setupTest(device)

        await device.backgroundModules.activityIndicator[
            'options'
        ].syncSettings.activityIndicator.set('feedHasActivity', true)

        expect(logic.state.hasFeedActivity).toBe(false)
        await logic.init()
        expect(logic.state.hasFeedActivity).toBe(true)

        await device.backgroundModules.activityIndicator[
            'options'
        ].syncSettings.activityIndicator.set('feedHasActivity', false)

        await logic.init()
        expect(logic.state.hasFeedActivity).toBe(false)
    })

    // TODO: Fix this test
    it(
        'should open feed and mark off activities as seen on click',
        async ({ device }) => {
            let isFeedOpen = false
            const { logic } = await setupTest(device)

            await device.backgroundModules.activityIndicator[
                'options'
            ].syncSettings.activityIndicator.set('feedHasActivity', true)

            expect(logic.state.hasFeedActivity).toBe(false)
            await logic.init()

            expect(isFeedOpen).toBe(false)
            expect(logic.state.hasFeedActivity).toBe(true)
            expect(
                await device.backgroundModules.activityIndicator[
                    'options'
                ].syncSettings.activityIndicator.get('feedHasActivity'),
            ).toEqual(true)

            await logic.processEvent('clickFeedEntry', null)

            expect(isFeedOpen).toBe(true)
            expect(logic.state.hasFeedActivity).toBe(false)
            expect(
                await device.backgroundModules.activityIndicator[
                    'options'
                ].syncSettings.activityIndicator.get('feedHasActivity'),
            ).toEqual(false)
        },
        { shouldSkip: true },
    )
})
