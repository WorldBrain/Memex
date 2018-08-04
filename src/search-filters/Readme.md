# Search Filters

This directory contains all the visual interface and redux state for the search filters.

## Directory structure

```
src/search-filters
│  Readme.md
│  index.js
|  actions.js
|  reducer.js
|  selectors.js
|  container.js
│
└──components
   │   index.js
   │   BookmarkFilter.css
   │   BookmarkFilter.js
   │   FilterBar.jsx
   │   FilterBar.css
   │   FilteredRow.css
   │   FilteredRow.jsx
   │   IndexDropdownSB.jsx
   │   IndexDropdownSB.css
   │   SearchFilters.css
   └───SearchFilters.js
```

-   `components`: contains all the components that renders in the overview sidebar, with the custom lists(collections.
-   `container.js`: The main container for search filters components.
