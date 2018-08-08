# Left sidebar containing filters and collections

This code is for the interface of the left sidebar in the overview. This sidebar has two modes: collection mode and filter mode. The collection mode mounts `src/custom-lists` components and filter mode mounts the `src/search-filters` components. The main container is in the `src/overview/sidebar-left/container` module.

## Directory structure

```
src/custom-lists
│  Readme.md
│  index.js
|  actions.js
|  reducer.js
|  selectors.js
│
└──components
   │   index.js
   │
   └───overview/sidebar
       │ ButtonContainer.jsx
       │ ButtonContainer.css
       │ Sidebar.css
       │ Sidebar.jsx
       │ Tooltip.jsx
       │ Tooltip.css
       │ ClearFilter.jsx
       │ ClearFilter.css
       │ SidebarIcons.jsx
       │ ReactBurgerMenu.js
       └─SidebarIcons.css
```

-   `components`: contains all the components that re-renders in the overview sidebar, with the filters.
    -   `ButtonContainer.jsx`: Contains the buttons for changing the mode of the sidebar.
    -   `SidebarIcons.jsx`: Contains the main icons displayed in the overview for opening the sidebar.
    -   `Sidebar.jsx`: The wrapper around `react-burger-menu` customised for our use case.
    -   `ReactBurgerMenu.js`: The custom CSS for the main `react-burger-menu` component.
    -   `Tooltip.jsx`: An information tooltip for various sidebar icons.
