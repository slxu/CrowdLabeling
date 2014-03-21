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
var currentSelectedSentence;

function initializeTreeSVG(redo) {
  var height = document.getElementById("chartTree").clientHeight-30;
  var width = document.getElementById("chartTree").clientWidth-50;

  if (!initialized) {
    initialized=true;
    sentenceTree = sentenceTree().size([height,
        width]).textSize(16).textMargin(10).displayContainer("#chartTree").margin({top:20,
          bottom:0, left:20,right:0}).animationDuration(750).show();
  }
  if (redo) {
    var nodes ={"children":[]};
    nodes.x0 = height/2;
    nodes.y0=0;
    sentenceTree.nodes(nodes);
    sentenceTree.update(nodes);
  }
}

function sentenceClicked(sentenceIdx) {
  if (currentSelectedSentence != sentenceIdx) {
    initializeTreeSVG(false);
    var height = document.getElementById("chartTree").clientHeight-30;
    var width = document.getElementById("chartTree").clientWidth-50;
   
    var s = sentences[sentenceIdx];
    var root = s.result;
    if (root.x0 == null || root.x0 == undefined) {
      root.x0 = height / 2;
      root.y0 = 0;
    }

    sentenceTree.nodes(root);
    sentenceTree.update(root);
    if (currentSelectedSentence !=null && currentSelectedSentence !=undefined)
      document.getElementById("sentence_"+currentSelectedSentence).className="treeSentence";
    document.getElementById("sentence_"+sentenceIdx).className="treeSentenceSelected";
    currentSelectedSentence = sentenceIdx;
  }
}

function splitSentenceToJson(s) {
  var words = s.trim().split(/\s+/);
  var leaves=new Array();
  words.forEach(function(d){
    leaves.push({"name":d});
  });
  return {"children":leaves};
}

function download(sentenceIdx) {
  if (sentences && sentences[sentenceIdx] && sentences[sentenceIdx].result) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(sentenceTree.toJson(sentences[sentenceIdx].result)));
    pom.setAttribute('download', "sentence#"+sentenceIdx+".json");
    pom.click();
  }
}

function startTreeAnnotation() {
  initializeTreeSVG(true);
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
      ' <div id="sentence_'+idx+'" class="treeSentence">'
      +'  <div onClick="javascript:sentenceClicked('+idx+')" style="vertical-align:middle;display:inline-block;width:20px;margin-right:10px;"> #'+(idx+1)+'. </div>'
      +'  <div onClick="javascript:sentenceClicked('+idx+')" style="vertical-align:middle;display:inline-block;width:'+sentenceWidth+'px;"> '+d+' </div>'
      +'  <div style="vertical-align:middle;display:inline-block;width:20px;margin-left:10px;">' 
      +'    <img src="download.png" height="20px" title="Download the annotated sentence in JSON format." onclick="download('+idx+');"></img>'
      +'  </div>'
      +'</div>';
      idx++;
    });

    display.innerHTML = contents;
  });
}

