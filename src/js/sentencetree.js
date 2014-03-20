!function() {
  var sentenceTree = {};

  sentenceTree = function() {
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
    function d3_layout_treeAncestor(vim, node, ancestor) {
      return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
    }
    function sentenceTree_renderedTextSize(string, fontSize) {
        var paper = Raphael(0, 0, 0, 0);
            paper.canvas.style.visibility = 'hidden';
        var el = paper.text(0, 0, string);
            el.attr('font-size', fontSize);
        var bBox = el.getBBox();
        paper.remove();
        return {
            width: bBox.width,
            height: bBox.height
        };
    }
    function sentenceTree_computeDepthGap(currentRoot, width, textMargin, textSize){
      var minGap = Number.MAX_VALUE;
      d3_layout_treeVisitAfter(currentRoot, function(node, previousSibling){
          if (!node.children || !node.children.length) {
            var myTextLength=0;
            if (node.name) {
              myTextLength = sentenceTree_renderedTextSize(node.name, textSize).width;
            }
            if (node.depth>0) {
              var myGap = (width - 2*textMargin - myTextLength)/node.depth
              if (myGap < minGap)
                minGap = myGap;
            }
          }
        });      
      return {"nodeGap":minGap};
    }
    function sentenceTree_computeDepthGapWordsAlign(currentRoot, width, textMargin, textSize){
      var maxTextLength = Number.MIN_VALUE;
      var maxDepth = 0;
      d3_layout_treeVisitAfter(currentRoot, function(node, previousSibling){
          if (!node.children || !node.children.length) {
            var myTextLength=0;
            if (node.name) {
              myTextLength = sentenceTree_renderedTextSize(node.name, textSize).width;
            }
            maxTextLength = d3.max([myTextLength,maxTextLength]);
            maxDepth = d3.max([maxDepth, node.depth])
          }
        });
      return {"maxTextLength":maxTextLength,"maxDepth":maxDepth,"nodeGap":(width - 2*textMargin-maxTextLength)/maxDepth};
    }
    function sentenceTree_removeDuplicates(subTreeRoots) {
      var subTreeRootsNeedMerge=new Array();
      subTreeRoots.forEach(function(d){
        if (subTreeRootsNeedMerge.indexOf(d)<0)
          subTreeRootsNeedMerge.push(d);
      });
      return subTreeRootsNeedMerge;
    }
    function sentenceTree_nearestCommonAncestorOrdered(subTreeRoots){
      var subTreeRoots = subTreeRoots.slice(0);
      var minDepth = d3.min(subTreeRoots, function(d){
        return d.depth;
      });
      
      for (var i=0;i<subTreeRoots.length;i++) {
        while (subTreeRoots[i].depth>minDepth) {
          subTreeRoots[i] = subTreeRoots[i].parent;
        }
      }
      
      subTreeRoots = sentenceTree_removeDuplicates(subTreeRoots);
      var lastSubTreeRoots=null;
      while (subTreeRoots.length>1) {
        lastSubTreeRoots=subTreeRoots.slice(0);
        for (var i=0;i<subTreeRoots.length;i++) {
          subTreeRoots[i] = subTreeRoots[i].parent;
        }
        subTreeRoots = sentenceTree_removeDuplicates(subTreeRoots);
      }
      if (lastSubTreeRoots==null)
        return null;

      if (subTreeRoots.length==1)
      {
        var ancestor = subTreeRoots[0];
        var correctOrderedChildren=new Array();
        lastSubTreeRoots.forEach(function(d){
          correctOrderedChildren.push({"node":d,"idx":ancestor.children.indexOf(d)});
        });
        correctOrderedChildren.sort(function(a,b){
          return a.idx-b.idx;
        });
        var orderedChildren=new Array();
        var lastIdx=correctOrderedChildren[0].idx-1;
        correctOrderedChildren.forEach(function(d){
          if (d.idx != lastIdx+1){
            lastIdx=-1;
            return;
          }
          lastIdx+=1;
          orderedChildren.push(d.node);
        });
        if (lastIdx>=0)
          return [ancestor,orderedChildren];
        else
          return null;
      }
      else
        return null;
    }
    function sentenceTree_changeDepth(currentRoot,deltaDepth) {
      currentRoot.depth+=deltaDepth;
      if (currentRoot.children && currentRoot.children.length)
        currentRoot.children.forEach(function(d) {
          sentenceTree_changeDepth(d,deltaDepth);
        });
    }
    function sentenceTree_cutEdgeMergeRear(selectedSubTrees) {
      if (selectedSubTrees && selectedSubTrees.length==1) {
        var selectedParent = selectedSubTrees[0].parent;
        var selectedChild = selectedSubTrees[0];
        var selectedGrandChildren = selectedChild.children;
        if (selectedGrandChildren && selectedGrandChildren.length) {
          var childIdx = selectedParent.children.indexOf(selectedChild);
          selectedParent.children.splice(childIdx,1);
          selectedGrandChildren.forEach(function(e){
            e.parent = selectedParent;
            sentenceTree_changeDepth(e,-1);
            selectedParent.children.splice(childIdx,0,e);
            childIdx++;
          });
        }
        return selectedParent;
      }
      return null;
    }
    function sentenceTree_cutEdgeMergeFront(selectedSubTrees) {
      //can only remove first child or last child
      if (selectedSubTrees && selectedSubTrees.length==1) {
        var selectedParent = selectedSubTrees[0].parent;
        var selectedChild = selectedSubTrees[0];
        if (selectedParent.depth!=0) {
          var grandParent = selectedParent.parent;
          //if it's root-> leaf, don't cut
          if (selectedParent.children.length==1) {
            // single child, should remove the parent node
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children[i] = selectedChild;
                selectedChild.parent = grandParent;
                sentenceTree_changeDepth(selectedChild,-1);
                break;
              }
          }
          else if (selectedParent.children[0] == selectedSubTrees[0]) {
            //first child
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children.splice(i,0,selectedChild); selectedChild.parent = grandParent;
                selectedParent.children.splice(0,1);
                sentenceTree_changeDepth(selectedChild,-1);
                break;
              }
          } else if
          (selectedParent.children[selectedParent.children.length-1] == selectedSubTrees[0]) {
            //last child
            for (var i=0;i<grandParent.children.length;i++)
              if (grandParent.children[i] == selectedParent)
              {
                grandParent.children.splice(i+1,0,selectedChild);
                selectedChild.parent = grandParent;
                selectedParent.children.splice(selectedParent.children.length-1,1);
                sentenceTree_changeDepth(selectedChild,-1);
                break;
              }
          }
          return grandParent;
        }
      }
      return null;
    }
    function sentenceTree_addMergeNode(parentNode, childrenNodes) {
      var newNode={};
      newNode.parent = parentNode;
      newNode.children= childrenNodes;
      newNode.depth= parentNode.depth+1;
      childrenNodes.forEach(function(d){
        d.parent=newNode;
        sentenceTree_changeDepth(d,1);
      });
      var newChildren=new Array();
      var newNodeAdded=false;
      parentNode.children.forEach(function(d) {
        if (childrenNodes.indexOf(d)<0)
          newChildren.push(d);
        else
          if (!newNodeAdded) {
            newChildren.push(newNode);
            newNodeAdded=true;
          }
      });
      parentNode.children = newChildren;
    }
    function sentenceTree_mergeSelectedSubTrees(selectedSubTrees){
      if (selectedSubTrees && selectedSubTrees.length) {
        var ancestorChildren = sentenceTree_nearestCommonAncestorOrdered(selectedSubTrees);
        if (ancestorChildren)
        {
          var ancestor = ancestorChildren[0];
          var aChildren = ancestorChildren[1];
          sentenceTree_addMergeNode(ancestor,aChildren);
          return ancestor;
        }
        return null;
      }
      return null;
    }
    function sentenceTree_lineString()
    {
      return "M"+sentenceTree_lineData[0][0]+","+sentenceTree_lineData[0][1]+"L"+sentenceTree_lineData[1][0]+","+sentenceTree_lineData[1][1];
    }
    function sentenceTree_mousedown() {
      if (!sentenceTree_mouseIsDown) {
        sentenceTree_mouseIsDown=true;
        var m = d3.mouse(this);
        sentenceTree_lineData[0] =  [m[0]-sentenceTree_margin.left, m[1]-sentenceTree_margin.top];
        sentenceTree_lineData[1] =  [m[0]-sentenceTree_margin.left, m[1]-sentenceTree_margin.top];
        sentenceTree_line = treeSvg.append("line")
            .attr("x1", sentenceTree_lineData[0][0])
            .attr("y1", sentenceTree_lineData[0][1])
            .attr("x2", sentenceTree_lineData[1][0])
            .attr("y2", sentenceTree_lineData[1][1]);
      }
    }

    function sentenceTree_mousemove() {
      if (sentenceTree_mouseIsDown) {
        var m = d3.mouse(this);
        sentenceTree_lineData[1] =  [m[0]-sentenceTree_margin.left, m[1]-sentenceTree_margin.top];
        sentenceTree_line
            .attr("x2", sentenceTree_lineData[1][0])
            .attr("y2", sentenceTree_lineData[1][1]);
        sentenceTree_pathSelection();
      }
    }

    function sentenceTree_mouseup() {
      if (sentenceTree_mouseIsDown)
      {
        var m = d3.mouse(this);
        var selectedSubTrees = sentenceTree_pathSelection();
        sentenceTree_cleanupPathSelection();
        var cutted = sentenceTree_cutEdgeMergeRear(selectedSubTrees);
        if (!cutted) {
          cutted = sentenceTree_cutEdgeMergeFront(selectedSubTrees);
          if (!cutted) {
            var ancestor = sentenceTree_mergeSelectedSubTrees(selectedSubTrees);
            if (ancestor)
              sentenceTree_update(ancestor);
          } else 
            sentenceTree_update(cutted);
        } else
          sentenceTree_update(cutted);
      }
      sentenceTree_mouseIsDown=false;
    }

    function sentenceTree_cleanupPathSelection(){
      sentenceTree_lineData[0] =  [0,0];
      sentenceTree_lineData[1] =  [0,0];
      sentenceTree_line
          .attr("x2", sentenceTree_lineData[1][0])
          .attr("y2", sentenceTree_lineData[1][1]);
      treeSvg.select("line").remove();
      sentenceTree_pathSelection();
    }

    function sentenceTree_pathSelection(){
        var treeLink = treeSvg.selectAll("path.treeLink");
        var selectedSubTrees=new Array();
        treeLink[0].forEach(function(l){
          var intersects = Raphael.pathIntersection(l.attributes[1].value, sentenceTree_lineString());
          if (intersects && intersects.length)
            selectedSubTrees.push(l.__data__.target);
        });
        treeLink.filter(function(d,i){ 
          return (selectedSubTrees.indexOf(d.target)>=0);
          }).attr("style","stroke: #222");
        treeLink.filter(function(d,i){ 
          return !(selectedSubTrees.indexOf(d.target)>=0);
          }).attr("style",null);
        return selectedSubTrees;
    }
    function sentenceTree_update(source) {

      // Compute the new tree layout.
      var treeNodes = sentenceTree.nodes(treeRoot).reverse(),
          treeLinks = sentenceTree.links(treeNodes);

      // Update the nodes…
      var treeNode = treeSvg.selectAll("g.treeNode")
          .data(treeNodes, function(d) { return d.id || (d.id = ++treeNodeID); });

      // Enter any new nodes at the parent's previous position.
      var treeNodeEnter = treeNode.enter().append("g")
          .attr("class", "treeNode")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .style("-webkit-touch-callout","none")
          .style("-webkit-user-select","none")
          .style("-khtml-user-select","none")
          .style("-moz-user-select","none")
          .style("-ms-user-select","none")
          .style("user-select","none")

          .on("click", sentenceTree_click);

      treeNodeEnter.append("circle")
           .style("-webkit-touch-callout","none")
          .style("-webkit-user-select","none")
          .style("-khtml-user-select","none")
          .style("-moz-user-select","none")
          .style("-ms-user-select","none")
          .style("user-select","none")
         .attr("r", 1e-5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      treeNodeEnter.append("text")
          .attr("x", function(d) { return textSize; })
          .attr("dy", ".35em")
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1e-5)
          .style("-webkit-touch-callout","none")
          .style("-webkit-user-select","none")
          .style("-khtml-user-select","none")
          .style("-moz-user-select","none")
          .style("-ms-user-select","none")
          .style("user-select","none")
          .attr("text-anchor", function(d) {
            return "start";
          });

      // Transition nodes to their new position.
      var treeNodeUpdate = treeNode.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      treeNodeUpdate.select("circle")
          .attr("r", 6.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      treeNodeUpdate.select("text")
          .attr("x", function(d) { return textSize; })
          .attr("dy", ".35em")
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1)
          .style("-webkit-touch-callout","none")
          .style("-webkit-user-select","none")
          .style("-khtml-user-select","none")
          .style("-moz-user-select","none")
          .style("-ms-user-select","none")
          .style("user-select","none")
          .attr("text-anchor", function(d) {
            return "start";
          });

      // Transition exiting nodes to the parent's new position.
      var treeNodeExit = treeNode.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();

      treeNodeExit.select("circle")
          .attr("r", 1e-5);

      treeNodeExit.select("text")
          .style("fill-opacity", 1e-5);

      // Update the links…
      var treeLink = treeSvg.selectAll("path.treeLink")
          .data(treeLinks, function(d) { return d.target.id; });

      // Enter any new links at the parent's previous position.
      treeLink.enter().insert("path", "g")
          .attr("class", "treeLink")
          .style("-webkit-touch-callout","none")
          .style("-webkit-user-select","none")
          .style("-khtml-user-select","none")
          .style("-moz-user-select","none")
          .style("-ms-user-select","none")
          .style("user-select","none")

          .attr("d", function(d) {
            var o1 = {x: source.x0, y: source.y0, children:source.children};
            var o2 = {x: source.x0, y: source.y0,
            children:d.target.children, innerX:d.target.innerX,
            innerY:d.target.innerY, finalX:d.target.finalX,
            finalY:d.target.finalY};
            var returnV = diagonal({source: o1, target: o1});
            return returnV;
          });

      // Transition links to their new position.
      treeLink.transition()
          .duration(duration)
          .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      treeLink.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            var o2 = {x: source.x0, y: source.y0,
            children:d.target.children, innerX:d.target.innerX,
            innerY:d.target.innerY, finalX:d.target.finalX,
            finalY:d.target.finalY};
            var returnV = diagonal({source: o, target: o});
            return returnV;
          })
          .remove();

      // Stash the old positions for transition.
      treeNodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Toggle children on click.
    function sentenceTree_click(d) {
      d.collapse();
      sentenceTree_update(d);
    }
    var diagonal = d3.svg.diagonal().projection(function(d) {return [d.y, d.x]; });
    var extendedDiagonal = function(path,idx){
      var source = path.source;
      var target = path.target;
      if (!target.children || target.children.length<=0) {
        var xP = target.finalX==source.x?0:(target.innerX - source.x)*1.0/(target.finalX - source.y)
        var yP = target.finalY==source.y?0:(target.innerY - source.y)*1.0/(target.finalY - source.y)
        var middlePoint ={}
        middlePoint.x = d3.interpolateNumber(source.x,target.x)(xP);
        middlePoint.y = d3.interpolateNumber(source.y,target.y)(yP);
        //target is leaf node
        var d =
        diagonal({"source":source,"target":{x:middlePoint.x,y:middlePoint.y}},idx);
        d = d+"L"+target.y+" "+target.x;
        return d;
      }
      else
        return diagonal(path,idx)
    };

    var sentenceTree_line;
    var sentenceTree_lineData = [];
    var sentenceTree_mouseIsDown=false;

    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation,
           height = 1, width = 1, textSize=10, textMargin=10,
           displayContainer = "body", treeNodeID=0, duration = 750, treeRoot, treeSvg, sentenceTree_margin, alignWords = false; 

    function sentenceTree(d, i) {
      var nodes = hierarchy.call(this, d, i);
      treeRoot = nodes[0];
      function d3_layout_numLeaves(currentRoot){
        d3_layout_treeVisitAfter(currentRoot, function(node, previousSibling){
            if (!node.children || !node.children.length)
              node._numLeaves=1;
            else{
              node._numLeaves=0;
              for (var i=0;i<node.children.length;i++)
                node._numLeaves+=node.children[i]._numLeaves;
            }
          }
        );
      }
      function d3_layout_assignNodeHeights(currentRoot){
        //total height is 1
        var leafIndex=0;
        var totalLeaves = currentRoot._numLeaves;
        var leaveGap = 1.0/(totalLeaves+1);
        d3_layout_treeVisitAfter(currentRoot, function(node, previousSibling){
            if (!node.children || !node.children.length)
            {
              //leaf
              node.x = leaveGap*(leafIndex+1);
              leafIndex++;
            }
            else{
              node.x=0;
              for (var i=0;i<node.children.length;i++)
                node.x+=node.children[i].x;
              node.x = node.x*1.0/node.children.length;
            }
          }
        );
      }
      function d3_layout_collapseName(currentRoot){
        var name = currentRoot.name?currentRoot.name:"";
        var children = currentRoot.children?currentRoot.children:[];
        children.forEach(function(c){
            var cName = d3_layout_collapseName(c);
            if (cName && cName.length)
              name = name.concat(" ").concat(cName);
          }
        );
        return name;
      }
      function d3_layout_collapse(currentRoot) {
        if (currentRoot.children) {
          currentRoot._children = currentRoot.children;
          currentRoot._name = currentRoot.name;
          currentRoot.name = d3_layout_collapseName(currentRoot);
          currentRoot.children = null;
        }
        else if (currentRoot._children)
        {
          currentRoot.children = currentRoot._children;
          currentRoot._children = null;
          currentRoot.name = currentRoot._name;
          currentRoot._name = null;
        }
      }
      var left = d3_layout_treeSearch(treeRoot, d3_layout_treeLeftmost), right = d3_layout_treeSearch(treeRoot, d3_layout_treeRightmost), deep = d3_layout_treeSearch(treeRoot, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_numLeaves(treeRoot);
      d3_layout_assignNodeHeights(treeRoot);
      var textLengthNodeGap = null;
      if (alignWords)
        textLengthNodeGap = sentenceTree_computeDepthGapWordsAlign(treeRoot, width, textMargin, textSize);
      else
        textLengthNodeGap = sentenceTree_computeDepthGap(treeRoot, width, textMargin, textSize);
      d3_layout_treeVisitAfter(treeRoot, function(node) {
        node.x *= height;
        if (alignWords) {
          if (!node.children || !node.children.length) {
            //leaf node
            node.innerX = node.x;
            node.innerY = node.depth * textLengthNodeGap.nodeGap+textMargin;
            node.y = textLengthNodeGap.maxDepth*textLengthNodeGap.nodeGap+textMargin;

            node.finalX = node.x;
            node.finalY = node.y;
          }
          else{
            node.y = node.depth * textLengthNodeGap.nodeGap+textMargin;
          }
        }
        else
          node.y = node.depth * textLengthNodeGap.nodeGap+textMargin;
        node.collapse = function(){d3_layout_collapse(this);};
      } );
      return nodes;
    }

    sentenceTree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return sentenceTree;
    };
    sentenceTree.size = function(x) {
      if (!arguments.length) return [height,width];
      height = x[0];
      width = x[1];
      return sentenceTree;
    };
    sentenceTree.textSize = function(x) {
      if (!arguments.length) return textSize>0 ? textSize : null;
      if (x>0)
        textSize = x;
      return sentenceTree;
    };
    sentenceTree.textMargin = function(x) {
      if (!arguments.length) return textMargin>0 ? textMargin : null;
      if (x>0)
        textMargin = x;
      return sentenceTree;
    };
    sentenceTree.margin = function(x) {
      if (!arguments.length) return sentenceTree_margin;
      sentenceTree_margin =x;
      return sentenceTree;
    }
    sentenceTree.displayContainer = function(x) {
      if (!arguments.length) return displayContainer;
      displayContainer = x;
      return sentenceTree;
    };
    sentenceTree.animationDuration = function(x) {
      if (!arguments.length) return duration;
      duration = x;
      return sentenceTree;
    };
    sentenceTree.show = function() {
      treeSvg = d3.select(displayContainer).append("svg")
        .attr("width", width + sentenceTree_margin.right + sentenceTree_margin.left)
        .attr("height", height + sentenceTree_margin.top + sentenceTree_margin.bottom)
        .style("-webkit-touch-callout","none")
        .style("-webkit-user-select","none")
        .style("-khtml-user-select","none")
        .style("-moz-user-select","none")
        .style("-ms-user-select","none")
        .style("user-select","none")

        .on("mousedown",sentenceTree_mousedown)
        .on("mousemove",sentenceTree_mousemove)
        .on("mouseup",sentenceTree_mouseup)
      .append("g")
        .attr("transform", "translate(" + sentenceTree_margin.left + "," + sentenceTree_margin.top + ")");

      d3.json("/data/sentence.json", function(error, flare) {
        var root = flare;
        root.x0 = height / 2;
        root.y0 = 0;
        sentenceTree.nodes(root);
        root.children.forEach(function(d){ d.collapse();});
        sentenceTree_update(root);
      });

      return sentenceTree;
    };
    sentenceTree.toJson = function(){
      return JSON.stringify(treeRoot, function(key, value){
        var result=undefined;
        if (value && (typeof value === 'object') && (!(value instanceof Array))){
          result={"children":value.children,"name":value.name};
          if (value._children && value._children.length)
            result = {"children":value._children,"name":""};
        } else
          if (key=="children" || key=="name")
            result = value;
        return result;
      });
    };

    return d3_layout_hierarchyRebind(sentenceTree, hierarchy);
  };



  if (typeof define === "function" && define.amd) {
    define(sentenceTree);
  } else if (typeof module === "object" && module.exports) {
    module.exports = sentenceTree;
  } else {
    this.sentenceTree = sentenceTree;
  }
}();
