/**
 * @typedef {Object} Tooltip
 * @property {string} title
 * @property {string} description
 */

/**
 * @type {Tooltip[]}
 */
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
        title: 'Express time filters in human language',
        description:
            'Try typing "<b><i>2 weeks ago</i></b>" into the date picker field.',
    },
    {
        title: 'Sometimes a simple restart helps',
        description:
            'As the old question goes: "Have you tried to unplug the machine?", it also helps to restart Memex if you feel like things are not doing as they should.<br/>Just untick and tick the box next to Memex in the extensions menu.',
    },
    {
        title: 'Tag Pages',
        description:
            "Quickly tag and group any page via the <img style='height:18px; vertical-align:bottom' src='/img/worldbrain-logo-narrow-bw-16.png'/>-icon in the menu bar or via the results list." /* or with the <a id='shortcuts' href='chrome://extensions/configureCommands'>shortcuts</a> you defined. */,
    },

    {
        title: "Better than the browser's built-in search",
        description:
            'Even just for searching title & URLs, Memex will give better results than your browser.<br/> Try combining it with time, domain or bookmark filter to unleash its full potential.',
    },
    {
        title: 'New Use Case: ',
        description:
            '<span style="font-size:15px;margin-bottom:15px">To Find:</span><br/>"<i>That <i><b>medium.com</i></b> post I read <i><b>yesterday</i></b>.</i>"<br/><br/><span style="font-size:15px;margin-bottom:15px">Search with:</span><br/><code>medium.com after:"yesterday"<code/>',
    },
    {
        title: 'New Use Case: ',
        description:
            '<span style="font-size:15px;margin-bottom:15px">To Find:</span><br/>"<i>The <i><b>tab I closed</i></b> roughly <i><b>10 minutes ago</i></b> about <i><b>cats with hats</i></b>.</i>"<br/><br/><span style="font-size:15px;margin-bottom:15px">Search with:</span><br/><code>cats hats after:"10 minutes ago"<code/>',
    },
    {
        title: 'New Use Case: ',
        description:
            '<span style="font-size:15px;margin-bottom:15px">To Find:</span><br/>"<i><i><b>All</i></b> the influencers on <i><b>twitter.com</i></b> I saved to <i><b>#contactforlater</i></b>.</i>"<br/><br/><span style="font-size:15px;margin-bottom:15px">Search with:</span><br/><code>twitter.com #contactforlater<code/>',
    },
    {
        title: 'Pages are indexed after 10 seconds',
        description:
            'Websites you visit are indexed with a 10 second delay.<br/>Titles and URLs are always searchable.',
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
            'By default, Memex makes the pages available you visit after installation. But you can also <a href="#/import">import all your bookmarks, and the browsing history</a> of the last 90 days.',
    },
]

/**
 * @return {Tooltip} Object that is the new Tooltips.
 */
export async function fetchTooltip() {
    let index = 0
    const indexTooltip = (await browser.storage.local.get('tooltip_index'))
        .tooltip_index

    if (indexTooltip !== undefined) {
        index = indexTooltip
    }

    await browser.storage.local.set({ tooltip_index: index + 1 })

    return tooltips[index++ % tooltips.length]
}
