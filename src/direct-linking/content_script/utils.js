export const copyToClipboard = text => {
    const dummy = document.createElement('input')
    document.body.appendChild(dummy)
    dummy.setAttribute('value', text)
    dummy.select()
    const success = document.execCommand('copy')
    document.body.removeChild(dummy)
    return success
}
