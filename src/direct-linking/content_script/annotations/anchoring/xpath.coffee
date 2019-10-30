$ = require('jquery')

# A simple XPath evaluator using jQuery which can evaluate queries of
simpleXPathJQuery = (relativeRoot) ->
  jq = this.map ->
    path = ''
    elem = this

    while elem?.nodeType == Node.ELEMENT_NODE and elem isnt relativeRoot
      tagName = elem.tagName.replace(":", "\\:")
      idx = $(elem.parentNode).children(tagName).index(elem) + 1

      idx  = "[#{idx}]"
      path = "/" + elem.tagName.toLowerCase() + idx + path
      elem = elem.parentNode

    path

  jq.get()

# A simple XPath evaluator using only standard DOM methods which can
# evaluate queries of the form /tag[index]/tag[index].
simpleXPathPure = (relativeRoot) ->

  getPathSegment = (node) ->
    name = getNodeName node
    pos = getNodePosition node
    "#{name}[#{pos}]"

  rootNode = relativeRoot

  getPathTo = (node) ->
    xpath = '';
    while node != rootNode
      unless node?
        throw new Error "Called getPathTo on a node which was not a descendant of @rootNode. " + rootNode
      xpath = (getPathSegment node) + '/' + xpath
      node = node.parentNode
    xpath = '/' + xpath
    xpath = xpath.replace /\/$/, ''
    xpath

  jq = this.map ->
    path = getPathTo this

    path

  jq.get()

findChild = (node, type, index) ->
  unless node.hasChildNodes()
    throw new Error "XPath error: node has no children!"
  children = node.childNodes
  found = 0
  for child in children
    name = getNodeName child
    if name is type
      found += 1
      if found is index
        return child
  throw new Error "XPath error: wanted child not found."

# Get the node name for use in generating an xpath expression.
getNodeName = (node) ->
    nodeName = node.nodeName.toLowerCase()
    switch nodeName
      when "#text" then return "text()"
      when "#comment" then return "comment()"
      when "#cdata-section" then return "cdata-section()"
      else return nodeName

# Get the index of the node as it appears in its parent's child list
getNodePosition = (node) ->
  pos = 0
  tmp = node
  while tmp
    if tmp.nodeName is node.nodeName
      pos++
    tmp = tmp.previousSibling
  pos

module.exports = {
  simpleXPathJQuery,
  simpleXPathPure,
}
