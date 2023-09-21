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
        const data = await browser.storage.local.get('pkmFolders')
        const folders = data.pkmFolders || {}

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
            await this.createPageUpdate(item, 'logseq')
            // Logic to process changes for LogSeq
            // For example: await this.processForLogSeq(page);
        }

        // Process for Obsidian if valid
        if (validFolders.obsidian) {
            await this.createPageUpdate(item, 'obsidian')
        }
    }

    async createPageUpdate(item, pkmType) {
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
                            pkmType,
                        ),
                    item.data.pageTitle || null,
                    item.data.pageURL || null,
                    item.data.pageSpaces || null,
                    item.data.creationDate || null,
                    pkmType,
                )
            } else if (item.type === 'annotation') {
                annotationsSection = this.replaceOrAppendAnnotation(
                    annotationsSection,
                    item,
                    pkmType,
                )
            }
        } else {
            pageHeader = this.pageObjectDefault(
                item.data.pageTitle,
                item.data.pageUrl,
                (item.type === 'page' && item.data.spaces) || null,
                item.data.createdWhen,
                pkmType,
            )

            if (item.type === 'annotation') {
                annotationsSection = this.annotationObjectDefault(
                    item.data.annotationId,
                    convertHTMLintoMarkdown(item.data.body),
                    item.data.comment,
                    (item === 'annotation' && item.data.annotationSpaces) ||
                        null,
                    item.data.createdWhen,
                    pkmType,
                )
            }
        }

        fileContent =
            pageHeader + '### Annotations\n\n' + (annotationsSection || '')

        return await this.backendNew.storeObject(
            pageIDbyTitle,
            fileContent,
            pkmType,
        )
    }

    replaceOrAppendAnnotation(annotationsSection, item, pkmType) {
        let annotationStartIndex
        let annotationEndIndex
        if (pkmType === 'obsidian') {
            const annotationStartLine = `<span class="annotationStartLine" id="${item.data.annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${item.data.annotationId}"> --- </span>\n\n`
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
                    item.data.HighlightText,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    pkmType,
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
            const annotationStartLine = ` - > ${convertHTMLintoMarkdown(
                item.data.body,
            )}\n`
            const annotationEndLine = `- <span id="${item.data.annotationId}">---</span>\n`
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
                    item.data.HighlightText,
                    item.data.comment,
                    item.data.annotationSpaces,
                    item.data.createdWhen,
                    pkmType,
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
                convertHTMLintoMarkdown(item.data.body),
                item.data.comment,
                item.data.annotationSpaces,
                item.data.createdWhen,
                pkmType,
            )
            return annotationsSection + newAnnotationContent
        }
    }

    extractAndUpdateAnnotationData(
        annotationContent,
        annotationId,
        HighlightText,
        HighlightNote,
        annotationSpaces,
        creationDate,
        pkmType,
    ) {
        let annotation = annotationContent
        let updatedAnnotation
        let annotationNoteContent = null

        if (pkmType === 'obsidian') {
            // Find and remove the annotation start and end lines from the annotation string
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`
            const annotationEndLine = `<span class="annotationEndLine" id="${annotationId}"> --- </span>\n\n`
            annotation = annotation.replace(annotationStartLine, '')
            annotation = annotation.replace(annotationEndLine, '')

            console.log('ceoms ad')

            // Extract data from the annotation
            const highlightTextMatch = annotation.match(/> \s*(.+)\n\n/)

            console.log('highlight text match', highlightTextMatch)

            const annotationNoteStartIndex = annotation.indexOf(
                '<span class="annotationNoteStart">',
            )
            const annotationNoteEndIndex = annotation.indexOf(
                '<span class="annotationNoteEnd"/>',
            )
            const noteStartString = `<span class="annotationNoteStart"><strong>Note:</strong></span>`
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
                /<strong>Created at: <\/strong><\/span> (.+)\n\n/,
            )
            const spacesMatch = annotation.match(
                /<strong>Spaces:<\/strong><\/span> (.+)\n/,
            )

            const newHighlightText =
                (highlightTextMatch ? highlightTextMatch[1] : null) ||
                HighlightText
            const newHighlightNote =
                (annotationNoteContent ? annotationNoteContent : null) ||
                HighlightNote
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
                pkmType,
            )
        }

        if (pkmType === 'logseq') {
            // find content inside annotation string
            const highlightTextMatch = annotation.match(/ - >\s*(.+)\n/)

            const HighlightNoteMatch = annotation.match(
                /  - \*\*Note:\*\*\n    - (.+)/,
            )
            const creationDateMatch = annotation.match(
                /Created at:\*\* (.+)\n\n/,
            )
            const spacesMatch = annotation.match(/Spaces:\*\* (.+)\n/)

            const newHighlightText =
                (highlightTextMatch ? highlightTextMatch[1] : null) ||
                HighlightText
            const newHighlightNote =
                HighlightNote ||
                (HighlightNoteMatch ? HighlightNoteMatch[1] : null)
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
                pkmType,
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
        pkmType,
    ) {
        let createdWhen = creationDate
        let updatedPageHeader

        if (pkmType === 'obsidian') {
            if (pkmType === 'obsidian' && typeof createdWhen === 'number') {
                createdWhen = moment
                    .unix(createdWhen / 1000)
                    .format('YYYY-MM-DD')
            }

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
                pkmType,
            )
        }
        if (pkmType === 'logseq') {
            if (pkmType === 'logseq' && typeof createdWhen === 'number') {
                createdWhen = moment
                    .unix(createdWhen / 1000)
                    .format('MMM Do, YYYY')
            }

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
                pkmType,
            )
        }

        return updatedPageHeader
    }

    pageObjectDefault(pageTitle, pageURL, pageSpaces, creationDate, pkmType) {
        let createdWhen = creationDate
        let titleLine
        let urlLine
        let creationDateLine
        let spacesLine
        let pageSeparator
        let warning = ''
        if (pkmType === 'obsidian' && typeof createdWhen === 'number') {
            createdWhen = moment.unix(createdWhen / 1000).format('YYYY-MM-DD')
        } else if (pkmType === 'logseq' && typeof createdWhen === 'number') {
            createdWhen = moment.unix(createdWhen / 1000).format('MMM Do, YYYY')
        } else {
            createdWhen = createdWhen.replace(/\[\[(.+)\]\]/, '$1')
        }

        if (pkmType === 'obsidian') {
            titleLine = `Title: ${pageTitle}\n`
            urlLine = `Url: ${pageURL}\n`
            creationDateLine = `Created at: [[${createdWhen}]]\n`
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
            creationDateLine = `createdat:: [[${createdWhen}]]\n`
            spacesLine = pageSpaces ? `spaces:: ${pageSpaces}\n` : ''
            warning =
                '- ```\n❗️Do not edit this file or it will create duplicates or override your changes. For feedback, go to memex.garden/chatSupport.\n```\n'

            return titleLine + urlLine + creationDateLine + spacesLine + warning
        }
    }

    annotationObjectDefault(
        annotationId,
        HighlightText,
        HighlightNote,
        annotationSpaces,
        creationDate,
        pkmType,
    ) {
        if (pkmType === 'obsidian') {
            const annotationStartLine = `<span class="annotationStartLine" id="${annotationId}"></span>\n`

            const highlightTextLine = HighlightText
                ? `> ${HighlightText}\n\n`
                : ''
            const highlightNoteLine = HighlightNote
                ? `<span class="annotationNoteStart"><strong>Note:</strong></span>\n${convertHTMLintoMarkdown(
                      HighlightNote,
                  )}\n<span class="annotationNoteEnd"/>\n`
                : ''
            const creationDateLine = `<span class="annotationCreatedAt" id="${annotationId}"> <strong>Created at: </strong></span> ${creationDate}\n\n`
            const highlightSpacesLine = annotationSpaces
                ? `<span class="annotationSpaces" id="${annotationId}"> <strong>Spaces:</strong></span> ${annotationSpaces}\n`
                : ''
            const annotationEndLine = `<span class="annotationEndLine" id="${annotationId}"> --- </span>\n\n`

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
            const highlightTextLine = HighlightText
                ? ` - > ${HighlightText}\n`
                : ''
            const highlightNoteLine = HighlightNote
                ? `  - **Note:**\n    - ${convertHTMLintoMarkdown(
                      HighlightNote,
                  )}\n`
                : ''
            const creationDateLine = `  - **Created at:** ${creationDate}\n\n`
            const highlightSpacesLine = annotationSpaces
                ? `  - **Spaces:** ${annotationSpaces}\n`
                : ''
            const separatedLine = `- <span id="${annotationId}">---</span>\n`
            return (
                highlightTextLine +
                highlightNoteLine +
                highlightSpacesLine +
                creationDateLine +
                separatedLine
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
