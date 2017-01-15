# Overview

This code provides the user interface for overviewing one's memory, which is
displayed in a tab of its own. It is a html+javascript app, built with
[React](https://facebook.github.io/react/) and [Redux](http://redux.js.org/),
which create a somewhat complex-looking but nicely organised application
structure.


## Redactux?!

In short, the React components (in `components`) define how the HTML DOM is
calculated as a function of the Redux *state* (which is just a large javascript
object), and which Redux *actions* are triggered upon user input. When changing
application behaviour, we therefore only have to modify in which ways these
actions modify the state (through *reducers*), and do not touch any of the
DOM-related stuff, allowing for more abstract thinking. There are great
explanations of Redux and React on their websites, so we will not go deeper
into this here.


## Application structure

It all starts with [`main.jsx`](main.jsx), which creates the store (using
[`store.js`](store.js)), and renders the main component
([`components/Overview.jsx`](components/Overview.jsx)) to the DOM. Then
components will dispatch actions, which trigger reducers (and more actions),
which update the state, which triggers component updates, and so on. Any change
to the database will also trigger actions to update the output directly.

Keeping the code clean, modular and understandable is an ongoing process. Some
inspiration is drawn from Jack Hsu's nice
[essays](https://jaysoo.ca/2016/02/28/organizing-redux-application/) about
structuring Redux applications.

Some Redux middleware is used to deal with complexity and asynchronicity. In
particular:

- [`redux-act`](https://github.com/pauldijou/redux-act) to lessen boilerplate
  code and simplify actions and reducers.
- [`redux-thunk`](https://github.com/gaearon/redux-thunk) enables actions to
  execute a function that can dispatch other actions, possibly
  asynchronously.
- [`redux-observable`](https://redux-observable.js.org) is used to enable
  actions to listen and react to other actions (see [`epics.js`](epics.js))


## Debugging

To ease debugging, the app includes
[`redux-devtools`](https://github.com/gaearon/redux-devtools) (unless it is
built in production mode). Press `Ctrl+Shift+L` in the overview to open the
devtools sidebar, to see the actions and state transitions as they happen.
