import { UILogic } from 'ui-logic-core'
import { TestLogicContainer } from 'ui-logic-core/lib/testing'
import mapValues from 'lodash/mapValues'

import {
    setupBackgroundIntegrationTest,
    BackgroundIntegrationTestSetupOpts,
} from './background-integration-tests'
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

export function makeSingleDeviceUILogicTestFactory(
    options?: BackgroundIntegrationTestSetupOpts,
): UILogicTestFactory<SingleDeviceUILogicTestContext> {
    return (description, test) => {
        it(description, async () => {
            const setup = await setupBackgroundIntegrationTest(options)
            await test({
                device: {
                    ...setup,
                    createElement: (logic) => new TestLogicContainer(logic),
                },
            })
        })
    }
}

export function makeMultiDeviceUILogicTestFactory(
    options?: BackgroundIntegrationTestSetupOpts,
): UILogicTestFactory<MultiDeviceUILogicTestContext> {
    return (description, test) => {
        it(description, async () => {
            await test({
                createDevice: async () => {
                    const setup = await setupBackgroundIntegrationTest(options)
                    return {
                        ...setup,
                        createElement: (logic) => new TestLogicContainer(logic),
                    }
                },
            })
        })
    }
}

export function insertBackgroundFunctionTab(remoteFunctions, tab: any = {}) {
    return mapValues(remoteFunctions, (f) => {
        return (...args: any[]) => {
            return f({ tab }, ...args)
        }
    })
}
