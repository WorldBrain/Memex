import { ExportedPage } from './'

export const TEST_VISIT_1 = Date.now()
export const TEST_BOOKMARK_1 = Date.now() + 5000

// Single yellow pixel made using http://png-pixel.com/
export const TEST_SCREENSHOT =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg=='
export const TEST_FAVICON =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg=='

export const PAGE_DOC_1 = {
    content: {
        fullText:
            " As a result, the affected machine becomes slow and practically unusable. However, bitcoin mining is not the primary goal of the malware. The most popular versions of Skype malware have been designed to steal users' personal information, sensitive computer data or to distribute malicious content by sending messages telling “Hey, check this video” or “this is a very nice photo of you” that are followed by a malicious link. For instance, the Koobface virus , which has been spreading messages featuring links to “shocking” or “hilarious” videos with the user's name (or username) attached.",
        lang: 'en',
        canonicalUrl: 'https://www.2-spyware.com/remove-skype-virus.html',
        title: 'Remove Skype virus (Removal Guide) - Jan 2018 update',
        keywords: [
            'Skype virus',
            'Remove Skype virus (Removal Guide) - Jan 2018 update',
        ],
        description:
            'Skype viruses and scams continue threatening the users. Skype virus is a group of malicious programs and phishing scams that target popular telecommunication application’s users',
    },
    url: 'https://www.2-spyware.com/remove-skype-virus.html',
    normalizedUrl: '2-spyware.com/remove-skype-virus.html',
    _id: 'page/Mi1zcHl3YXJlLmNvbS9yZW1vdmUtc2t5cGUtdmlydXMuaHRtbA%3D%3D',
}

export const EXPORTED_PAGE_1: Partial<ExportedPage> = {
    // Import indexed (searchable) data
    url: '2-spyware.com/remove-skype-virus.html',
    domain: '2-spyware.com',
    hostname: '2-spyware.com',
    terms: [
        'result',
        'affected',
        'machine',
        'slow',
        'practically',
        'unusable',
        'bitcoin',
        'mining',
        'primary',
        'goal',
        'malware',
        'popular',
        'versions',
        'skype',
        'designed',
        'steal',
        'users',
        'personal',
        'information',
        'sensitive',
        'computer',
        'data',
        'distribute',
        'malicious',
        'content',
        'sending',
        'messages',
        'telling',
        'hey',
        'check',
        'video',
        'nice',
        'photo',
        'link',
        'instance',
        'koobface',
        'virus',
        'spreading',
        'featuring',
        'links',
        'shocking',
        'hilarious',
        'videos',
        'username',
        'attached',
    ],
    urlTerms: ['remove-skype-virus', 'html', 'remove', 'skype', 'virus'],
    titleTerms: [
        'remove',
        'skype',
        'virus',
        'removal',
        'guide',
        'jan',
        '2018',
        'update',
    ],

    // Display data used for UI
    text: PAGE_DOC_1.content.fullText,
    fullUrl: PAGE_DOC_1.url,
    fullTitle: PAGE_DOC_1.content.title,
    screenshotURI: TEST_SCREENSHOT,

    // Misc data not really used for anything; prev in Pouch
    keywords: PAGE_DOC_1.content.keywords,
    description: PAGE_DOC_1.content.description,
    canonicalUrl: PAGE_DOC_1.content.canonicalUrl,
    lang: PAGE_DOC_1.content.lang,

    // Data used for other, non-page, data colletions
    bookmark: TEST_BOOKMARK_1,
    favIconURI: TEST_FAVICON,
    visits: [{ timestamp: TEST_VISIT_1 }],
    tags: ['virus', 'fix'],
}
