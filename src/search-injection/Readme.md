# Search Injection

This code enables injecting Memex™️ search results into other search engine's result page ( such as Google ). Right now, only Google is enabled. 

The structure of the code is as follows:

#### content_script.js

Content Script runs on every page. When the page loads, it tries the match the URL of the page against predefined search engine result's regular expression.
If it matches, Memex search results are fetched for the user's search query and passes the results to `handleRender`

#### dom.js

Helper function for DOM manipulation. 
`handleRender` renders the React component with the needed props.
`injectCSS` injects the css needed for the components into the results page.

#### Components

`container.js` handles all the logic related operations.

`Results.js` component to present all the Results

`RemovedText.js` component to be displayed when the user selects "Remove Results forever"

