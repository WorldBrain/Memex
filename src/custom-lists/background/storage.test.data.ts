import { MOBILE_LIST_NAME } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/constants'

export const LIST_1 = {
    name: 'SoMe ipsum',
    isNestable: true,
    isDeletable: true,
}
export const LIST_2 = {
    ...LIST_1,
    name: 'good lorem',
}
export const LIST_3 = {
    ...LIST_1,
    name: 'some good things',
}
export const MOBILE_LIST = {
    ...LIST_1,
    name: MOBILE_LIST_NAME,
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
