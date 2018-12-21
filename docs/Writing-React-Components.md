We try to separate UI logic as much as possible from React or any specific framework as much as possible. This not only allows for flexibility, but also to really easily develop the logic in a TDD way. To facilitate, we have written some small tools to facilitate this in `src/util/ui-logic.ts`. For starters, all new React components and their logic are written in TypeScript, allowing for much easier refactoring.

We'll start with an example to show the basics of how to develop a React confirmation screen component in a TDD way with the following requirements:

1. There's a text box in which the user has to enter a confirmation word
2. There's a close button

For every component, the convention is to have three files:

1. `<component>.tsx`: The React componenent itself
2. `<component>.logic.ts`: The framework-independent UI logic
3. `<component>.logic.test.ts`: The tests for the UI logic

As we're developing TDD-style, let's first write the tests in `confirmation-screen.logic.test.ts`:

```
import * as expect from 'expect'
import * as logic from './confirmation-screen.logic'
import { setupUiLogicTest } from 'src/util/ui-logic'

describe('Restore confirmation logic', () => {
    it('should work', async () => {
        const { state, events, trigger } = setupUiLogicTest({
            inititalState: logic.INITIAL_STATE,
            eventNames: ['onConfirm', 'onClose'],
            eventProcessor: logic.processEvent,
        })

        await trigger({ type: 'onClose' })
        expect(events.log).toEqual([{ event: 'onClose', args: [] }])
        expect(state).toEqual(logic.INITIAL_STATE)

        await trigger({ type: 'onConfirmationChange', value: 'bla' })
        expect(events.log).toEqual([{ event: 'onClose', args: [] }])
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            confirmation: 'bla',
        })

        await trigger({
            type: 'onConfirmationChange',
            value: logic.CONFIRMATION_WORD,
        })
        expect(events.log).toEqual([
            { event: 'onClose', args: [] },
            { event: 'onConfirm', args: [] },
        ])
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            confirmation: logic.CONFIRMATION_WORD,
            confirmed: true,
        })
    })
})
```

A few things to note:

-   We explictly import the Jest expect library even if the tests may be running on Jest where this library is made globally available by default. This allows us to run the tests both on Jest and Mocha.
-   The hart of the logic is the logic.processEvent() function, which is always named like that as a convention, containing the logic to handle events
-   We define the initial state object in the logic file, and use it both in the test and the component.
-   We can simulate an event (like a key-press) being triggered with the `trigger` function. Every event has a `type` attribute on the basis of which we decide what logic needs to be ran.
-   Events that are dispatched as a result of the logic (like onConfirm), end up in the `events.log` and have to be defined beforehand in `eventNames`. When using a component, this'd mean a function passed in a prop would be ran, like `<ConfirmationScreen onConfirm={() => console.log('confirmed!')}`

The logic file, `confirmation-screen.logic.ts` looks like this:

```
import { compositeEventProcessor } from 'src/util/ui-logic'

export const CONFIRMATION_WORD = 'RESTORE'
export const INITIAL_STATE = {
    confirmation: '',
    confirmed: false,
}

export const processEvent = compositeEventProcessor({
    onConfirmationChange: ({ event }) => {
        const confirmed = event.value === CONFIRMATION_WORD
        return {
            updateState: {
                confirmation: event.value,
                confirmed,
            },
            dispatch: confirmed ? { type: 'onConfirm' } : null,
        }
    },
    onClose: () => {
        return { dispatch: { type: 'onClose' } }
    },
})
```

Note:

-   We define the initial state here
-   `compositeEventProcessor()` just is a thin wrapper that calls the right handler for the event, and gives a nice error if there's no handler for an event,
-   Instead of directly modifying the state, we return what needs to be done as a result, and the React handler (or maybe Redux in the future) can actually perform these things.

This is the actual component:

```
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { reactEventHandler } from 'src/util/ui-logic'

import * as logic from './restore-confirmation.logic'

export default class RestoreConfirmation extends React.Component {
    static propTypes = {
        onConfirm: PropTypes.func.isRequired,
        onClose: PropTypes.func.isRequired,
    }

    state = logic.INITIAL_STATE
    handleEvent = null

    componentWillMount() {
        this.handleEvent = reactEventHandler(this, logic.processEvent)
    }

    render() {
        return (
            <div>
                <div>
                    Are you sure? <span onClick={this.handleEvent({type: 'onClose'})}>X</span>
                    <input
                        type="text"
                        value={this.state.confirmation}
                        onChange={event =>
                            this.handleEvent({
                                type: 'onConfirmationChange',
                                value: event.target.value,
                            })
                        }
                    />
                </div>
            </div>
        )
    }
}
```

# Dependencies

Sometimes a component needs to interact with external elements, like analytics. For this we have the dependencies option:

`component.tsx`:

```
import analytics from 'src/analytics'

.....

this.handleEvent = reactEventHandler(this, logic.processEvent, {dependencies: {
    analytics
}})
```

`component.logic.ts`:

```
type Dependencies {
    analytics: any // for brevity sake
}

export const processEvent = compositeEventProcessor<Dependencies>({
    onSomething: async ({ event, dependencies }) => {
        dependencies.analytics.trackEvent(...)
        return {}
    },
})
```

`component.logic.test.ts`:

```
const { state, events, trigger } = setupUiLogicTest({
    inititalState: logic.INITIAL_STATE,
    eventNames: ['onSomething'],
    eventProcessor: logic.processEvent,
    dependencies: {analytics: {trackEvent: () => 'do some recording here'}}
})
```

# Actions

Sometimes instead of dispatching an event to a handler passed in by props, we want to internally do something custom, like redirecting somewhere

`component.tsx`:

```
this.handleEvent = reactEventHandler(this, logic.processEvent, {actions: {
    redirectToLogin: ({source}) => { ... }
}})
```

`component.logic.ts`:

```
export const processEvent = compositeEventProcessor<Dependencies>({
    onSomething: async ({ event, actions }) => {
        return { actions: [{type: 'redirectToLogin', source: 'something'}] }
    },
})
```

`component.logic.test.ts`:

```
const { state, events, trigger } = setupUiLogicTest({
    inititalState: logic.INITIAL_STATE,
    eventNames: ['onSomething'],
    eventProcessor: logic.processEvent,
    actions: {redirectToLogin: ({source}) => 'some recording'}
})
```
