# Custom Lists(Collections)

This code provides the interface for collections. The main container i.e `Index.jsx` gets mounted in the sidebar on the left in the overview. This direcory holds all the storage and state management for the custom-lists feature.

## Directory structure

```
src/custom-lists
│   Readme.md
│   index.js
|   actions.js
|   reducer.js
|   selectors.js
│
└───components
│   │   index.js
│   │
│   │
│   └───overview/sidebar
│       │ CreateListForm.jsx
│       │ CreateListForm.css
│       │ Index.css
│       │ Index.js
│       │ ListItem.js
│       └─ListItem.css
│
│
└───background
    │   index.js
    │   storage.ts
    │   storage.test.ts
    │   types.ts
    └───storage.test.data.ts
```

-   `components`: contains all the components that re renders in the overview sidebar, with the filters.
    -   `overview/sidebar/Index.jsx`: The main container that contains all the other components.
-   `background`: contains all the backgroud stuff(storage calls) related to this feature.
    -   `storage.ts`: Contains calls to the storage manager for CRUD operations.
    -   `index.js`: Abstract away the storage manager calls from the user interface.
-   All the redux state management is in `actions.js`, `reducer.js` and `selectors.js`.
