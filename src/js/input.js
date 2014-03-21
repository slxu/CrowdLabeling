var id = 0;
var cluster = null;
var onSpanClick = null;
var onOutputClick = null;

function replace(match) {
  var token = 'token' + id;
  var replace = '<kbd class="custom" draggable="true" contenteditable="false">' + id + '</kbd><span class="tolabel ' + token + '" onclick="onSpanClick()">';
  id++;
  return replace;
}

function onStartClick() {
  var select = document.getElementById("docselect");
  var doc = select.options[select.selectedIndex].value;
  console.log(doc);
  $.get('data/cluster/' + doc + '.html', function(response) {
    var content = response;
    var display = document.getElementById("input");
    var lines = content.trim().split('\n');

    // remove first and last line
    lines.splice(0, 1);
    lines.splice(lines.length - 1, 1);

    id = 0;
    content = lines.join('\n');
    content = content.replace(/<label[^>]*>/g, replace);
    content = content.replace(/<\/label>/g, "</span>");
    // console.log(content);
    display.innerHTML = content;

    cluster = d3.cluster();
    console.log('data/cluster/' + doc +'.json');
    cluster.start('data/cluster/' + doc +'.json');
    onSpanClick = cluster.onSpanClick;
    onOutputClick = cluster.onOutputClick;

    document.getElementById("output_btn").disabled = false;
    document.getElementById("start_btn").disabled = true;
  });
}


var sentences=new Array();
var initialized=false;
var sentenceTree;

function sentenceClicked(sentenceIdx) {
  var height = document.getElementById("chartTree").clientHeight-30;
  var width = document.getElementById("chartTree").clientWidth-50;
 
  if (!initialized) {
    initialized=true;
    sentenceTree = sentenceTree().size([height,
        width]).textSize(16).textMargin(10).displayContainer("#chartTree").margin({top:20,
          bottom:0, left:20,right:0}).animationDuration(750).show();
    document.getElementById("output_btn-tree").disabled = false;
    document.getElementById("start_btn-tree").disabled = true;
  }
  
  var s = sentences[sentenceIdx];
  var root = s.result;
  if (root.x0 == null || root.x0 == undefined) {
    root.x0 = height / 2;
    root.y0 = 0;
  }

  sentenceTree.nodes(root);
  sentenceTree.update(root);
}

function splitSentenceToJson(s) {
  var words = s.trim().split(/\s+/);
  var leaves=new Array();
  words.forEach(function(d){
    leaves.push({"name":d});
  });
  return {"children":leaves};
}

function startTreeAnnotation() {
  var select = document.getElementById("docselectTree");
  var doc = select.options[select.selectedIndex].value;
  $.get(doc, function(response) {
    var display = document.getElementById("inputTree");
    var lines = response.trim().split('\n');
    var contents="";
    var idx=0;
    var width = display.clientWidth;
    var sentenceWidth = width - 20 - 100;

    sentences = new Array();
    lines.forEach(function(d){
      sentences.push({
        "sentence": d,
        "id": idx,
        "result": splitSentenceToJson(d)
      });
      contents+=
      '<div id="sentence_'+idx+'" onClick="javascript:sentenceClicked('+idx+')" class="treeSentence">'
      +'<div style="vertical-align:middle;display:inline-block;width:20px;margin-right:10px;"> #'+(idx+1)+'. </div>'
      +'<div style="vertical-align:middle;display:inline-block;width:'+sentenceWidth+'px;"> '+d+' </div>'
      +'<div style="vertical-align:middle;display:inline-block;width:20px;margin-left:10px;"> <img src="download.png" height="20px"></img> </div>'
      +'</div>';
      idx++;
    });

    display.innerHTML = contents;
  });
}

function stopTreeAnnotation() {
  d3.selectAll("#cluster-svg").data([]).exit().remove();
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
}
