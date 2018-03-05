export const VISIT_3 = Date.now()
export const VISIT_2 = VISIT_3 - 1000 * 60
export const VISIT_1 = VISIT_2 - 1000 * 60
export const BOOKMARK_1 = VISIT_3 - 1000 * 60 * 86400 // Bookmark from a day ago
export const PAGE_1 = {
    url: 'https://www.lorem.com/test2',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        title: 'test page 3',
    },
}
export const PAGE_2 = {
    url: 'https://www.lorem.com/test1',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'test page 2',
    },
}
export const PAGE_3 = {
    url: 'https://www.test.com/test',
    content: {
        fullText: 'the wild fox jumped over the hairy red hen',
        title: 'test page',
    },
}
export const PAGE_4 = { ...PAGE_3, url: 'https://test.com/tmp' }

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
    _id: 'page/2-spyware.com%2Fremove-skype-virus.html',
}
