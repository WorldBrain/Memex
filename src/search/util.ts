import Storex from '@worldbrain/storex'
import { AnnotsByPageUrl, PageUrlsByDay } from './background/types'

export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

export const collections = (db: Storex) => Object.keys(db.registry.collections)

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

            const existingUrls = new Set(merged[pageUrl].map((a) => a.url))
            merged[pageUrl] = [
                ...merged[pageUrl],
                ...annotations.filter((a) => !existingUrls.has(a.url)),
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

        const existingUrlsB = new Set(b[pageUrl].map((annot) => annot.url))

        for (const annot of annotations) {
            if (!existingUrlsB.has(annot.url)) {
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
