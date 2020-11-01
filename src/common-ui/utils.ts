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

export function insertIndentedNewLine({el}: InsertTabProps) {
    const { value, selectionStart, selectionEnd } = el

    let lineNo = value.substr(0, selectionStart).split(/\r?\n|\r/).length;
    let lineText = el.value.split(/\r?\n|\r/)[lineNo - 1];
    let indentationCount = 0
    let indentationString = ''

    for (let i = 0; i < lineText.length; ++i) {
        console.log(lineText.charAt(i))
        if (lineText.charAt(i) === ' ') {
            i++
        } else {
           indentationString = lineText.slice(0, i)
           break
        }
    }

    el.value =
    value.substring(0, selectionStart) +
    '\n' + 
    indentationString + 
    value.substring(selectionEnd)

    let selectionStartNew = selectionStart + indentationString.length + 1
    let selectionEndNew = selectionEnd + indentationString.length + 1

    el.selectionStart = selectionStartNew
    el.selectionEnd = selectionEndNew
}


