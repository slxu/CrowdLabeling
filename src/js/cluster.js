

(function(){
d3.cluster = function(){
  var cluster = {},
      nodeData = [],
      linkData = [],
      groupData = [],
      idToGroup = {},
      nodeBundle = null,
      force = null;

  var w = document.getElementById('chart').clientWidth - 10,
      h = document.getElementById('chart').clientHeight - 10,
      ratio = w / h,
      fill = d3.scale.category10();

  var cX = w / 2,
      cY = h / 2,
      marginLeft = 50,
      marginRight = 50,
      marginTop = 50,
      marginBottom = 50,
      nodeRadius = 12,
      gravity = .03,
      kForceX = w / 12,
      kForceY = h / 7;

  var nodeDefaultColor = '#aaa',
      spanDefaultColor = '#888';

  var svg = null,
      inputDiv = document.getElementById('input'),
      chartDiv = document.getElementById('chart');

  cluster.start = function(filename) {
    d3.json(filename, function(obj) {
      nodeData = obj['items'];
      initNode();

      chartDiv.innerHTML = "";
      d3.selectAll("svg").data([]).exit().remove();

      svg = d3.select("#chart").append("svg")
        .attr("width", w)
        .attr("height", h);

      svg.style("opacity", 1e-6)
        .transition()
          .duration(1000)
          .style("opacity", 1);

      force = d3.layout.force()
        .nodes(nodeData)
        .links([])
        .size([w, h])
        .gravity(gravity)
        .start();

      var drag = d3.behavior.drag()
        .origin(d3.d3_identity)
        .on("dragstart.force", dragstart)
        .on("drag.force", dragmove)
        .on("dragend.force", dragend);

      nodeBundle = svg.selectAll("g.bundle")
          .data(nodeData)
        .enter().append("g")
          // .attr("class", function(d) { return "bundle " + "token" + (d.index+1); })
          .attr("class", "bundle")
          .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          })
          .call(drag);

      nodeBundle.append("circle")
        .attr("class", "shadow")
        .attr("r", nodeRadius * 2.5)
          .style("fill", 'red')
          .style("opacity", .2)
          .style("visibility", "hidden");

      nodeBundle.append("circle")
        .attr("class", function(d) { return "node " + "token" + d.index; })
        .attr("r", nodeRadius)
        .style("fill", nodeFill)
        .style("stroke", function(d, i) { return d3.rgb(d.groupId).darker(2); })
        .style("stroke-width", 1.5)
        .append("title")
          .text(function(d) { return d.fullText; });

      nodeBundle.append("text")
        .attr("class", "abbr")
        .attr("text-anchor", "middle")
        .attr("y", (nodeRadius + 10) + "px")
        .attr("fill", "#000")
        .attr("stroke", "#000")
        .attr("stroke-width", ".5px")
        .attr("font-size", "11px")
        .text(function(d) { return d.abbrText; })
        .style("visibility", "hidden");

      nodeBundle.append("text")
        .attr("class", function(d) { return "token" + d.index; })
        .attr("text-anchor", "middle")
        .attr("y", "5px")
        .attr("fill", indexFill)
        .attr("stroke", indexFill)
        .attr("stroke-width", ".2px")
        .attr("font-size", "15px")
        .text(function(d) { return d.index + 1; })
        .append("title")
          .text(function(d) { return d.fullText; });

      force.on("tick", function(e) {
        // Push different nodes in different directions for clustering.
        nodeData.forEach(function(o, i) {
          var group = idToGroup[o.groupId];
          var forceX = (group.cx - cX) / kForceX;
          var forceY = (group.cy - cY) / kForceY;
          o.x += forceX * e.alpha;
          o.y += forceY * e.alpha;
        });

        updateTempLink();
        updateLink();
        updateNodeBundle();
        updateGroupShadow();
      });
    });
  }

  cluster.onSpanClick = function() {
    var span = window.event.srcElement;
    var className = span.className.split(" ")[1];
    var index = parseInt(className.substring(5, className.length));

    if (clickSpan != index) {
      svg.select("circle.token" + index).style("fill", "red");
      d3.select("span.token" + index).style("background-color", "red");
      if (clickSpan != null) {
        svg.select("circle.token" + clickSpan).style("fill", nodeFill);
        d3.select("span.token" + clickSpan).style("background-color", spanFill(nodeData[clickSpan]));
      }
      clickSpan = index;  
    } else {
      svg.select("circle.token" + clickSpan).style("fill", nodeFill);
      d3.select("span.token" + clickSpan).style("background-color", spanFill(nodeData[clickSpan]));
      clickSpan = null;
    }
  };

  cluster.onOutputClick = function() {
    d3.selectAll("svg").data([]).exit().remove();
    var index = 0;
    groupData.forEach(function(g) {
      if (g.nodes.length == 1)
        return;
      index++;
      chartDiv.innerHTML += "Group " + index + ":";
      g.nodes.forEach(function(n) {
        chartDiv.innerHTML += " " + n.id;
      });
      chartDiv.innerHTML += "<br/>";
    });

    document.getElementById("output_btn").disabled = true;
    document.getElementById("start_btn").disabled = false;
  };

  function initNode(){
    // init node position
    var row = Math.floor(Math.sqrt(nodeData.length / ratio)) + 1;
    var column = Math.floor(row * ratio) + 1;
    console.log(row + 'x' + column);
    var index = 0;
    var margin = 100;
    var xGap = (w-margin*2)/column;
    var yGap = (h-margin*2)/row;
    for (var i = 0; i < row; i++) {
      for (var j = 0; j < column; j++) {
        var node = nodeData[index];
        node.x = 100 + j * xGap;
        node.y = 100 + i * yGap;
        node.links = [];
        // node.index = index + 1;
        // node.abbrText = "token" + (index+1);
        createNewGroup([node]);

        index ++;
        // console.log(index);
        if (index == nodeData.length)
          return;
      }
    }
  }

  var clickSpan = null;
  var dragNode = null;
  var selectedNode = null;

  function dragmove(d) {
    d.px = d3.event.x, d.py = d3.event.y;
    force.resume();
    updateSelectedNode(d);
  }

  function dragstart(d) {
    d.fixed |= 2;
    dragNode = d;
    selectedNode = null;
    // removeElement(idToGroup[d.groupId].nodes, d);

    var group = idToGroup[d.groupId];

    svg.selectAll("circle.shadow").style("visibility", "visible");
    svg.selectAll("text.abbr").style("visibility", "visible");

    var sel = d3.select("span.token" + d.index)
      .style("background-color", "red");
    var span = sel[0][0];
    var offsetPos = span.offsetTop - inputDiv.offsetTop;
    if (inputDiv.scrollTop > offsetPos ||
        inputDiv.scrollTop+inputDiv.offsetHeight < offsetPos)
      inputDiv.scrollTop = offsetPos - 50;
  }

  function dragend(d) {
    d.fixed &= ~6;
    
    svg.selectAll("circle.shadow").style("visibility", "hidden");
    svg.selectAll("text.abbr").style("visibility", "hidden");

    var toConnect = selectedNode;
    dragNode = null;
    selectedNode = null;
    updateTempLink(); // will remove temp links

    var oldGroup = idToGroup[d.groupId];
    var newGroup = null;
    if (toConnect != null) {
      if (toConnect.groupId != d.groupId) {
        newGroup = idToGroup[toConnect.groupId];
        var connected = connectedComponent(d);
        connected.forEach(function(v) {
          v.groupId = newGroup.id;
          newGroup.nodes.push(v);
          removeElement(oldGroup.nodes, v);
        });
      } 
      addLink(d, toConnect);
    }

    if (oldGroup.nodes.length == 0)
      removeGroup(oldGroup);
    else {
      oldGroup.updateCenter();
      updateGroupNodeColor(oldGroup);
    }

    if (newGroup != null) {
      if (newGroup.colorId == null && oldGroup.nodes.length == 0 && oldGroup.colorId != null)
        newGroup.setColorId(oldGroup.colorId);
      updateGroupNodeColor(newGroup);
    }
  }

  function updateSelectedNode(v) {
    var candidate = null;
    var newSelectedNode = null;
    var minDist = w * w;
    for (var i = 0; i < nodeData.length; i++) {
      var node = nodeData[i];
      if (v == node)
        continue;
      var dist = (v.x - node.x)*(v.x - node.x) + (v.y - node.y)*(v.y - node.y);
      if (dist < minDist) {
        minDist = dist;
        candidate = node;
      } 
    }

    if (minDist <= 20*nodeRadius*nodeRadius)
      newSelectedNode = candidate;

    if (selectedNode != newSelectedNode) {
      if (newSelectedNode != null) {
        d3.select("span.token" + newSelectedNode.index)
          .style("background-color", "red");
      }
      if (selectedNode != null) {
        d3.select("span.token" + selectedNode.index)
          .style("background-color", spanFill(selectedNode));
      }
      selectedNode = newSelectedNode;
    }
  }

  function updateGroupNodeColor(group) {
    group.nodes.forEach(function(d) {
      svg.select("circle.token" + d.index).style("fill", nodeFill);
      svg.select("text.token" + d.index)
        .attr("fill", indexFill)
        .attr("stroke", indexFill);
      d3.select("span.token" + d.index)
        .style("background-color", spanFill(d));
    });
  }

  function updateNodeBundle() {
    nodeBundle
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
  }

  function updateTempLink() {
    var data = [];
    if (dragNode != null && selectedNode != null) {
      data = [{
        source: dragNode,
        target: selectedNode
      }];
    }
    var templink = svg.selectAll("path.templink")
        .data(data)
        .attr("d", linkPath);
    templink.enter().insert("path", "g")
      .attr("class", "templink");
    templink.exit().remove();
  }

  function updateLink() {
    var link = svg.selectAll("path.link")
      .data(linkData)
        .attr("d", linkPath);

    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", linkPath)
      .on("click", removeLink);

    link.exit().remove();
  }

  function updateGroupShadow() {
    var groupShadow = svg.selectAll("path.group")
      .data(groupData.filter(function (d) { return d.nodes.length > 1; }))
      .attr("d", function (d) { return d.groupPath(); });

    groupShadow.enter().insert("path", ".link")
      .attr("class", "group")
      .attr("d", function (d) { return d.groupPath(); })
      .style("fill", groupFill)
      .style("stroke", groupFill)
      .style("stroke-width", 40)
      .style("stroke-linejoin", "round")
      .style("opacity", .2);

    groupShadow.exit().remove();
  }

  function addLink(src, dst) {
    var link = {source: src, target: dst}
    linkData.push(link);
    src.links.push(link);
    dst.links.push(link);
  }

  function removeLink(d) {
    removeElement(linkData, d);
    var src = d.source;
    var dst = d.target;
    removeElement(src.links, d);
    removeElement(dst.links, d);
    svg.selectAll("path.link")
      .data(linkData)
        .exit().remove();

    var group = idToGroup[src.groupId];
    var srcConnected = connectedComponent(src);
    var dstConnected = connectedComponent(dst);

    if (!(src in dstConnected)) {
      var splitOut;
      if (srcConnected.length >= dstConnected.length)
        splitOut = dstConnected;
      else 
        splitOut = srcConnected;
      
      var newGroup = createNewGroup(splitOut);
      splitOut.forEach(function(v) {
        removeElement(group.nodes, v);
      });

      group.updateCenter();
      newGroup.updateCenter();
      
      updateGroupNodeColor(group);
      updateGroupNodeColor(newGroup);

      updateGroupShadow();
      updateLink();
      updateNodeBundle();
    }
  }

  function linkPath(d) {
    return "M" + d.source.x + "," + d.source.y
      + "L" + d.target.x + "," + d.target.y;
  }

  function groupFill(group) { 
    var colorId = group.getColorId();
    if (colorId == -1)
      return 'white';
    else
      return fill(colorId); 
  }

  function nodeFill(node) {
    var group = idToGroup[node.groupId];
    var colorId = group.getColorId();
    if (colorId == -1) {
      return nodeDefaultColor;
    } else {
      return fill(colorId);
    }
  }

  function spanFill(node) {
    var group = idToGroup[node.groupId];
    var colorId = group.getColorId();
    if (colorId == -1)
      return spanDefaultColor;
    else
      return fill(colorId);
  }

  function indexFill(node) {
    var group = idToGroup[node.groupId];
    var colorId = group.getColorId();
    if (colorId == -1)
      return '#000';
    else
      return '#fff';
  }

  function removeElement(arr, element) {
    var i = 0;
    for (; i < arr.length; i++)
      if (arr[i] == element)
        break;
    if (i < arr.length)
      arr.splice(i, 1);
  }

  function createNewGroup(nodes) {
    var id = 0;
    while (true) {
      if (! (id in idToGroup))
        break;
      id += 1;
    }

    var group = Group(nodes, id);
    groupData.push(group);
    idToGroup[id] = group;
    
    return group;
  }

  function removeGroup(g) {
    removeElement(groupData, g);
    delete idToGroup[g.id];
    if (g.colorId != null)
      delete colors[g.colorId];
    console.log('remove group ' + g.id);
  }

  var colors = {};
  var Group = function(nodes, id) {
    var group = {};
    group.nodes = nodes;
    group.id = id;

    group.cx = 0;
    group.cy = 0;
    nodes.forEach(function(d) {
      group.cx += d.x;
      group.cy += d.y;
      d.groupId = id;
    });
    group.cx /= nodes.length;
    group.cy /= nodes.length;

    group.colorId = null;
    group.getColorId = function() {
      if (group.nodes.length < 2) {
        if (group.colorId != null) {
          delete colors[group.colorId];
          group.colorId = null;
        }
        return -1;
      }

      if (group.colorId != null)
        return group.colorId;

      for (var i = 0; i < 10; i++)
        if (!(i in colors)) {
          colors[i] = true;
          group.colorId = i;
          // console.log("assign color: " + i);
          return i;
        }
      if (i == 10) {
        i = Math.floor(Math.random() * 10) % 10;
        group.colorId = i;
        // console.log("assign color: " + i);
        return i;
      }
    };
    group.setColorId = function(c) {
      group.colorId = c;
      colors[c] = true;
    }

    group.groupPath = function() { 
      return "M" + group.convexhull().join("L") + "Z"; 
    }

    group.convexhull = function() {
      nodeArr = [];
      if (group.nodes.length == 2) {
        v1 = group.nodes[0];
        v2 = group.nodes[1];
        r = 0.1;
        nodeArr.push([v1.x+r, v1.y+r])
        nodeArr.push([v1.x+r, v1.y-r])
        nodeArr.push([v1.x-r, v1.y+r])
        nodeArr.push([v1.x-r, v1.y-r])
        nodeArr.push([v2.x+r, v2.y+r])
        nodeArr.push([v2.x+r, v2.y-r])
        nodeArr.push([v2.x-r, v2.y+r])
        nodeArr.push([v2.x-r, v2.y-r])
      } else {
        nodeArr = group.nodes.map(function(v) { return [v.x, v.y]; });
      }
      return d3.geom.hull(nodeArr);
    };

    group.boundingBox = function boundingBox() {
      var box = {};
      if (group.nodes.length == 1) {
        var v = group.nodes[0];
        box.left = v.x - nodeRadius - 10;
        box.right = v.x + nodeRadius + 10;
        box.top = v.y - nodeRadius - 10;
        box.bottom = v.y + nodeRadius + 10;
      } else {
        convex = group.convexhull();
        box.left = convex[0][0];
        box.right = convex[0][0];
        box.top = convex[0][1];
        box.bottom = convex[0][1];
        convex.forEach(function(d) {
          if (d[0] < box.left)
            box.left = d[0];
          if (d[0] > box.right)
            box.right = d[0];
          if (d[1] > box.top)
            box.top = d[1];
          if (d[1] < box.bottom)
            box.bottom = d[1];
        });
      }
      box.diameter = Math.max(box.right - box.left, box.bottom - box.top);
      return box;
    };

    group.updateCenter = function() {
      group.cx = 0;
      group.cy = 0;
      group.nodes.forEach(function(n) {
        group.cx += n.x;
        group.cy += n.y;
      });
      group.cx /= group.nodes.length;
      group.cy /= group.nodes.length;
      var box = group.boundingBox();
      if (box.left <= marginLeft)
        group.cx = marginLeft + box.diameter/2;
      else if (box.right >= w - marginRight)
        group.cx = w - marginRight - box.diameter/2;
      if (box.top <= marginTop)
        group.cy = marginTop + box.diameter/2;
      else if (box.bottom >= h - marginBottom) 
        group.cy = h - marginBottom - box.diameter/2;
    }

    return group;
  };

  function connectedComponent(v) {
    var component = [v];
    var visited = {};
    visited[v.id] = true;
    var open = 0;
    var closed = 1;
    while (open < closed) {
      var tmp = closed;
      for (; open < tmp; open++) {
        var node = component[open];
        for (var i = 0; i < node.links.length; i++) {
          var l = node.links[i];
          if (!(l.source.id in visited)) {
            component.push(l.source);
            visited[l.source.id] = true;
            closed ++;
          } else if (!(l.target.id in visited)) {
            component.push(l.target);
            visited[l.target.id] = true;
            closed ++;
          }
        }
      }
    }
    return component;
  }

  return cluster;
};
})();