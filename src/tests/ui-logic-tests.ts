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
    opts?: { shouldSkip?: boolean },
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
    return (description, test, opts) => {
        let testRunner = opts?.shouldSkip ? it.skip : it
        testRunner(description, async () => {
            const setup = await setupBackgroundIntegrationTest(options)
            setup.backgroundModules.personalCloud.actionQueue.forceQueueSkip = true
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
    return (description, test, opts) => {
        let testRunner = opts?.shouldSkip ? it.skip : it
        testRunner(description, async () => {
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

// TODO: properly type this (see usages)
export function insertBackgroundFunctionTab(remoteFunctions, tab: any = {}) {
    return mapValues(remoteFunctions, (f) => {
        return (...args: any[]) => {
            return f({ tab }, ...args)
        }
    })
}
