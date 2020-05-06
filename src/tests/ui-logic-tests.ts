import { UILogic } from 'ui-logic-core'
import { TestLogicContainer } from 'ui-logic-core/lib/testing'
import { setupBackgroundIntegrationTest } from './background-integration-tests'
import { BackgroundIntegrationTestSetup } from './integration-tests'

export type UILogicTest<Context> = (context: Context) => Promise<void>
export type UILogicTestFactory<Context> = (
    description: string,
    test: UILogicTest<Context>,
) => void
export interface UILogicTestDevice extends BackgroundIntegrationTestSetup {
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
            const setup = await setupBackgroundIntegrationTest()
            await test({
                device: {
                    ...setup,
                    createElement: (logic) => new TestLogicContainer(logic),
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
                    const setup = await setupBackgroundIntegrationTest()
                    return {
                        ...setup,
                        createElement: (logic) => new TestLogicContainer(logic),
                    }
                },
            })
        })
    }
}
