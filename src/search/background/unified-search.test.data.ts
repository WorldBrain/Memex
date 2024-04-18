export const PAGE_ID_1 = 'en.wikipedia.org/wiki/Canopy_(biology)'
export const PAGE_ID_2 = 'wikipedia.org/wiki/Genus'
export const PAGE_ID_3 = 'lu.ma/test-1'
export const PAGE_ID_4 = 'x.com/test_acc_1/status/12345678'
export const PAGE_ID_5 = 'twitter.com/test_acc_2/status/12345678'
export const PAGE_ID_6 = 'memex.cloud/ct/test-fingerprint-2.pdf'
export const PAGE_ID_7 = 'vimeo.com/test-1'
export const PAGE_ID_8 = 'eventbrite.com/events/test-1'
export const PAGE_ID_9 = 'en.test-2.com/wiki/Phylum'
export const PAGE_ID_10 = 'test.com/wiki/Organism'
export const PAGE_ID_11 = 'youtube.com/watch?v=test-1'
export const PAGE_ID_12 = 'memex.cloud/ct/test-fingerprint-1.pdf'

export const LIST_ID_1 = 111
export const LIST_ID_2 = 112
export const LIST_ID_3 = 113

export const LISTS = {
    [LIST_ID_1]: {
        id: LIST_ID_1,
        name: 'test a',
        searchableName: 'test a',
        createdAt: new Date('2024-03-20T04:00'),
    },
    [LIST_ID_2]: {
        id: LIST_ID_2,
        name: 'test b',
        searchableName: 'test b',
        createdAt: new Date('2024-03-20T05:00'),
    },
    [LIST_ID_3]: {
        id: LIST_ID_3,
        name: 'test c',
        searchableName: 'test c',
        createdAt: new Date('2024-03-20T05:30'),
    },
}

// These may have a `listIds` prop, which will be used to add them to lists if so
export const PAGES = {
    [PAGE_ID_1]: {
        listIds: [LIST_ID_1, LIST_ID_3],
        url: PAGE_ID_1,
        fullUrl: 'https://' + PAGE_ID_1,
        domain: 'wikipedia.org',
        hostname: 'en.wikipedia.org',
        fullTitle: 'dog breeds',
        text: 'test text about poodles, ridgebacks',
    },
    [PAGE_ID_2]: {
        listIds: [LIST_ID_3],
        url: PAGE_ID_2,
        fullUrl: 'https://' + PAGE_ID_2,
        domain: 'wikipedia.org',
        hostname: 'wikipedia.org',
        fullTitle: 'fruit types',
        text: 'text about apples, oranges, etc.',
    },
    [PAGE_ID_3]: {
        url: PAGE_ID_3,
        fullUrl: 'https://' + PAGE_ID_3,
        domain: 'luma.com',
        hostname: 'luma.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_4]: {
        listIds: [LIST_ID_2],
        url: PAGE_ID_4,
        fullUrl: 'https://' + PAGE_ID_4,
        domain: 'x.com',
        hostname: 'x.com',
        fullTitle: 'title',
        text: 'some nonsense test text',
    },
    [PAGE_ID_5]: {
        url: PAGE_ID_5,
        fullUrl: 'https://' + PAGE_ID_5,
        domain: 'twitter.com',
        hostname: 'twitter.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_6]: {
        url: PAGE_ID_6,
        fullUrl: 'https://' + PAGE_ID_6,
        domain: 'arxiv.org',
        hostname: 'arxiv.org',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_7]: {
        url: PAGE_ID_7,
        fullUrl: 'https://' + PAGE_ID_7,
        domain: 'vimeo.com',
        hostname: 'vimeo.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_8]: {
        url: PAGE_ID_8,
        fullUrl: 'https://' + PAGE_ID_8,
        domain: 'eventbrite.org',
        hostname: 'eventbrite.org',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_9]: {
        url: PAGE_ID_9,
        fullUrl: 'https://' + PAGE_ID_9,
        domain: 'test2.com',
        hostname: 'en.test2.com',
        fullTitle: '',
        text: '',
    },
    [PAGE_ID_10]: {
        url: PAGE_ID_10,
        fullUrl: 'https://' + PAGE_ID_10,
        domain: 'wikipedia.org',
        hostname: 'en.wikipedia.org',
        fullTitle: '',
        text: '',
    },
    [PAGE_ID_11]: {
        url: PAGE_ID_11,
        fullUrl: 'https://' + PAGE_ID_11,
        domain: 'youtube.com',
        hostname: 'youtube.com',
        fullTitle: '',
        text: 'test',
    },
    [PAGE_ID_12]: {
        url: PAGE_ID_12,
        fullUrl: 'https://' + PAGE_ID_12,
        domain: 'cool-pdfs.org',
        hostname: 'en.cool-pdfs.org',
        fullTitle: 'test',
        text: 'text text text',
    },
}

export const BOOKMARKS = {
    [PAGE_ID_11]: [
        {
            url: PAGE_ID_11,
            time: new Date('2024-03-25T06:19').valueOf(),
        },
    ],
    [PAGE_ID_2]: [
        {
            url: PAGE_ID_2,
            time: new Date('2024-03-21T06:00').valueOf(),
        },
    ],
    [PAGE_ID_12]: [
        {
            url: PAGE_ID_12,
            time: new Date('2024-02-25T06:00').valueOf(), // Much older page which has new annotations
        },
    ],
}

export const VISITS = {
    [PAGE_ID_1]: [
        {
            url: PAGE_ID_1,
            time: new Date('2024-03-20T06:00').valueOf(),
        },
    ],
    [PAGE_ID_3]: [
        {
            url: PAGE_ID_3,
            time: new Date('2024-03-21T06:10').valueOf(),
        },
    ],
    [PAGE_ID_4]: [
        {
            url: PAGE_ID_4,
            time: new Date('2024-03-21T06:20').valueOf(),
        },
    ],
    [PAGE_ID_5]: [
        {
            url: PAGE_ID_5,
            time: new Date('2024-03-22T06:00').valueOf(),
        },
    ],
    [PAGE_ID_6]: [
        {
            url: PAGE_ID_6,
            time: new Date('2024-03-22T06:10').valueOf(),
        },
    ],
    [PAGE_ID_7]: [
        {
            url: PAGE_ID_7,
            time: new Date('2024-03-23T06:00').valueOf(),
        },
    ],
    [PAGE_ID_8]: [
        {
            url: PAGE_ID_8,
            time: new Date('2024-03-23T06:10').valueOf(),
        },
        {
            url: PAGE_ID_8,
            time: new Date('2024-03-25T06:15').valueOf(),
        },
    ],
    [PAGE_ID_9]: [
        {
            url: PAGE_ID_9,
            time: new Date('2024-03-23T06:20').valueOf(),
        },
    ],
    [PAGE_ID_10]: [
        {
            url: PAGE_ID_10,
            time: new Date('2024-03-25T06:10').valueOf(),
        },
    ],
    [PAGE_ID_11]: [
        {
            url: PAGE_ID_11,
            time: new Date('2024-03-25T06:20').valueOf(),
        },
    ],
}

// These may have a `listIds` prop, which will be used to add them to lists if so
export const ANNOTATIONS = {
    [PAGE_ID_4]: [
        {
            url: `${PAGE_ID_4}/#1711067684199`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>division</div>',
            comment:
                'comment with completely different text to the parent page - cheese',
            color: 'default',
            selector: {
                quote: '<div>division</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:21'), // UPDATED
            createdWhen: new Date('2024-03-21T06:21'),
        },
        {
            listIds: [LIST_ID_1],
            url: `${PAGE_ID_4}/#1711067799676`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu cheese test</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:22'),
            createdWhen: new Date('2024-03-21T06:22'),
        },
        {
            listIds: [LIST_ID_3],
            url: `${PAGE_ID_4}/#1711067799679`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Good highlight test honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:23'),
            createdWhen: new Date('2024-03-21T06:23'),
        },
        {
            url: `${PAGE_ID_4}/#1711067799680`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:24'),
            createdWhen: new Date('2024-03-22T06:24'),
        },
        {
            url: `${PAGE_ID_4}/#1711067799681`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Honshu</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Honshu</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:25'),
            createdWhen: new Date('2024-03-22T06:25'),
        },
        {
            url: `${PAGE_ID_4}/#1711067812450`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Mindanao</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Mindanao</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:26'),
            createdWhen: new Date('2024-03-22T06:26'),
        },
        {
            url: `${PAGE_ID_4}/#1711067812452`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Mindanao</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Mindanao</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:27'),
            createdWhen: new Date('2024-03-22T06:27'),
        },
        {
            url: `${PAGE_ID_4}/#1711067904471`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>megablock</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>megablock</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:28'),
            createdWhen: new Date('2024-03-22T06:28'),
        },
        {
            url: `${PAGE_ID_4}/#1711067924596`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>test</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>test</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:29'),
            createdWhen: new Date('2024-03-22T06:29'),
        },
        {
            url: `${PAGE_ID_4}/#1711067924597`,
            pageTitle: 'Eurasia - Wikipedia',
            pageUrl: PAGE_ID_4,
            body: '<div>Pakistan</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>Pakistan</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:30'),
            createdWhen: new Date('2024-03-22T06:30'),
        },
    ],
    [PAGE_ID_2]: [
        {
            url: `${PAGE_ID_2}/#1711067346089`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<div><p><b>Genus</b> (<span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/iː/: \'ee\' in \'fleece\'">iː</span><span title="\'n\' in \'nigh\'">n</span><span title="/ə/: \'a\' in \'about\'">ə</span><span title="\'s\' in \'sigh\'">s</span></span>/</a></span></span> <abbr title="plural form">pl.</abbr>: <b>genera</b> <span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/ɛ/: \'e\' in \'dress\'">ɛ</span><span title="\'n\' in \'nigh\'">n</span><span title="/ər/: \'er\' in \'letter\'">ər</span><span title="/ə/: \'a\' in \'about\'">ə</span></span>/</a></span></span>) is a <a href="https://en.wikipedia.org/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> used in the <a href="https://en.wikipedia.org/wiki/Biological_classification" title="Biological classification">biological classification</a> of <a href="https://en.wikipedia.org/wiki/Extant_taxon" title="Extant taxon">living</a> and <a href="https://en.wikipedia.org/wiki/Fossil" title="Fossil">fossil</a> organisms as well as <a href="https://en.wikipedia.org/wiki/Virus_classification#ICTV_classification" title="Virus classification">viruses</a>.<sup><a href="#cite_note-ICTV-1">[1]</a></sup> In the hierarchy of biological classification, genus comes above <a href="https://en.wikipedia.org/wiki/Species" title="Species">species</a> and below <a href="https://en.wikipedia.org/wiki/Family_(taxonomy)" title="Family (taxonomy)">family</a>. In <a href="https://en.wikipedia.org/wiki/Binomial_nomenclature" title="Binomial nomenclature">binomial nomenclature</a>, the genus name forms the first part of the binomial species name for each species within the genus.\n</p>\n</div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p><b>Genus</b> (<span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/iː/: \'ee\' in \'fleece\'">iː</span><span title="\'n\' in \'nigh\'">n</span><span title="/ə/: \'a\' in \'about\'">ə</span><span title="\'s\' in \'sigh\'">s</span></span>/</a></span></span> <abbr title="plural form">pl.</abbr>: <b>genera</b> <span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="/dʒ/: \'j\' in \'jam\'">dʒ</span><span title="/ɛ/: \'e\' in \'dress\'">ɛ</span><span title="\'n\' in \'nigh\'">n</span><span title="/ər/: \'er\' in \'letter\'">ər</span><span title="/ə/: \'a\' in \'about\'">ə</span></span>/</a></span></span>) is a <a href="/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> used in the <a href="/wiki/Biological_classification" title="Biological classification">biological classification</a> of <a href="/wiki/Extant_taxon" title="Extant taxon">living</a> and <a href="/wiki/Fossil" title="Fossil">fossil</a> organisms as well as <a href="/wiki/Virus_classification#ICTV_classification" title="Virus classification">viruses</a>.<sup><a href="#cite_note-ICTV-1">[1]</a></sup> In the hierarchy of biological classification, genus comes above <a href="/wiki/Species" title="Species">species</a> and below <a href="/wiki/Family_(taxonomy)" title="Family (taxonomy)">family</a>. In <a href="/wiki/Binomial_nomenclature" title="Binomial nomenclature">binomial nomenclature</a>, the genus name forms the first part of the binomial species name for each species within the genus.\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-25T06:01'),
            createdWhen: new Date('2024-03-25T06:01'),
        },
        {
            url: `${PAGE_ID_2}/#1711333412292`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<div><p>The term "genus" comes from <a href="https://en.wikipedia.org/wiki/Latin" title="Latin">Latin</a> <i lang="la"><a href="https://en.wiktionary.org/wiki/genus#Latin" title="wikt:genus">genus</a></i>, a noun form <a href="https://en.wikipedia.org/wiki/Cognate" title="Cognate">cognate</a> with <i><span title="Latin-language text"><i lang="la"><a href="https://en.wiktionary.org/wiki/gigno" title="wikt:gigno">gignere</a></i></span></i> (\'to bear; to give birth to\'). The Swedish taxonomist <a href="https://en.wikipedia.org/wiki/Carl_Linnaeus" title="Carl Linnaeus">Carl Linnaeus</a> popularized its use in his 1753 <i><a href="https://en.wikipedia.org/wiki/Species_Plantarum" title="Species Plantarum">Species Plantarum</a></i>, but the French botanist <a href="https://en.wikipedia.org/wiki/Joseph_Pitton_de_Tournefort" title="Joseph Pitton de Tournefort">Joseph Pitton de Tournefort</a> (1656–1708) is considered "the founder of the modern concept of genera".<sup><a href="#cite_note-5">[5]</a></sup>\n</p>\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>The term "genus" comes from <a href="/wiki/Latin" title="Latin">Latin</a> <i lang="la"><a href="https://en.wiktionary.org/wiki/genus#Latin" title="wikt:genus">genus</a></i>, a noun form <a href="/wiki/Cognate" title="Cognate">cognate</a> with <i><span title="Latin-language text"><i lang="la"><a href="https://en.wiktionary.org/wiki/gigno" title="wikt:gigno">gignere</a></i></span></i> (\'to bear; to give birth to\'). The Swedish taxonomist <a href="/wiki/Carl_Linnaeus" title="Carl Linnaeus">Carl Linnaeus</a> popularized its use in his 1753 <i><a href="/wiki/Species_Plantarum" title="Species Plantarum">Species Plantarum</a></i>, but the French botanist <a href="/wiki/Joseph_Pitton_de_Tournefort" title="Joseph Pitton de Tournefort">Joseph Pitton de Tournefort</a> (1656–1708) is considered "the founder of the modern concept of genera".<sup><a href="#cite_note-5">[5]</a></sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:02'),
            lastEdited: new Date('2024-03-25T06:02'),
        },
        {
            url: `${PAGE_ID_2}/#1711333405403`,
            pageTitle: 'Genus - Wikipedia',
            pageUrl: PAGE_ID_2,
            body:
                '<ul><li><a href="https://en.wikipedia.org/wiki/Monophyly" title="Monophyly">monophyly</a> – all descendants of an ancestral <a href="https://en.wikipedia.org/wiki/Taxon" title="Taxon">taxon</a> are grouped together (i.e. <a href="https://en.wikipedia.org/wiki/Phylogenetics" title="Phylogenetics">phylogenetic</a> analysis should clearly demonstrate both monophyly and validity as a separate lineage).</li>\n</ul>',
            comment: '',
            selector: {
                quote:
                    '<ul><li><a href="/wiki/Monophyly" title="Monophyly">monophyly</a> – all descendants of an ancestral <a href="/wiki/Taxon" title="Taxon">taxon</a> are grouped together (i.e. <a href="/wiki/Phylogenetics" title="Phylogenetics">phylogenetic</a> analysis should clearly demonstrate both monophyly and validity as a separate lineage).</li>\n</ul>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:03'),
            lastEdited: new Date('2024-03-25T06:03'),
        },
    ],
    [PAGE_ID_5]: [
        {
            url: `${PAGE_ID_5}/#1711068383658`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body:
                '<div><p><b>Insects</b> (from <a href="https://en.wikipedia.org/wiki/Latin" title="Latin">Latin</a> <i><span title="Latin-language text"><i lang="la">insectum</i></span></i>) are <a href="https://en.wikipedia.org/wiki/Hexapoda" title="Hexapoda">hexapod</a> <a href="https://en.wikipedia.org/wiki/Invertebrate" title="Invertebrate">invertebrates</a> of the <a href="https://en.wikipedia.org/wiki/Class_(biology)" title="Class (biology)">class</a> <b>Insecta</b>. They are the largest group within the <a href="https://en.wikipedia.org/wiki/Arthropod" title="Arthropod">arthropod</a> <a href="https://en.wikipedia.org/wiki/Phylum" title="Phylum">phylum</a>. Insects have a <a href="https://en.wikipedia.org/wiki/Chitin" title="Chitin">chitinous</a> <a href="https://en.wikipedia.org/wiki/Exoskeleton" title="Exoskeleton">exoskeleton</a>, a three-part body (<a href="https://en.wikipedia.org/wiki/Insect_morphology#Head" title="Insect morphology">head</a>, <a href="https://en.wikipedia.org/wiki/Thorax_(insect_anatomy)" title="Thorax (insect anatomy)">thorax</a> and <a href="https://en.wikipedia.org/wiki/Abdomen_(insect_anatomy)" title="Abdomen (insect anatomy)">abdomen</a>), three pairs of jointed <a href="https://en.wikipedia.org/wiki/Arthropod_leg" title="Arthropod leg">legs</a>, <a href="https://en.wikipedia.org/wiki/Compound_eye" title="Compound eye">compound eyes</a>, and a pair of <a href="https://en.wikipedia.org/wiki/Antenna_(biology)" title="Antenna (biology)">antennae</a>. Insects are the most diverse group of animals, with more than a million described <a href="https://en.wikipedia.org/wiki/Species" title="Species">species</a>; they represent more than half of all animal species. \n</p></div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p><b>Insects</b> (from <a href="/wiki/Latin" title="Latin">Latin</a> <i><span title="Latin-language text"><i lang="la">insectum</i></span></i>) are <a href="/wiki/Hexapoda" title="Hexapoda">hexapod</a> <a href="/wiki/Invertebrate" title="Invertebrate">invertebrates</a> of the <a href="/wiki/Class_(biology)" title="Class (biology)">class</a> <b>Insecta</b>. They are the largest group within the <a href="/wiki/Arthropod" title="Arthropod">arthropod</a> <a href="/wiki/Phylum" title="Phylum">phylum</a>. Insects have a <a href="/wiki/Chitin" title="Chitin">chitinous</a> <a href="/wiki/Exoskeleton" title="Exoskeleton">exoskeleton</a>, a three-part body (<a href="/wiki/Insect_morphology#Head" title="Insect morphology">head</a>, <a href="/wiki/Thorax_(insect_anatomy)" title="Thorax (insect anatomy)">thorax</a> and <a href="/wiki/Abdomen_(insect_anatomy)" title="Abdomen (insect anatomy)">abdomen</a>), three pairs of jointed <a href="/wiki/Arthropod_leg" title="Arthropod leg">legs</a>, <a href="/wiki/Compound_eye" title="Compound eye">compound eyes</a>, and a pair of <a href="/wiki/Antenna_(biology)" title="Antenna (biology)">antennae</a>. Insects are the most diverse group of animals, with more than a million described <a href="/wiki/Species" title="Species">species</a>; they represent more than half of all animal species. \n</p></div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-25T05:01'), // UPDATED
            createdWhen: new Date('2024-03-22T06:01'),
        },
        {
            url: `${PAGE_ID_5}/#1711068409798`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body: '<div>and</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>and</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:02'),
            createdWhen: new Date('2024-03-22T06:02'),
        },
        {
            url: `${PAGE_ID_5}/#1711068426352`,

            pageTitle: 'Insect - Wikipedia',
            pageUrl: PAGE_ID_5,
            body: '<div>about</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>about</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-22T06:03'),
            createdWhen: new Date('2024-03-22T06:03'),
        },
    ],
    [PAGE_ID_3]: [
        {
            url: `${PAGE_ID_3}/#1711067362844`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>directly</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>directly</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:11'),
            createdWhen: new Date('2024-03-21T06:11'),
        },
        {
            url: `${PAGE_ID_3}/#1711067368552`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>encyclopedia</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>encyclopedia</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:12'),
            createdWhen: new Date('2024-03-21T06:12'),
        },
        {
            url: `${PAGE_ID_3}/#1711067387492`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>unusual</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>unusual</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:13'),
            createdWhen: new Date('2024-03-21T06:13'),
        },
        {
            url: `${PAGE_ID_3}/#1711067399717`,
            pageTitle: 'Jaguar - Wikipedia',
            pageUrl: PAGE_ID_3,
            body: '<div>terrains</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>terrains</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-21T06:14'),
            createdWhen: new Date('2024-03-21T06:14'),
        },
    ],
    [PAGE_ID_10]: [
        {
            pageTitle: 'Organism - test.com',
            pageUrl: PAGE_ID_10,
            body: '<div><p>The term "organism"</p></div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>The term "organism" (from <a href="/wiki/Greek_language" title="Greek language">Greek</a> ὀργανισμός, <i>organismos</i>, from ὄργανον, <i>organon</i>, i.e. "instrument, implement, tool, organ of sense or apprehension")<sup><a href="#cite_note-LSJ-6">[6]</a></sup><sup><a href="#cite_note-OnlineEtDict-7">[7]</a></sup> first appeared in the English language in 1703 and took on its current definition by 1834 (<i><a href="/wiki/Oxford_English_Dictionary" title="Oxford English Dictionary">Oxford English Dictionary</a></i>). It is directly related to the term "organization". There is a long tradition of defining organisms as self-organizing beings, going back at least to <a href="/wiki/Immanuel_Kant" title="Immanuel Kant">Immanuel Kant</a>\'s 1790 <i><a href="/wiki/Critique_of_Judgment" title="Critique of Judgment">Critique of Judgment</a></i>.<sup><a href="#cite_note-8">[8]</a></sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-25T06:11'),
            lastEdited: new Date('2024-03-25T06:11'),
            url: `${PAGE_ID_10}/#1711333408332`,
        },
    ],
    [PAGE_ID_9]: [
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>In <a href="https://en.wikipedia.org/wiki/Biology" title="Biology">biology</a>, a <b>phylum</b> (<span><span lang="en-fonipa"><a href="https://en.wikipedia.org/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="\'f\' in \'find\'">f</span><span title="/aɪ/: \'i\' in \'tide\'">aɪ</span><span title="\'l\' in \'lie\'">l</span><span title="/əm/: \'m\' in \'rhythm\'">əm</span></span>/</a></span></span>; <abbr title="plural form">pl.</abbr>: <b>phyla</b>) is a level of classification or <a href="https://en.wikipedia.org/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> below <a href="https://en.wikipedia.org/wiki/Kingdom_(biology)" title="Kingdom (biology)">kingdom</a> and above <a href="https://en.wikipedia.org/wiki/Class_(biology)" title="Class (biology)">class</a>. Traditionally, in <a href="https://en.wikipedia.org/wiki/Botany" title="Botany">botany</a> the term <a href="https://en.wikipedia.org/wiki/Division_(biology)" title="Division (biology)">division</a> has been used instead of phylum, although the <a href="https://en.wikipedia.org/wiki/International_Code_of_Nomenclature_for_algae,_fungi,_and_plants" title="International Code of Nomenclature for algae, fungi, and plants">International Code of Nomenclature for algae, fungi, and plants</a> accepts the terms as equivalent.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-2">[2]</a></sup><sup><a href="#cite_note-Berg2007-3">[3]</a></sup> Depending on definitions, the animal kingdom <a href="https://en.wikipedia.org/wiki/Animalia" title="Animalia">Animalia</a> contains about 31 phyla, the plant kingdom <a href="https://en.wikipedia.org/wiki/Plantae" title="Plantae">Plantae</a> contains about 14 phyla, and the fungus kingdom <a href="https://en.wikipedia.org/wiki/Fungi" title="Fungi">Fungi</a> contains about 8 phyla. Current research in <a href="https://en.wikipedia.org/wiki/Phylogenetics" title="Phylogenetics">phylogenetics</a> is uncovering the relationships among phyla within larger <a href="https://en.wikipedia.org/wiki/Clades" title="Clades">clades</a> like <a href="https://en.wikipedia.org/wiki/Ecdysozoa" title="Ecdysozoa">Ecdysozoa</a> and <a href="https://en.wikipedia.org/wiki/Embryophyta" title="Embryophyta">Embryophyta</a>.\n</p>\n\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>In <a href="/wiki/Biology" title="Biology">biology</a>, a <b>phylum</b> (<span><span lang="en-fonipa"><a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span><span title="/ˈ/: primary stress follows">ˈ</span><span title="\'f\' in \'find\'">f</span><span title="/aɪ/: \'i\' in \'tide\'">aɪ</span><span title="\'l\' in \'lie\'">l</span><span title="/əm/: \'m\' in \'rhythm\'">əm</span></span>/</a></span></span>; <abbr title="plural form">pl.</abbr>: <b>phyla</b>) is a level of classification or <a href="/wiki/Taxonomic_rank" title="Taxonomic rank">taxonomic rank</a> below <a href="/wiki/Kingdom_(biology)" title="Kingdom (biology)">kingdom</a> and above <a href="/wiki/Class_(biology)" title="Class (biology)">class</a>. Traditionally, in <a href="/wiki/Botany" title="Botany">botany</a> the term <a href="/wiki/Division_(biology)" title="Division (biology)">division</a> has been used instead of phylum, although the <a href="/wiki/International_Code_of_Nomenclature_for_algae,_fungi,_and_plants" title="International Code of Nomenclature for algae, fungi, and plants">International Code of Nomenclature for algae, fungi, and plants</a> accepts the terms as equivalent.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-2">[2]</a></sup><sup><a href="#cite_note-Berg2007-3">[3]</a></sup> Depending on definitions, the animal kingdom <a href="/wiki/Animalia" title="Animalia">Animalia</a> contains about 31 phyla, the plant kingdom <a href="/wiki/Plantae" title="Plantae">Plantae</a> contains about 14 phyla, and the fungus kingdom <a href="/wiki/Fungi" title="Fungi">Fungi</a> contains about 8 phyla. Current research in <a href="/wiki/Phylogenetics" title="Phylogenetics">phylogenetics</a> is uncovering the relationships among phyla within larger <a href="/wiki/Clades" title="Clades">clades</a> like <a href="/wiki/Ecdysozoa" title="Ecdysozoa">Ecdysozoa</a> and <a href="/wiki/Embryophyta" title="Embryophyta">Embryophyta</a>.\n</p>\n\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:21'),
            lastEdited: new Date('2024-03-23T06:21'),
            url: `${PAGE_ID_9}/#1711333382313`,
        },
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>The term phylum was coined in 1866 by <a href="https://en.wikipedia.org/wiki/Ernst_Haeckel" title="Ernst Haeckel">Ernst Haeckel</a> from the Greek <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phylon</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%E1%BF%A6%CE%BB%CE%BF%CE%BD#Ancient_Greek" title="wikt:φῦλον">φῦλον</a></span>, "race, stock"), related to <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phyle</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%CF%85%CE%BB%CE%AE#Ancient_Greek" title="wikt:φυλή">φυλή</a></span>, "tribe, clan").<sup><a href="#cite_note-FOOTNOTEValentine20048-4">[4]</a></sup><sup><a href="#cite_note-5">[5]</a></sup> Haeckel noted that species constantly evolved into new species that seemed to retain few consistent features among themselves and therefore few features that distinguished them as a group ("a self-contained unity"): "perhaps such a real and completely self-contained unity is the aggregate of all species which have gradually evolved from one and the same common original form, as, for example, all vertebrates. We name this aggregate [a] <span title="German-language text"><i lang="de">Stamm</i></span> [i.e., stock] (<span title="German-language text"><i lang="de">Phylon</i></span>)."<sup><a href="#cite_note-6">[a]</a></sup> In <a href="https://en.wikipedia.org/wiki/Plant_taxonomy" title="Plant taxonomy">plant taxonomy</a>, <a href="https://en.wikipedia.org/wiki/August_W._Eichler" title="August W. Eichler">August W. Eichler</a> (1883) classified plants into <a href="https://en.wikipedia.org/wiki/Eichler_system" title="Eichler system">five groups</a> named divisions, a term that remains in use today for groups of plants, algae and fungi.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-7">[6]</a></sup>\nThe definitions of zoological phyla have changed from their origins in the six <a href="https://en.wikipedia.org/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnaean</a> classes and the four <span title="French-language text"><i lang="fr">embranchements</i></span> of <a href="https://en.wikipedia.org/wiki/Georges_Cuvier" title="Georges Cuvier">Georges Cuvier</a>.<sup><a href="#cite_note-8">[7]</a></sup>\n</p></div>',
            comment: 'test',
            selector: {
                quote:
                    '<div><p>The term phylum was coined in 1866 by <a href="/wiki/Ernst_Haeckel" title="Ernst Haeckel">Ernst Haeckel</a> from the Greek <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phylon</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%E1%BF%A6%CE%BB%CE%BF%CE%BD#Ancient_Greek" title="wikt:φῦλον">φῦλον</a></span>, "race, stock"), related to <span title="Ancient Greek (to 1453)-language romanization"><i lang="grc-Latn">phyle</i></span> (<span lang="grc"><a href="https://en.wiktionary.org/wiki/%CF%86%CF%85%CE%BB%CE%AE#Ancient_Greek" title="wikt:φυλή">φυλή</a></span>, "tribe, clan").<sup><a href="#cite_note-FOOTNOTEValentine20048-4">[4]</a></sup><sup><a href="#cite_note-5">[5]</a></sup> Haeckel noted that species constantly evolved into new species that seemed to retain few consistent features among themselves and therefore few features that distinguished them as a group ("a self-contained unity"): "perhaps such a real and completely self-contained unity is the aggregate of all species which have gradually evolved from one and the same common original form, as, for example, all vertebrates. We name this aggregate [a] <span title="German-language text"><i lang="de">Stamm</i></span> [i.e., stock] (<span title="German-language text"><i lang="de">Phylon</i></span>)."<sup><a href="#cite_note-6">[a]</a></sup> In <a href="/wiki/Plant_taxonomy" title="Plant taxonomy">plant taxonomy</a>, <a href="/wiki/August_W._Eichler" title="August W. Eichler">August W. Eichler</a> (1883) classified plants into <a href="/wiki/Eichler_system" title="Eichler system">five groups</a> named divisions, a term that remains in use today for groups of plants, algae and fungi.<sup><a href="#cite_note-ICN-1">[1]</a></sup><sup><a href="#cite_note-7">[6]</a></sup>\nThe definitions of zoological phyla have changed from their origins in the six <a href="/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnaean</a> classes and the four <span title="French-language text"><i lang="fr">embranchements</i></span> of <a href="/wiki/Georges_Cuvier" title="Georges Cuvier">Georges Cuvier</a>.<sup><a href="#cite_note-8">[7]</a></sup>\n</p></div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:22'),
            lastEdited: new Date('2024-03-23T06:22'),
            url: `${PAGE_ID_9}/#1711333384046`,
        },
        {
            pageTitle: 'Phylum - test2.com',
            pageUrl: PAGE_ID_9,
            body:
                '<div><p>Informally, phyla can be thought of as groupings of organisms based on general specialization of <a href="https://en.wikipedia.org/wiki/Body_plan" title="Body plan">body plan</a>.<sup><a href="#cite_note-9">[8]</a></sup> At its most basic, a phylum can be defined in two ways: as a group of organisms with a certain degree of morphological or developmental similarity (the <a href="https://en.wikipedia.org/wiki/Phenetic" title="Phenetic">phenetic</a> definition), or a group of organisms with a certain degree of evolutionary relatedness (the <a href="https://en.wikipedia.org/wiki/Phylogenetic" title="Phylogenetic">phylogenetic</a> definition).<sup><a href="#cite_note-Budd2000-10">[9]</a></sup> Attempting to define a level of the <a href="https://en.wikipedia.org/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnean hierarchy</a> without referring to (evolutionary) relatedness is unsatisfactory, but a phenetic definition is useful when addressing questions of a morphological nature—such as how successful different body plans were.<sup>[<i><a href="https://en.wikipedia.org/wiki/Wikipedia:Citation_needed" title="Wikipedia:Citation needed"><span title="This claim needs references to reliable sources. (May 2017)">citation needed</span></a></i>]</sup>\n</p>\n</div>',
            comment: '',
            selector: {
                quote:
                    '<div><p>Informally, phyla can be thought of as groupings of organisms based on general specialization of <a href="/wiki/Body_plan" title="Body plan">body plan</a>.<sup><a href="#cite_note-9">[8]</a></sup> At its most basic, a phylum can be defined in two ways: as a group of organisms with a certain degree of morphological or developmental similarity (the <a href="/wiki/Phenetic" title="Phenetic">phenetic</a> definition), or a group of organisms with a certain degree of evolutionary relatedness (the <a href="/wiki/Phylogenetic" title="Phylogenetic">phylogenetic</a> definition).<sup><a href="#cite_note-Budd2000-10">[9]</a></sup> Attempting to define a level of the <a href="/wiki/Linnaean_taxonomy" title="Linnaean taxonomy">Linnean hierarchy</a> without referring to (evolutionary) relatedness is unsatisfactory, but a phenetic definition is useful when addressing questions of a morphological nature—such as how successful different body plans were.<sup>[<i><a href="/wiki/Wikipedia:Citation_needed" title="Wikipedia:Citation needed"><span title="This claim needs references to reliable sources. (May 2017)">citation needed</span></a></i>]</sup>\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            color: 'default',
            createdWhen: new Date('2024-03-23T06:23'),
            lastEdited: new Date('2024-03-23T06:23'),
            url: `${PAGE_ID_9}/#1711333385412`,
        },
    ],
    [PAGE_ID_7]: [
        {
            url: `${PAGE_ID_7}/#1711074495092`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body: '<div>anatomy</div>',
            comment: 'test',
            color: 'default',
            selector: {
                quote: '<div>anatomy</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:01'),
            createdWhen: new Date('2024-03-23T06:01'),
        },
        {
            url: `${PAGE_ID_7}/#1711074524064`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body:
                '<div><p>In general, any animal that reacts to sounds or communicates by means of sound, needs to have an auditory mechanism. This typically consists of a membrane capable of vibration known as the tympanum, an air-filled chamber and sensory organs to detect the auditory stimuli.\n</p>\n</div>',
            comment: '',
            color: 'default',
            selector: {
                quote:
                    '<div><p>In general, any animal that reacts to sounds or communicates by means of sound, needs to have an auditory mechanism. This typically consists of a membrane capable of vibration known as the tympanum, an air-filled chamber and sensory organs to detect the auditory stimuli.\n</p>\n</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:02'),
            createdWhen: new Date('2024-03-23T06:02'),
        },
        {
            url: `${PAGE_ID_7}/#1711074612109`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            body: '<div>and</div>',
            comment: '',
            color: 'default',
            selector: {
                quote: '<div>and</div>',
                descriptor: {
                    strategy: 'hyp-anchoring',
                    content: [],
                },
            },
            lastEdited: new Date('2024-03-23T06:03'),
            createdWhen: new Date('2024-03-23T06:03'),
        },
        {
            url: `${PAGE_ID_7}/#1711179221253`,
            pageTitle: 'Tympanum (anatomy) - Wikipedia',
            pageUrl: PAGE_ID_7,
            comment: '<div><p>test today</p></div>',
            createdWhen: new Date('2024-03-23T06:04'),
            lastEdited: new Date('2024-03-23T06:04'),
        },
    ],
    [PAGE_ID_12]: [
        {
            url: `${PAGE_ID_12}/#1711179221253`,
            pageTitle: 'Europe - Wikipedia',
            pageUrl: PAGE_ID_12,
            comment: '<div><p>test</p></div>',
            createdWhen: new Date('2024-03-23T07:04'),
            lastEdited: new Date('2024-03-23T07:04'),
        },
    ],
}
