import {
    makeSingleDeviceUILogicTestFactory,
    SingleDeviceUILogicTestContext,
} from 'src/tests/ui-logic-tests'
import { Logic, LogicDeps } from './logic'

describe('Update notification banner logic tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    function setupTest(
        { device }: SingleDeviceUILogicTestContext,
        options: {} & LogicDeps,
    ) {
        const logicInstance = new Logic({ ...options })

        const logic = device.createElement(logicInstance)
        return { logic, logicInstance }
    }

    it('should be able to init visibility state based on storage read state', async (context) => {
        const { logic: logic1 } = setupTest(context, {
            getStorage: async () => false,
            setStorage: () => undefined,
            getFeatureBaseToken: async () => 'test',
        })

        expect(logic1.state.isVisible).toBe(false)
        await logic1.init()
        expect(logic1.state.isVisible).toBe(true)

        const { logic: logic2 } = setupTest(context, {
            getStorage: async () => true,
            setStorage: () => undefined,
            getFeatureBaseToken: async () => 'test',
        })

        expect(logic2.state.isVisible).toBe(false)
        await logic2.init()
        expect(logic2.state.isVisible).toBe(false)
    })

    it('should be able to hide view and set storage as read', async (context) => {
        let readFlag = false
        const { logic } = setupTest(context, {
            getStorage: async () => readFlag,
            setStorage: async (key, value) => {
                readFlag = value
            },
            getFeatureBaseToken: async () => 'test',
        })

        expect(logic.state.isVisible).toBe(false)
        await logic.init()
        expect(logic.state.isVisible).toBe(true)

        expect(readFlag).toBe(false)
        await logic.processEvent('hide', null)
        expect(readFlag).toBe(true)
        expect(logic.state.isVisible).toBe(false)
    })
})
