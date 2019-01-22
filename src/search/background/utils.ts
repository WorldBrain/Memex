import { ContentTypes } from './types'

export const pageSearchOnly = (flags: ContentTypes) =>
    flags.pages && !flags.highlights && !flags.notes

export const annotSearchOnly = (flags: ContentTypes) =>
    !flags.pages && (flags.highlights || flags.notes)
