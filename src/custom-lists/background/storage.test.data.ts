import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export const LIST_1 = {
    id: 0,
    name: 'SoMe ipsum',
    isNestable: true,
    isDeletable: true,
    createdAt: new Date(),
}
export const LIST_2 = {
    ...LIST_1,
    id: 1,
    name: 'good lorem',
}
export const LIST_3 = {
    ...LIST_1,
    id: 2,
    name: 'some good things',
}

export const LIST_1_TERMS = ['some', 'ipsum']
export const LIST_2_TERMS = ['good', 'lorem']
export const LIST_3_TERMS = ['some', 'good', 'things']

export const MOBILE_LIST = {
    ...LIST_1,
    id: SPECIAL_LIST_IDS.MOBILE,
    name: SPECIAL_LIST_NAMES.MOBILE,
}

// export const LIST_4 = { ...LIST_3 }

export const PAGE_ENTRY_1 = {
    id: 1,
    url: 'https://www.ipsum.com/test',
}

export const PAGE_ENTRY_2 = {
    id: 2,
    url: 'https://www.ipsum.com/test',
}

export const PAGE_ENTRY_3 = {
    id: 1,
    url: 'https://www.ipsum.in/lorem',
}

export const PAGE_ENTRY_4 = {
    id: 3,
    url: 'https://www.lorem.org/test/test1',
}
