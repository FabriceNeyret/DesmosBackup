// ==UserScript==
// @name        DesmosBackup
// @namespace   https://github.com/FabriceNeyret/DesmosBackup
// @version     1.5.4
// @description Backup all your Desmos graphs as a json file
// @author      Fabrice Neyret
// @match       https://*.desmos.com/calculator*
// @match       https://*.desmos.com/3d*
// @run-at      document-start
// @grant       GM_addStyle
// @downloadURL https://github.com/FabriceNeyret/DesmosBackup/raw/main/desmosbackup.user.js
// @updateURL   https://github.com/FabriceNeyret/DesmosBackup/raw/main/desmosbackup.user.js  
// ==/UserScript==
//              https://github.com/FabriceNeyret/DesmosBackup/blob/main/demosbackup.user.js

// changelog:
//   1.5.3      fix after new change in Desmos Calc structure.
//   1.5        protection against DesModder freezing Desmos start script
//   1.4        structure new place found. Independance back.
//   1.3        fix after Desmos Calc is now closured. Now rely on DesModder util.
//   1.2        change file type to json
//   1.1        add script version in json to help fureu loader
//   1.0        save a json text file with all your Desmos graphs, + dump on a new tab

/* DesmosGraph TamperMonkey / GreaseMonkey script by MathEnthusiast314 & Fabrice Neyret */
// script structure inspired by https://github.com/baz1/DesmosToSVG

function PageScript() {
  window.DesmosBackup = new Object();

  // custom stuff here
  DesmosBackup.getBackup = async function() {

    // ------------ inspired from MathEnthusiast314's script from https://discord.com/channels/655972529030037504/711425523573850142/926659138933624902
    
    var t = Calc._calc.globalHotkeys.shellController.mygraphsController.graphsController.__savedGraphs.data; // yet another change.  ( thanks sea-saw )
 // var t = Calc._calc.globalHotkeys.mygraphsController.graphsController.__savedGraphs.data; // yet another change.  ( thanks sam-lb )
 // var t = Calc._calc.globalHotkeys.mygraphsController.graphsController.__savedGraphs; // structure found again. ( thanks Naitronbomb ! )
 // var t = DesModder.controller.topLevelComponents.graphsController.__savedGraphs;     // since 09/2022 the Calc structure is no longer exposed. Now rely on DesModder util.
 // var t = Calc.myGraphsWrapper._childViews[0].props.graphsController().__savedGraphs; // structure containing all user graph informations. ( thanks fireflame241 ! )
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
    header = '{ \n  "version": "1.5.4",\n  "userName": "' + name + '",\n  "date": "' + new Date() + '",\n  "numGraphs": "' + t.length + '",\n  "graphs:": [ \n\n'; // Fabrice: following Shadertoy "export all" format
 // download( t = header + JSON.stringify(GraphsList) + '\n  ]\n}\n', "data.txt", "text/plain; charset=UTF-8");
    download( t = header + GraphsList + '\n  ]\n}\n', "DesmosBackup.json", "text/plain; charset=UTF-8");


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

  function pollForValue(func) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const val = func();
        if (val !== null && val !== undefined) {
          clearInterval(interval);
          resolve(val);
        }
      }, 100);
    });
  }
  
  function init() {  

    var spanObj = document.createElement("SPAN");                                       // creates button
    DesmosBackup.button = document.createElement("INPUT");
    DesmosBackup.button.type = "button";
    DesmosBackup.button.disabled = false; // true;
    DesmosBackup.button.addEventListener("click", DesmosBackup.getBackup, false);
    DesmosBackup.button.value = "Backup all Graphs";

    spanObj.appendChild(DesmosBackup.button);

    DesmosBackup.graph = document.getElementsByClassName("dcg-graph-inner");           // attach it to the top bar
// if (DesmosBackup.graph.length != 1) {
//    console.log("GM_DesmosBackup: Graph not found, or several found.");
//    return;
//  }
    if (DesmosBackup.graph.length < 1) {                                              // strangely, 3d graphs have two.
      console.log("GM_DesmosBackup: Graph not found.");
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

  pollForValue(() => window.Calc).then(() => {  // protection against DesModder freezing Desmos start script
        console.log("Calc has been loaded");
        init();
      });
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
