import Storex from '@worldbrain/storex'
import { AnnotsByPageUrl, PageUrlsByDay } from './background/types'

export const DEFAULT_TERM_SEPARATOR = /[|\u{A0}' .,|(\n)]+/u
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

export const collections = (db: Storex) => Object.keys(db.registry.collections)

/**
 * Handles splitting up searchable content into indexable terms. Terms are all
 * lowercased.
 *
 * @param {string} content Searchable content text.
 * @param {string|RegExp} [separator=' '] Separator used to split content into terms.
 * @returns {string[]} Array of terms derived from `content`.
 */
export const extractContent = (
    content,
    { separator = DEFAULT_TERM_SEPARATOR },
) =>
    content
        .split(separator)
        .map((word) => word.toLowerCase())
        .filter((term) => term.length)

export const mergeAnnotsByPage = (
    ...objs: AnnotsByPageUrl[]
): AnnotsByPageUrl => {
    const merged: AnnotsByPageUrl = {}
    for (const obj of objs) {
        for (const [pageUrl, annotations] of Object.entries(obj)) {
            if (!merged[pageUrl]) {
                merged[pageUrl] = annotations
                continue
            }

            const existingUrls = new Set(
                merged[pageUrl].map((a) => a.uniqueAnnotationUrl),
            )
            merged[pageUrl] = [
                ...merged[pageUrl],
                ...annotations.filter(
                    (a) => !existingUrls.has(a.uniqueAnnotationUrl),
                ),
            ]
        }
    }
    return merged
}

export const mergeAnnotsByDay = (...objs: PageUrlsByDay[]): PageUrlsByDay => {
    const merged: PageUrlsByDay = {}
    for (const obj of objs) {
        for (const [time, annotsByPage] of Object.entries(obj)) {
            merged[time] = merged[time]
                ? mergeAnnotsByPage(merged[time], annotsByPage)
                : annotsByPage
        }
    }
    return merged
}

export const areAnnotsByPageObjsDifferent = (
    a: AnnotsByPageUrl,
    b: AnnotsByPageUrl,
): boolean => {
    for (const [pageUrl, annotations] of Object.entries(a)) {
        if (!b[pageUrl]) {
            return true
        }

        if (b[pageUrl].length !== annotations.length) {
            return true
        }

        const existingUrlsB = new Set(
            b[pageUrl].map((annot) => annot.uniqueAnnotationUrl),
        )

        for (const annot of annotations) {
            if (!existingUrlsB.has(annot.uniqueAnnotationUrl)) {
                return true
            }
        }
    }
}

export const areAnnotsByDayObjsDifferent = (
    a: PageUrlsByDay,
    b: PageUrlsByDay,
): boolean => {
    for (const [time, annotsByPage] of Object.entries(a)) {
        if (!b[time]) {
            return true
        }

        if (areAnnotsByPageObjsDifferent(b[time], annotsByPage)) {
            return true
        }
    }
}
