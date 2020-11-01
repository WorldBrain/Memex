export interface InsertTabProps {
    el: HTMLInputElement | HTMLTextAreaElement
    tabStr?: '  ' | '    ' | '\t'
}

export function insertTab({ el, tabStr = '  ' }: InsertTabProps) {
    const { value, selectionStart, selectionEnd } = el

    el.value =
        value.substring(0, selectionStart) +
        tabStr +
        value.substring(selectionEnd)
    el.selectionStart =
        selectionEnd + tabStr.length - (selectionEnd - selectionStart)
    el.selectionEnd =
        selectionEnd + tabStr.length - (selectionEnd - selectionStart)
}

export function uninsertTab({ el, tabStr = '  ' }: InsertTabProps) {
    const { value, selectionStart, selectionEnd } = el

    const beforeStart = value
        .substring(0, selectionStart)
        .split('')
        .reverse()
        .join('')
    const indexOfTab = beforeStart.indexOf(tabStr)
    const indexOfNewline = beforeStart.indexOf('\n')

    if (indexOfTab !== -1 && indexOfTab < indexOfNewline) {
        el.value =
            beforeStart
                .substring(indexOfTab + tabStr.length)
                .split('')
                .reverse()
                .join('') +
            beforeStart.substring(0, indexOfTab).split('').reverse().join('') +
            value.substring(selectionEnd)

        el.selectionStart = selectionStart - tabStr.length
        el.selectionEnd = selectionEnd - tabStr.length
    }
}
