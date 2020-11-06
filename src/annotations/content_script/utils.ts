export const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
    }

    const dummy = document.createElement('textarea')
    document.body.appendChild(dummy)
    dummy.value = text
    dummy.select()
    const success = document.execCommand('copy')
    document.body.removeChild(dummy)
    return success
}
