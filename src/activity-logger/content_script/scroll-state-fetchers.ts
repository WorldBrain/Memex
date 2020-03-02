export const fetchScrollableHeight = (
    body = document.body,
    html = document.documentElement,
) =>
    Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
    ) || null

export const fetchScrollOffset = () =>
    window.pageYOffset !== undefined
        ? window.pageYOffset
        : ((document.documentElement ||
              document.body.parentNode ||
              document.body) as HTMLElement).scrollTop

export const fetchWindowHeight = () =>
    window.innerHeight || document.documentElement.clientHeight
