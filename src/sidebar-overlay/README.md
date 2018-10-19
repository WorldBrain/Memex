# Sidebar Overlay

Contains components and redux related to sidebar common to both sidebar overlay and iFrame.

-   `/components` Contains Ribbon and Sidebar components.
-   `/redux` Contains Redux _actions_, _reducers_, _selectors_, and _store_.
-   `container.js` HOC to pass down Redux state and pass received from Overview.
-   `content_script.js` Setups up all listeneres and inserts Ribbon ( if Memex.Link is enabled )
-   `interactions.js` Exports all interaction functions with DoM
-   `messaging.ts` Exports `FrameCommunication` class for communication between the iFrame and the parent website. Used in sidebar overlay.
-   `sidebar.js` ReactDOM renders Sidebar Component to DOM.

Most of the remote calling ( `toggleSidebar`, `highlightAnnotations` ) happens through either `webextensionsRPC` or `FrameCommunication`.

### Overview/sidebar

Submodule inside Overview which contains renders Sidebar on Overview with some extra props.
