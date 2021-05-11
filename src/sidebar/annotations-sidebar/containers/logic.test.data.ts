import type { Annotation } from 'src/annotations/types'
import type { PageList } from 'src/custom-lists/background/types'
import {
    SharedAnnotation,
    SharedAnnotationReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export const PAGE_URL_1 = 'https://test.com'
export const COMMENT_1 = 'This is a test comment'
export const TAG_1 = 'tag 1'
export const TAG_2 = 'tag 2'
export const CURRENT_TAB_URL_1 = 'https://test.com'
export const CURRENT_TAB_TITLE_1 = 'Testing Site'

export const ANNOT_1: Annotation = {
    url: CURRENT_TAB_URL_1 + '#123',
    pageUrl: CURRENT_TAB_URL_1,
    pageTitle: CURRENT_TAB_TITLE_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01'),
    createdWhen: new Date('2020-01-01'),
    selector: {} as any,
    tags: [],
}

export const FOLLOWED_LISTS: PageList[] = [
    {
        id: 1,
        name: 'test a',
        remoteId: 'test a',
    },
    {
        id: 2,
        name: 'test b',
        remoteId: 'test b',
    },
    {
        id: 3,
        name: 'test c',
        remoteId: 'test c',
    },
]

export const SHARED_ANNOTATIONS: Array<
    SharedAnnotation & {
        reference: SharedAnnotationReference
        creatorReference: UserReference
    }
> = [
    {
        reference: { type: 'shared-annotation-reference', id: 1 },
        creatorReference: { type: 'user-reference', id: 123 },
        normalizedPageUrl: 'test.com',
        body: 'test highlight 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
    {
        reference: { type: 'shared-annotation-reference', id: 2 },
        creatorReference: { type: 'user-reference', id: 123 },
        normalizedPageUrl: 'test.com',
        body: 'test highlight 2',
        comment: 'test comment 1',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
    {
        reference: { type: 'shared-annotation-reference', id: 3 },
        creatorReference: { type: 'user-reference', id: 123 },
        normalizedPageUrl: 'test.com',
        comment: 'test comment 2',
        createdWhen: 11111,
        updatedWhen: 11111,
        uploadedWhen: 11111,
    },
]
