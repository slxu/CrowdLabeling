  d3.layout.sentenceTree = function() {
    function d3_layout_hierarchyRebind(object, hierarchy) {
      d3.rebind(object, hierarchy, "sort", "children", "value");
      object.nodes = object;
      object.links = d3_layout_hierarchyLinks;
      return object;
    }
    function d3_layout_hierarchyChildren(d) {
      return d.children;
    }
    function d3_layout_hierarchyValue(d) {
      return d.value;
    }
    function d3_layout_hierarchySort(a, b) {
      return b.value - a.value;
    }
    function d3_layout_hierarchyLinks(nodes) {
      return d3.merge(nodes.map(function(parent) {
        return (parent.children || []).map(function(child) {
          return {
            source: parent,
            target: child
          };
        });
      }));
    }
    function d3_layout_treeSeparation(a, b) {
      return a.parent == b.parent ? 1 : 2;
    }
    function d3_layout_treeLeft(node) {
      var children = node.children;
      return children && children.length ? children[0] : node._tree.thread;
    }
    function d3_layout_treeRight(node) {
      var children = node.children, n;
      return children && (n = children.length) ? children[n - 1] : node._tree.thread;
    }
    function d3_layout_treeSearch(node, compare) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child, n, i = -1;
        while (++i < n) {
          if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
            node = child;
          }
        }
      }
      return node;
    }
    function d3_layout_treeRightmost(a, b) {
      return a.x - b.x;
    }
    function d3_layout_treeLeftmost(a, b) {
      return b.x - a.x;
    }
    function d3_layout_treeDeepest(a, b) {
      return a.depth - b.depth;
    }
    function d3_layout_treeVisitAfter(node, callback) {
      function visit(node, previousSibling) {
        var children = node.children;
        if (children && (n = children.length)) {
          var child, previousChild = null, i = -1, n;
          while (++i < n) {
            child = children[i];
            visit(child, previousChild);
            previousChild = child;
          }
        }
        callback(node, previousSibling);
      }
      visit(node, null);
    }
    function d3_layout_treeShift(node) {
      var shift = 0, change = 0, children = node.children, i = children.length, child;
      while (--i >= 0) {
        child = children[i]._tree;
        child.prelim += shift;
        child.mod += shift;
        shift += child.shift + (change += child.change);
      }
    }
    function d3_layout_treeMove(ancestor, node, shift) {
      ancestor = ancestor._tree;
      node = node._tree;
      var change = shift / (node.number - ancestor.number);
      ancestor.change += change;
      node.change -= change;
      node.shift += shift;
      node.prelim += shift;
      node.mod += shift;
    }
    function d3_layout_treeAncestor(vim, node, ancestor) {
      return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
    }
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, height = 1, width = 1, nodeSize = false;
    function sentenceTree(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      function firstWalk(node, previousSibling) {
        var children = node.children, layout = node._tree;
        if (children && (n = children.length)) {
          var n, firstChild = children[0], previousChild, ancestor = firstChild, child, i = -1;
          while (++i < n) {
            child = children[i];
            firstWalk(child, previousChild);
            ancestor = apportion(child, previousChild, ancestor);
            previousChild = child;
          }
          d3_layout_treeShift(node);
          var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
            layout.mod = layout.prelim - midpoint;
          } else {
            layout.prelim = midpoint;
          }
        } else {
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
          }
        }
      }
      function secondWalk(node, x) {
        node.x = node._tree.prelim + x;
        var children = node.children;
        if (children && (n = children.length)) {
          var i = -1, n;
          x += node._tree.mod;
          while (++i < n) {
            secondWalk(children[i], x);
          }
        }
      }
      function apportion(node, previousSibling, ancestor) {
        if (previousSibling) {
          var vip = node, vop = node, vim = previousSibling, vom = node.parent.children[0], sip = vip._tree.mod, sop = vop._tree.mod, sim = vim._tree.mod, som = vom._tree.mod, shift;
          while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
            vom = d3_layout_treeLeft(vom);
            vop = d3_layout_treeRight(vop);
            vop._tree.ancestor = node;
            shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
            if (shift > 0) {
              d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
              sip += shift;
              sop += shift;
            }
            sim += vim._tree.mod;
            sip += vip._tree.mod;
            som += vom._tree.mod;
            sop += vop._tree.mod;
          }
          if (vim && !d3_layout_treeRight(vop)) {
            vop._tree.thread = vim;
            vop._tree.mod += sim - sop;
          }
          if (vip && !d3_layout_treeLeft(vom)) {
            vom._tree.thread = vip;
            vom._tree.mod += sip - som;
            ancestor = node;
          }
        }
        return ancestor;
      }
      function collapseName(d){
        var name = d.name?d.name:"";
        var children = d.children?d.children:[];
        children.forEach(function(c){
            var cName = collapseName(c);
            if (cName && cName.length)
              name = name.concat(" ").concat(cName);
          }
        );
        return name;
      }
      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._name = d.name;
          d.name = collapseName(d);
          d.children = null;
        }
        else if (d._children)
        {
          d.children = d._children;
          d._children = null;
          d.name = d._name;
          d._name = null;
        }
      }
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {
        node._tree = {
          ancestor: node,
          prelim: 0,
          mod: 0,
          change: 0,
          shift: 0,
          number: previousSibling ? previousSibling._tree.number + 1 : 0
        };
      });
      firstWalk(root);
      secondWalk(root, -root._tree.prelim);
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {
        node.x *= height;
        node.y = node.depth * width;
        node.collapse = function(){collapse(this);};
        delete node._tree;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * height;
        node.y = node.depth / y1 * width;
        node.collapse = function(){collapse(this);};
        delete node._tree;
      });
      return nodes;
    }

    sentenceTree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return sentenceTree;
    };
    sentenceTree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : [height,width];
      height = x[0];
      width = x[1];
      nodeSize = height == null;
      return sentenceTree;
    };
    sentenceTree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? [height, width] : null;
      height = x[0];
      width = x[1];
      nodeSize = height != null;
      return sentenceTree;
    };
    return d3_layout_hierarchyRebind(sentenceTree, hierarchy);
  };
