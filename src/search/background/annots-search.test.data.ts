import { Annotation } from 'src/annotations/types'

interface TestAnnot extends Omit<Annotation, 'tags'> {
    tags?: string[]
    lists?: string[]
    hasBookmark?: boolean
    title: string
}

export const TAG1 = 'testA'
export const TAG2 = 'testB'
export const TAG3 = 'testC'

export const LIST1 = 'testA'
export const LIST2 = 'testB'

export const ANNOTS: TestAnnot[] = [
    {
        createdWhen: new Date('2018-09-01T01:10'),
        body:
            'The English term "Victors\' justice" was first used by Richard Minear in his 1971 account of the International Military Tribunal for the Far East',
        pageTitle: "Victor's Justice",
        title: "Victor's Justice",
        url: 'http://www.test.com/page0',
        pageUrl: 'test.com/page0',
        hasBookmark: true,
        lists: [LIST1],
    },
    {
        createdWhen: new Date('2018-09-02T02:23'),
        body:
            'In moral philosophy, the term "legitimacy" is often positively interpreted as the normative status conferred by a governed people upon their governors\' institutions',
        pageTitle: 'Legitimacy',
        title: 'Legitimacy',
        url: 'http://www.test.com/page1',
        pageUrl: 'test.com/page1',
        hasBookmark: true,
        tags: [TAG1],
    },
    {
        createdWhen: new Date('2018-09-02T05:12'),
        body:
            'It implies that only God can judge an unjust king and that any attempt to depose, dethrone or restrict his powers runs contrary to the will of God and may constitute a sacrilegious act',
        pageTitle: 'Divine right of kings',
        title: 'Divine right of kings',
        url: 'http://www.test.com/page2#2',
        pageUrl: 'test.com/page2',
        lists: [LIST1],
    },
    {
        createdWhen: new Date('2018-09-01T10:12'),
        body:
            'kings were often seen as either ruling with the backing of heavenly powers or perhaps even being divine beings themselves',
        pageTitle: 'Divine right of kings',
        title: 'Divine right of kings',
        url: 'http://www.test.com/page2#3',
        pageUrl: 'test.com/page2',
        tags: [TAG1, TAG2],
    },
    {
        createdWhen: new Date('2018-09-04T:12:56'),
        body:
            "James's reference to \"God's lieutenants\" is apparently a reference to the text in Romans 13 where Paul refers to God's ministers.",
        pageTitle: 'Divine right of kings',
        title: 'Divine right of kings',
        url: 'http://www.test.com/page2#4',
        pageUrl: 'test.com/page2',
        hasBookmark: true,
    },
    {
        createdWhen: new Date('2018-09-04T13:13'),
        body:
            "Finally, when the Zhou dynasty's power decreased, it was wiped out by the State of Qin, which believed that the Zhou had become weak and their rule unjust",
        pageTitle: 'Mandate of Heaven',
        title: 'Mandate of Heaven',
        url: 'http://www.test.com/page5#asdf',
        pageUrl: 'test.com/page5',
        tags: [TAG1, TAG2],
        lists: [LIST1, LIST2],
    },
    {
        createdWhen: new Date('2018-09-04T14:07'),
        body:
            'it is considered that Chinese historical accounts of the fall of a dynasty and the rise of a new one must be handled with caution',
        pageTitle: 'Mandate of Heaven',
        title: 'Mandate of Heaven',
        url: 'http://www.test.com/page5',
        pageUrl: 'test.com/page5',
        lists: [LIST1, LIST2],
    },
    {
        createdWhen: new Date('2018-09-03T07:40'),
        body:
            ' a shopping mall is said to have a sphere of influence which designates the geographical area where it dominates the retail trade',
        pageTitle: 'Sphere of influence',
        title: 'Sphere of influence',
        url: 'http://www.test.com/page3#1',
        pageUrl: 'test.com/page3',
        tags: [TAG1, TAG2, TAG3],
        lists: [LIST1, LIST2],
    },
    {
        createdWhen: new Date('2018-09-03T07:48'),
        body:
            'a sphere of influence (SOI) is a spatial region or concept division over which a state or organization has a level of cultural',
        pageTitle: 'Sphere of influence',
        title: 'Sphere of influence',
        url: 'http://www.test.com/page3#2',
        pageUrl: 'test.com/page3',
        hasBookmark: true,
    },
    {
        createdWhen: new Date('2018-09-05T10:12'),
        body:
            'the Warsaw Pact was established as a balance of power[12] or counterweight[13] to NATO',
        pageTitle: 'Warsaw Pact',
        title: 'Warsaw Pact',
        url: 'http://www.test.com/page7#1',
        pageUrl: 'test.com/page7',
        lists: [LIST2],
    },
    {
        createdWhen: new Date('2018-09-05T10:36'),
        body:
            'In the Western Bloc, the Warsaw Treaty Organization of Friendship, Cooperation and Mutual Assistance is often called the Warsaw Pact military alliance',
        pageTitle: 'Warsaw Pact',
        title: 'Warsaw Pact',
        url: 'http://www.test.com/page7#2',
        pageUrl: 'test.com/page7',
    },
    {
        createdWhen: new Date('2018-09-11T01:12'),
        body:
            'Collective defense has its roots in multiparty alliances and entails benefits as well as risks.',
        pageTitle: 'Collective defense',
        title: 'Collective defense',
        url: 'http://www.test.com/page9#1',
        pageUrl: 'test.com/page9',
        tags: [TAG1, TAG3],
        lists: [LIST2],
    },
    {
        createdWhen: new Date('2018-09-11T01:32'),
        body: 'collective defense also involves risky commitments',
        pageTitle: 'Collective defense',
        title: 'Collective defense',
        url: 'http://www.test.com/page9#2',
        pageUrl: 'test.com/page9',
        hasBookmark: true,
        lists: [LIST1],
    },
]
