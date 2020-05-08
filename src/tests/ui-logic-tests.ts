import { UILogic } from 'ui-logic-core'
import { TestLogicContainer } from 'ui-logic-core/lib/testing'
import { BackgroundModules } from 'src/background-script/setup'
import { setupBackgroundIntegrationTest } from './background-integration-tests'

export type UILogicTest<Context> = (context: Context) => Promise<void>
export type UILogicTestFactory<Context> = (
    description: string,
    test: UILogicTest<Context>,
) => void
export interface UILogicTestDevice {
    backgroundModules: BackgroundModules
    createElement: <State, Event>(
        logic: UILogic<State, Event>,
    ) => TestLogicContainer<State, Event>
}

export interface SingleDeviceUILogicTestContext {
    device: UILogicTestDevice
}
export interface MultiDeviceUILogicTestContext {
    createDevice: () => Promise<UILogicTestDevice>
}

export function makeSingleDeviceUILogicTestFactory(): UILogicTestFactory<
    SingleDeviceUILogicTestContext
> {
    return (description, test) => {
        it(description, async () => {
            const { backgroundModules } = await setupBackgroundIntegrationTest()
            await test({
                device: {
                    backgroundModules,
                    createElement: logic => new TestLogicContainer(logic),
                },
            })
        })
    }
}

export function makeMultiDeviceUILogicTestFactory(): UILogicTestFactory<
    MultiDeviceUILogicTestContext
> {
    return (description, test) => {
        it(description, async () => {
            await test({
                createDevice: async () => {
                    const {
                        backgroundModules,
                    } = await setupBackgroundIntegrationTest()
                    return {
                        backgroundModules,
                        createElement: logic => new TestLogicContainer(logic),
                    }
                },
            })
        })
    }
}
