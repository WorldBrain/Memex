import { IdleManager } from './idle'

describe('Browser idle manager', () => {
    let instance: IdleManager

    beforeEach(() => {
        instance = new IdleManager()
    })

    test('Can schedule idle handlers', () => {
        const mockCbs = {
            idle: jest.fn(),
            locked: jest.fn(),
            active: jest.fn(),
        }
        instance.scheduleIdleCbs({
            onIdle: mockCbs.idle,
            onLocked: mockCbs.locked,
            onActive: mockCbs.active,
        })

        // Check the idle handlers exist inside instance
        const handlerSets = instance['handlers']
        for (const idleState of ['idle', 'locked', 'active']) {
            expect([...handlerSets[idleState]]).toEqual(
                expect.arrayContaining([mockCbs[idleState]]),
            )
        }
    })

    test('Can invoke scheduled idle handlers', () => {
        const mockCbs = {
            idle: jest.fn(),
            locked: jest.fn(),
            active: jest.fn(),
        }
        instance.scheduleIdleCbs({
            onIdle: mockCbs.idle,
            onLocked: mockCbs.locked,
            onActive: mockCbs.active,
        })

        // Should be scheduled, but not yet invoked
        for (const mockFn of Object.values(mockCbs)) {
            expect(mockFn.mock.calls.length).toBe(0)
        }

        const simulateIdleChange = state => {
            expect(mockCbs[state].mock.calls.length).toBe(0)
            instance.handleIdleStateChange(state)
            expect(mockCbs[state].mock.calls.length).toBe(1)
        }

        simulateIdleChange('idle')
        simulateIdleChange('active')
        simulateIdleChange('locked')
    })
})
