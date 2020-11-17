export const getTextInsertedAtInputSelection = (
    toInsert: string,
    {
        value,
        selectionStart,
        selectionEnd,
    }: HTMLInputElement | HTMLTextAreaElement,
): string =>
    value.substring(0, selectionStart) +
    toInsert +
    value.substring(selectionEnd, value.length)
