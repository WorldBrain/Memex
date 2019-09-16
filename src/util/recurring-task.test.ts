import { RecurringTask } from './recurring-task'
import { sleepPromise } from './promises'

function createTestTask(f?: () => Promise<void>) {
    const runs: number[] = []
    return {
        runs,
        task: async () => {
            runs.push(Date.now())
            if (f) {
                await f()
            }
        },
    }
}

function createTestSetTimeout() {
    const calls: Array<{ f: () => void; miliseconds: number }> = []
    return {
        calls,
        setTimeout: (f: () => void, miliseconds: number) => {
            calls.push({ f, miliseconds })
            return setTimeout(f, miliseconds)
        },
    }
}

interface TestOptions {
    intervalInMs: number
    task?: () => Promise<void>
}
function setupTest(options: TestOptions) {
    const intervalInMs = options.intervalInMs
    const testTask = createTestTask(options.task)
    const testSetTimeout = createTestSetTimeout()
    const nowBefore = Date.now()
    const errors: Error[] = []
    const recurring = new RecurringTask(testTask.task, {
        intervalInMs,
        setTimeout: testSetTimeout.setTimeout,
        onError: err => errors.push(err),
    })

    return {
        intervalInMs,
        testTask,
        testSetTimeout,
        nowBefore,
        recurringTask: recurring,
        errors,
    }
}

async function runTest(
    options: TestOptions,
    f: (setup: ReturnType<typeof setupTest>) => Promise<void>,
) {
    const setup = setupTest(options)
    try {
        await f(setup)
    } finally {
        setup.recurringTask.stop()
    }
}

describe('Recurring task', () => {
    it('should not run the task when constructed', async () => {
        await runTest({ intervalInMs: 1000 }, async setup => {
            expect(setup.testTask.runs).toEqual([])
            expect(setup.errors).toEqual([])
        })
    })

    it('should schedule the task when constructed', async () => {
        await runTest({ intervalInMs: 1000 }, async setup => {
            expect(setup.testSetTimeout.calls).toEqual([
                { f: expect.any(Function), miliseconds: setup.intervalInMs },
            ])
            expect(
                setup.recurringTask.aproximateNextRun -
                    (setup.nowBefore + setup.intervalInMs),
            ).toBeLessThan(50)
            expect(setup.errors).toEqual([])
        })
    })

    it('should trigger the task on the desired interval', async () => {
        await runTest({ intervalInMs: 300 }, async setup => {
            await sleepPromise(setup.intervalInMs + 10)
            setup.recurringTask.stop()
            expect(setup.testTask.runs.length).toEqual(1)
            const firstRun = setup.testTask.runs[0]
            expect(
                firstRun - (setup.nowBefore + setup.intervalInMs),
            ).toBeLessThan(50)
            expect(setup.errors).toEqual([])
        })
    })

    it('should reschedule the task when triggered by timout', async () => {
        await runTest({ intervalInMs: 300 }, async setup => {
            await sleepPromise(setup.intervalInMs + 10)
            expect(
                setup.recurringTask.aproximateNextRun -
                    (setup.nowBefore + setup.intervalInMs * 2),
            ).toBeLessThan(50)
            setup.recurringTask.stop()
            expect(setup.testTask.runs.length).toEqual(1)
            expect(setup.errors).toEqual([])
        })
    })

    it('should reschedule the task when triggered by timout fails', async () => {
        await runTest(
            {
                intervalInMs: 300,
                task: async () => {
                    throw new Error('Boooh!')
                },
            },
            async setup => {
                await sleepPromise(setup.intervalInMs + 10)
                expect(
                    setup.recurringTask.aproximateNextRun -
                        (setup.nowBefore + setup.intervalInMs * 2),
                ).toBeLessThan(50)
                setup.recurringTask.stop()
                expect(setup.testTask.runs.length).toEqual(1)
                expect(setup.errors).toEqual([new Error('Boooh!')])
            },
        )
    })

    it('should reschedule the task only after task is done', async () => {
        await runTest(
            { intervalInMs: 300, task: () => sleepPromise(500) },
            async setup => {
                await sleepPromise(350)
                expect(
                    setup.recurringTask.aproximateNextRun -
                        (setup.nowBefore + setup.intervalInMs),
                ).toBeLessThan(50)
                setup.recurringTask.stop()
                expect(setup.testTask.runs.length).toEqual(1)
                expect(setup.testSetTimeout.calls).toEqual([
                    {
                        f: expect.any(Function),
                        miliseconds: setup.intervalInMs,
                    },
                ])
                expect(setup.errors).toEqual([])
            },
        )
    })

    it('should be able to force the task to be triggered', async () => {
        await runTest({ intervalInMs: 300 }, async setup => {
            await setup.recurringTask.forceRun()
            setup.recurringTask.stop()
            expect(setup.testTask.runs.length).toEqual(1)
            expect(setup.errors).toEqual([])
        })
    })

    it('should reschedule the task after forcing', async () => {
        await runTest({ intervalInMs: 300 }, async setup => {
            await setup.recurringTask.forceRun()
            expect(
                setup.recurringTask.aproximateNextRun -
                    (setup.nowBefore + setup.intervalInMs),
            ).toBeLessThan(50)
            setup.recurringTask.stop()
            expect(setup.testSetTimeout.calls).toEqual([
                { f: expect.any(Function), miliseconds: setup.intervalInMs },
                { f: expect.any(Function), miliseconds: setup.intervalInMs },
            ])
            expect(setup.errors).toEqual([])
        })
    })

    it('should reschedule the task if it fails when forcing', async () => {
        await runTest(
            {
                intervalInMs: 300,
                task: async () => {
                    throw new Error('Boooh!')
                },
            },
            async setup => {
                await expect(setup.recurringTask.forceRun()).rejects.toThrow(
                    'Boooh!',
                )
                expect(
                    setup.recurringTask.aproximateNextRun -
                        (setup.nowBefore + setup.intervalInMs),
                ).toBeLessThan(50)
                setup.recurringTask.stop()

                expect(setup.testSetTimeout.calls).toEqual([
                    {
                        f: expect.any(Function),
                        miliseconds: setup.intervalInMs,
                    },
                    {
                        f: expect.any(Function),
                        miliseconds: setup.intervalInMs,
                    },
                ])
                expect(setup.errors).toEqual([new Error('Boooh!')])
            },
        )
    })
})
