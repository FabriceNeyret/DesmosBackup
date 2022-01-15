// ==UserScript==
// @name        DesmosBackup
// @namespace   https://github.com/FabriceNeyret/DesmosBackup
// @version     1.1
// @description Backup all your Desmos graphs as a json file
// @author      Fabrice Neyret
// @include     https://www.desmos.com/calculator*
// @match       https://*.desmos.com/calculator*
// @run-at      document-start
// @grant       GM_addStyle
// @downloadURL https://github.com/FabriceNeyret/DesmosBackup/edit/main/demosbackup.user.js
// @updateURL   https://github.com/FabriceNeyret/DesmosBackup/edit/main/demosbackup.user.js
// ==/UserScript==

// changelog:
//   1.1        add script version in json to help fureu loader
//   1.0        save a json text file with all your Desmos graphs, + dump on a new tab

/* DesmosGraph TamperMonkey / GreaseMonkey script by MathEnthusiast314 & Fabrice Neyret */
// script structure inspired by https://github.com/baz1/DesmosToSVG

function PageScript() {
  window.DesmosBackup = new Object();

  // custom stuff here
  DesmosBackup.getBackup = async function() {

    // ------------ inspired from MathEnthusiast314's script from https://discord.com/channels/655972529030037504/711425523573850142/926659138933624902
    
//  t = ((Calc.myGraphsWrapper._childViews[0].props.graphsController().__savedGraphs).map(i => i.hash))
    t = Calc.myGraphsWrapper._childViews[0].props.graphsController().__savedGraphs;
    GraphsList = [];
    async function getGraphJSON(hash,i) {
        try {
            json = await (
                await fetch(`https://www.desmos.com/calculator/${hash}`, {
                    headers: { Accept: "application/json",  },
                })
            ).json();
        //  GraphsList.push(json);
        //  GraphsList.push("    "+JSON.stringify(json)+"\n\n"); // problem: random order
            GraphsList[i] = "    "+JSON.stringify(json)+"\n\n";   
        } catch (err) {}
    }
   //const promises = t.map(getGraphJSON); 
    const promises = t.map( (v,i) => getGraphJSON(v.hash,i) );              // asynchroneous filling of the array
    await Promise.all(promises);                                            // wait for completion
    
  //console.log(GraphsList);                                                // save the JSON file
    name = JSON.parse(document.getElementsByTagName('html')[0].children[1].attributes[0].textContent).user.name;
    header = '{ \n  "version": "1.1",\n "userName": "' + name + '",\n  "date": "' + new Date() + '",\n  "numGraphs": "' + t.length + '",\n  "graphs:": [ \n\n'; // Fabrice: following Shadertoy "export all" format
 // download( t = header + JSON.stringify(GraphsList) + '\n  ]\n}\n', "data.txt", "text/plain; charset=UTF-8");
    download( t = header + GraphsList + '\n  ]\n}\n', "DesmosBackup.txt", "text/plain; charset=UTF-8");


    // ......................
    
  //window.open().document.write(t);                                        // creates new tab with backup (for verification)
    window.open().document.write("<html><head><title>DesmosGraph Backup</title></head><body>"+t.replace(/\n/g, '</br>')+"</body>+</html>");  // creates new tab with backup (for verification)
  //download( t, "DesmosBackup.json", "text/plain; charset=UTF-8" );        // download the file
  };

function download(data, filename, type) { // from https://github.com/SlimRunner/desmos-scripts-addons/blob/master/graph-archival-script/
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
          url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

  var main = function() {

    var spanObj = document.createElement("SPAN");                                       // creates button
    DesmosBackup.button = document.createElement("INPUT");
    DesmosBackup.button.type = "button";
    DesmosBackup.button.disabled = false; // true;
    DesmosBackup.button.addEventListener("click", DesmosBackup.getBackup, false);
    DesmosBackup.button.value = "Backup all Graphs";

    spanObj.appendChild(DesmosBackup.button);

    DesmosBackup.graph = document.getElementsByClassName("dcg-graph-inner");           // attach it to the top bar
    if (DesmosBackup.graph.length != 1) {
      console.log("GM_DesmosBackup: Graph not found, or several found.");
      return;
    }
    DesmosBackup.graph = DesmosBackup.graph[0];
    var floaters = document.getElementsByClassName("align-right-container");
    if (floaters.length != 1) {
      console.log("GM_DesmosBackup: Floaters object not found, or several found.");
      return;
    }
    floaters[0].appendChild(spanObj);
    console.log("GM_DesmosBackup: (Info) Button added.");

  }

  setTimeout(main, 3000);
}

function AddJSNode(fn, url) {
  var scriptNode = document.createElement("script");
  scriptNode.type = "text/javascript";
  if (fn) scriptNode.textContent = "(" + fn.toString() + ")();";
  if (url) scriptNode.src = url;
  var target = document.getElementsByTagName ('head')[0] ||
      document.body || document.documentElement;
  target.appendChild(scriptNode);
}

window.addEventListener("DOMContentLoaded", function() {
//AddJSNode(null, "exernalJStoInclude.js");
  AddJSNode(PageScript, null);
}, false);
