# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# This is a modified copy of
# https://github.com/openannotation/annotator/blob/v1.2.x/src/xpath.coffee

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
