export const appendCss = filename => {
    const link = document.createElement('link')
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.href = filename
    document.body.appendChild(link)
}
