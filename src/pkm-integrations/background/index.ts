import { makeRemotelyCallable } from '../../util/webextensionRPC'
import { checkServerStatus } from '../../backup-restore/ui/utils'
import { MemexLocalBackend } from '../background/backend'
import { PkmSyncInterface } from './types'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { browser } from 'webextension-polyfill-ts'
import moment from 'moment'
export class PKMSyncBackgroundModule {
    backend: MemexLocalBackend
    remoteFunctions: PkmSyncInterface

    backendNew: MemexLocalBackend

    constructor() {
        this.backendNew = new MemexLocalBackend({
            url: 'http://localhost:11922',
        })

        this.remoteFunctions = {
            pushPKMSyncUpdate: async (item) => {
                await this.processChanges(item)
            },
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            ...this.remoteFunctions,
        })
    }

    private async getValidFolders() {
        const data = await browser.storage.local.get('PKMSYNCpkmFolders')
        const folders = data.PKMSYNCpkmFolders || {}

        const validFolders = {
            logSeq: !!folders.logSeqFolder,
            obsidian: !!folders.obsidianFolder,
        }

        return validFolders
    }

    async processChanges(item) {
        const validFolders = await this.getValidFolders()

        // Process for LogSeq if valid
        if (validFolders.logSeq) {
            const PKMSYNCdateformatLogseq = await browser.storage.local.get(
                'PKMSYNCdateformatLogseq',
            )
            try {
                await this.createPageUpdate(
                    item,
                    'logseq',
                    PKMSYNCdateformatLogseq.PKMSYNCdateformatLogseq,
                )
            } catch (e) {
                console.error('error', e)
            }
            // Logic to process changes for LogSeq
            // For example: await this.processForLogSeq(page);
        }

        // Process for Obsidian if valid
        if (validFolders.obsidian) {
            const PKMSYNCdateformatObsidian = await browser.storage.local.get(
                'PKMSYNCdateformatObsidian',
            )
            try {
                await this.createPageUpdate(
                    item,
                    'obsidian',
                    PKMSYNCdateformatObsidian.PKMSYNCdateformatObsidian,
                )
            } catch (e) {
                console.error('error', e)
            }
        }
    }

    async createPageUpdate(item, pkmType, syncDateFormat) {
        let page

        try {
            page = await this.backendNew.retrievePage(
                item.data.pageTitle,
                pkmType,
            )
        } catch (e) {}

        let [pageHeader, annotationsSection] = [null, null]
        let pageIDbyTitle = item.data.pageTitle
        let fileContent = ''

        if (page) {
            ;[pageHeader, annotationsSection] = page.split(
                '### Annotations\n\n',
            )

            if (item.type === 'page') {
                pageHeader = this.extractAndUpdatePageData(
                    pageHeader ||
                        this.pageObjectDefault(
                            item.data.pageTitle,
                            item.data.pageUrl,
                            item.data.pageSpaces || null,
                            item.data.createdWhen,
                            item.data.type,
                            pkmType,
                            syncDateFormat,
                        ),
                    item.data.pageTitle || null,
                    item.data.pageURL || null,
                    item.data.pageSpaces || null,
                    item.data.creationDate || null,
                    item.data.type || null,
                    pkmType,
                    syncDateFormat,
                )
            } else if (item.type === 'annotation') {
                annotationsSection = this.replaceOrAppendAnnotation(
                    annotationsSection,
                    item,
                    pkmType,
                    syncDateFormat,
                )
            }
        } else {
            pageHeader = this.pageObjectDefault(
                item.data.pageTitle,
                item.data.pageUrl,
                (item.type === 'page' && item.data.spaces) || null,
                item.data.createdWhen,
                item.data.type,
                pkmType,
                syncDateFormat,
            )

            // if (item.type === 'annotation' || item.type === 'note') {
            //     annotationsSection = this.annotationObjectDefault(
            //         item.data.annotationId,
            //         item.data.body
            //             ? convertHTMLintoMarkdown(item.data.body)
            //             : '',
            //         item.data.comment,
            //         (item === 'annotation' && item.data.annotationSpaces) ||
            //             null,
            //         item.data.createdWhen,
            //         pkmType,
            //     )
            // }
        }

        fileContent =
            pageHeader + '### Annotations\n\n' + (annotationsSection || '')

        return await this.backendNew.storeObject(
            pageIDbyTitle,
            fileContent,
            pkmType,
        )
    }

    replaceOrAppendAnnotation(
        annotationsSection,
        item,
        pkmType,
        syncDateFormat,
    ) {
        let annotationStartIndex
        let annotationEndIndex
        if (pkmType === 'obsidian') {
            const annotationStartLine = `<span class="annotationStartLine" id="${item.data.annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${item.data.annotationId}"> --- </span>\n`
            annotationStartIndex = annotationsSection.indexOf(
                annotationStartLine,
            )
            if (annotationStartIndex !== -1) {
                const annotationEndIndex = annotationsSection.indexOf(
                    annotationEndLine,
                    annotationStartIndex,
                )

                const annotationContent = annotationsSection.slice(
                    annotationStartIndex,
                    annotationEndIndex,
                )

                const newAnnotationContent = this.extractAndUpdateAnnotationData(
                    annotationContent,
                    item.data.annotationId,
                    item.data.body,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    item.data.type,
                    pkmType,
                    syncDateFormat,
                )

                return (
                    annotationsSection.slice(0, annotationStartIndex) +
                    newAnnotationContent +
                    annotationsSection.slice(
                        annotationEndIndex + annotationEndLine.length,
                    )
                )
            }
        }
        if (pkmType === 'logseq') {
            let annotationStartLine = `- <span annotationstart id="${item.data.annotationId}">---</span>\n`
            const annotationEndLine = `<span id="${item.data.annotationId}"/>\n\n`
            annotationStartIndex = annotationsSection.indexOf(
                annotationStartLine,
            )
            annotationEndIndex = annotationsSection.indexOf(annotationEndLine)

            if (annotationEndIndex !== -1 && annotationStartIndex !== -1) {
                const annotationContent = annotationsSection.slice(
                    annotationStartIndex,
                    annotationEndIndex,
                )

                const newAnnotationContent = this.extractAndUpdateAnnotationData(
                    annotationContent,
                    item.data.annotationId,
                    item.data.body,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    item.data.type,
                    pkmType,
                    syncDateFormat,
                )

                return (
                    annotationsSection.slice(0, annotationStartIndex) +
                    newAnnotationContent +
                    annotationsSection.slice(
                        annotationEndIndex + annotationEndLine.length,
                    )
                )
            }
        }

        if (annotationStartIndex === -1) {
            const newAnnotationContent = this.annotationObjectDefault(
                item.data.annotationId,
                item.data.body ? convertHTMLintoMarkdown(item.data.body) : '',
                item.data.comment,
                item.data.annotationSpaces,
                item.data.createdWhen,
                item.data.type,
                pkmType,
                syncDateFormat,
            )
            return annotationsSection + newAnnotationContent
        }
    }

    extractAndUpdateAnnotationData(
        annotationContent,
        annotationId,
        body,
        comment,
        annotationSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        let annotation = annotationContent
        let updatedAnnotation
        let annotationNoteContent = null

        if (pkmType === 'obsidian') {
            // Find and remove the annotation start and end lines from the annotation string
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${annotationId}"> --- </span>\n`
            annotation = annotation.replace(annotationStartLine, '')
            annotation = annotation.replace(annotationEndLine, '')

            // Extract data from the annotation
            let highlightTextMatch
            highlightTextMatch = annotation.match(/> \s*(.+)\n\n/)

            const noteStartString = `<span class="annotationNoteStart"><strong>Note:</strong></span>\n`
            const annotationNoteStartIndex = annotation.indexOf(noteStartString)
            const annotationNoteEndIndex = annotation.indexOf(
                '<span class="annotationNoteEnd"/>',
            )
            if (
                annotationNoteStartIndex !== -1 &&
                annotationNoteEndIndex !== -1
            ) {
                annotationNoteContent = annotation.slice(
                    annotationNoteStartIndex + noteStartString.length,
                    annotationNoteEndIndex,
                )
            }

            const creationDateMatch = annotation.match(
                /<strong>Created at:<\/strong><\/span> (.+)\n/,
            )

            const spacesMatch = annotation.match(
                /<strong>Spaces:<\/strong><\/span> (.+)\n/,
            )

            const newHighlightText =
                (highlightTextMatch ? highlightTextMatch[1] : null) || body
            const newHighlightNote =
                comment ||
                (annotationNoteContent ? annotationNoteContent : null)

            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) ||
                creationDate

            const existingSpaces = spacesMatch
                ? spacesMatch[1]
                      .split(', ')
                      .map((space) => space.replace(/\[\[(.+)\]\]/, '$1'))
                : []
            if (annotationSpaces) {
                const index = existingSpaces.indexOf(annotationSpaces)
                if (index !== -1) {
                    existingSpaces.splice(index, 1)
                } else {
                    existingSpaces.push(annotationSpaces)
                }
            }
            const formattedSpaces = existingSpaces
                .map((space) => `[[${space}]]`)
                .join(', ')

            updatedAnnotation = this.annotationObjectDefault(
                annotationId,
                newHighlightText,
                newHighlightNote,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }

        if (pkmType === 'logseq') {
            // find content inside annotation string
            let highlightTextMatch = annotation.match(/ - >\s*(.+)\n/)

            const HighlightNoteMatch = annotation.match(
                /<span id=".*"><strong>Note:<\/strong><\/span>\n    - (.+)\n/,
            )
            const creationDateMatch = annotation.match(/Created at:\*\* (.+)\r/)
            const spacesMatch = annotation.match(/Spaces:\*\* (.+)\n/)

            const newHighlightText =
                (highlightTextMatch ? highlightTextMatch[1] : null) || body
            const newHighlightNote =
                comment || (HighlightNoteMatch ? HighlightNoteMatch[1] : null)
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) ||
                creationDate
            const existingSpaces = spacesMatch
                ? spacesMatch[1]
                      .split(', ')
                      .map((space) => space.replace(/\[\[(.+)\]\]/, '$1'))
                : []

            // replace content
            if (annotationSpaces) {
                const index = existingSpaces.indexOf(annotationSpaces)
                if (index !== -1) {
                    existingSpaces.splice(index, 1)
                } else {
                    existingSpaces.push(annotationSpaces)
                }
            }
            const formattedSpaces = existingSpaces
                .map((space) => `[[${space}]]`)
                .join(' ')

            updatedAnnotation = this.annotationObjectDefault(
                annotationId,
                newHighlightText,
                newHighlightNote,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }

        return updatedAnnotation
    }

    extractAndUpdatePageData(
        pageHeader,
        pageTitle,
        pageURL,
        pageSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        let createdWhen = creationDate
        let updatedPageHeader

        if (pkmType === 'obsidian') {
            // Extract data from pageHeader
            const titleMatch = pageHeader.match(/Title: (.+)/)
            const urlMatch = pageHeader.match(/Url: (.+)/)
            const creationDateMatch = pageHeader.match(/Created at: (.+)/)
            const newTitle = (titleMatch ? titleMatch[1] : null) || pageTitle
            const newURL = (urlMatch ? urlMatch[1] : null) || pageURL
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) || createdWhen

            let lines = pageHeader.split('\n')
            let spacesStartIndex = lines.findIndex((line) =>
                line.startsWith('Spaces:'),
            )
            let spaces = []

            if (spacesStartIndex !== -1) {
                for (let i = spacesStartIndex + 1; i < lines.length; i++) {
                    let line = lines[i]
                    let match = line.match(/^ - "\[\[(.+)\]\]"$/)
                    if (match) {
                        let content = match[1]
                        spaces.push(content)
                    } else {
                        break // Stop when we reach a line that doesn't match the pattern
                    }
                }
            }

            if (pageSpaces) {
                const index = spaces.indexOf(pageSpaces)
                if (index !== -1) {
                    spaces.splice(index, 1)
                } else {
                    spaces.push(pageSpaces)
                }
            }
            const formattedSpaces = spaces
                .map((space) => ` - "[[${space}]]"\n`)
                .join('')

            updatedPageHeader = this.pageObjectDefault(
                newTitle,
                newURL,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }
        if (pkmType === 'logseq') {
            // Extract data from pageHeader
            const titleMatch = pageHeader.match(/pagetitle:: (.+)/)
            const urlMatch = pageHeader.match(/pageurl:: (.+)/)
            const creationDateMatch = pageHeader.match(/createdat:: (.+)/)

            // set new values or keep old ones
            const newTitle = (titleMatch ? titleMatch[1] : null) || pageTitle
            const newURL = (urlMatch ? urlMatch[1] : null) || pageURL
            const newCreationDate =
                (creationDateMatch ? creationDateMatch[1] : null) || createdWhen
            // Step 1: Extract content inside [[]] from the line starting with "spaces::" and put them into an array
            let spaces = []
            let spacesLine = pageHeader
                .split('\n')
                .find((line) => line.startsWith('spaces::'))
            if (spacesLine) {
                let spacesMatch = spacesLine.match(/\[\[(.+?)\]\]/g)
                if (spacesMatch) {
                    spaces = spacesMatch.map((space) => space.slice(2, -2))
                }
            }

            // Step 2: Check if "pageSpaces" value is inside this array
            const index = spaces.indexOf(pageSpaces)
            if (index !== -1) {
                // a) If yes, remove it from the spaces array
                spaces.splice(index, 1)
            } else {
                // b) If not, add it to the array
                spaces.push(pageSpaces)
            }

            // Step 3: Create a string with all the items of the spaces array and add back the [[]] around them
            const formattedSpaces = spaces
                .map((space) => `[[${space}]]`)
                .join(' ')

            updatedPageHeader = this.pageObjectDefault(
                newTitle,
                newURL,
                formattedSpaces,
                newCreationDate,
                type,
                pkmType,
                syncDateFormat,
            )
        }

        return updatedPageHeader
    }

    pageObjectDefault(
        pageTitle,
        pageURL,
        pageSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        let createdWhen = creationDate
        let titleLine
        let urlLine
        let creationDateLine
        let spacesLine
        let pageSeparator
        let warning = ''
        if (pkmType === 'obsidian' && typeof createdWhen === 'number') {
            createdWhen = `"[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]"`
        } else if (pkmType === 'logseq' && typeof createdWhen === 'number') {
            createdWhen = `[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]`
        }

        if (pkmType === 'obsidian') {
            titleLine = `Title: ${pageTitle}\n`
            urlLine = `Url: ${pageURL}\n`
            creationDateLine = `Created at: ${createdWhen}\n`
            spacesLine = pageSpaces ? `Spaces: \n${pageSpaces}` : ''
            pageSeparator = '---\n'
            warning =
                '```\n❗️Do not edit this file or it will create duplicates or override your changes. For feedback, go to memex.garden/chatSupport.\n```\n'
            return (
                pageSeparator +
                titleLine +
                urlLine +
                creationDateLine +
                spacesLine +
                pageSeparator +
                warning
            )
        }
        if (pkmType === 'logseq') {
            urlLine = `pageurl:: ${pageURL}\n`
            titleLine = `pagetitle:: ${pageTitle}\n`
            creationDateLine = `createdat:: ${createdWhen}\n`
            spacesLine = pageSpaces ? `spaces:: ${pageSpaces}\n` : ''
            warning =
                '- ```\n❗️Do not edit this file or it will create duplicates or override your changes. For feedback, go to memex.garden/chatSupport.\n```\n'

            return titleLine + urlLine + creationDateLine + spacesLine + warning
        }
    }

    annotationObjectDefault(
        annotationId,
        body,
        comment,
        annotationSpaces,
        creationDate,
        type,
        pkmType,
        syncDateFormat,
    ) {
        let createdWhen = creationDate
        if (pkmType === 'obsidian' && typeof createdWhen === 'number') {
            createdWhen = `"[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]"`
        } else if (pkmType === 'logseq' && typeof createdWhen === 'number') {
            createdWhen = `[[${moment
                .unix(createdWhen / 1000)
                .format(syncDateFormat)}]]`
        }

        if (pkmType === 'obsidian') {
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`
            let highlightTextLine = body ? `> ${body}\n\n` : ''
            const highlightNoteLine = comment
                ? `<span class="annotationNoteStart"><strong>Note:</strong></span>\n${convertHTMLintoMarkdown(
                      comment,
                  )}\n<span class="annotationNoteEnd"/>\n`
                : ''
            const highlightSpacesLine = annotationSpaces
                ? `<span class="annotationSpaces" id="${annotationId}"><strong>Spaces:</strong></span> ${annotationSpaces}\n`
                : ''
            const creationDateLine = `<span class="annotationCreatedAt" id="${annotationId}"><strong>Created at:</strong></span> ${moment(
                createdWhen,
            ).format(`${syncDateFormat} hh:mm a`)}\n`
            const annotationEndLine = `\r<span class="annotationEndLine" id="${annotationId}"> --- </span>\n`

            return (
                annotationStartLine +
                highlightTextLine +
                highlightNoteLine +
                highlightSpacesLine +
                creationDateLine +
                annotationEndLine
            )
        }
        if (pkmType === 'logseq') {
            let highlightTextLine = ''
            const separatedLine = `- <span annotationstart id="${annotationId}">---</span>\n`
            highlightTextLine = body ? ` - > ${body}\n` : ''

            const highlightNoteLine = comment
                ? `  - <span id="${annotationId}"><strong>Note:</strong></span>\n    - ${convertHTMLintoMarkdown(
                      comment,
                  )}\n`
                : ''
            const highlightSpacesLine = annotationSpaces
                ? `  - **Spaces:** ${annotationSpaces}\n`
                : ''
            const creationDateLine = `  - **Created at:** ${moment(
                createdWhen,
            ).format(`${syncDateFormat} hh:mm a`)}\r`
            const annotationEndLine = `<span id="${annotationId}"/>\n\n`
            return (
                separatedLine +
                highlightTextLine +
                highlightNoteLine +
                highlightSpacesLine +
                creationDateLine +
                annotationEndLine
            )
        }
    }
}

function convertHTMLintoMarkdown(html) {
    let turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        codeBlockStyle: 'fenced',
    })
    const markdown = turndownService.turndown(html)
    return markdown
}
