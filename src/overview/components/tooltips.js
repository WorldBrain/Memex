const tooltips = [
    {
        title: 'Search Everywhere',
        description:
            "Use your browser's address bar to search from anywhere you are. <br/><br/>Just type:<br/><img src='/img/shortcuts.png'><img/>",
    },
    {
        title: 'Only exact matches possible',
        description:
            "Only exact word-matches yield results. Fuzzy matching or synonym-search are not a feature yet.<br/><a target='_new' href='https://worldbrain.helprace.com/i23-known-limitations-of-searching'>See full list</a> of current limitations.",
    },
    {
        title: 'Express time filters in natural language',
        description:
            'Try typing "<i>2 weeks ago<i/>" into the date picker field',
    },
    {
        title: 'New Use Case: ',
        description:
            '"That <i><b>medium.com</i></b> post I read <i><b>yesterday</i></b>."<br/><br/><span style="font-size:15px;margin-bottom:15px">Search with:</span><br/><code>medium.com after:"yesterday"<code/>',
    },
    {
        title: 'Pages are indexed after 10 seconds',
        description: 'Websites you visit are indexed with a 10 second delay.',
    },
    {
        title: 'Block pages from being indexed',
        description:
            'You can blacklist domains, urls and use regular expressions (a bit geeky) to block websites from being stored when you visit them. </br></br> <a target="_new" href="/options/options.html#/blacklist"><button class="_src_overview_components_Tooltip__buttontooltipempty">Go to Blacklist Settings</button></a> ',
    },
    {
        title: 'Pause indexing for a certain amount of time',
        description:
            "Need to go on a little incognito web 'expedition' and don't want to leave traces?<br/>Pause your recording as long as you want via the <img style='height:18px; vertical-align:bottom' src='/img/worldbrain-logo-narrow-bw-16.png'/>-icon in the menu bar.",
    },
    {
        title: 'Import Existing Bookmarks & History',
        description:
            'By default, Memex makes the pages available you visit after installation. But you can also <a target="_new" href="/options/options.html#/import">import all your bookmarks, and the browsing history</a> of the last 90 days.',
    },
]

export default tooltips
export const tooltipsSize = tooltips.length
