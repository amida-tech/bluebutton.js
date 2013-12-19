/*
 * sense.js - Determining file content type e.g. CCDA or C32 or BB.json/JSON or text/other formats.
 */
 

"use strict";

var jsdom = require("jsdom");

var sense = function(data){
  	//data must be a string
    if (!data || typeof(data) !== "string") {
    	//TODO: throw a proper error here
      	return null;
    }

	if (data.indexOf("<?xml") != -1) {
		//parse xml object...
	    var xml = jsdom.jsdom(data, jsdom.level(1, "core"));
	    var root =xml.documentElement;

	    var children = root.children;
	    
	    for(var i=0; i<children.length; i++){
	    	var child = children[i];
	    	if ( child.nodeName=="TEMPLATEID" && child.nodeType==child.ELEMENT_NODE) {
	    		var id = child.getAttribute("root");

				if (id=="2.16.840.1.113883.10.20.22.1.2") return "ccda";
				if (id=="2.16.840.1.113883.3.88.11.32.1") return "c32";
	    	}
	    }
		return "xml";
	}
	else {
	   //parse json or determine if text object...
		try {
    		JSON.parse(data); // {}
    		return "json";
		} catch (e) {
		    //console.error("Parsing error:", e); 
		    return "unknown";
		}
	}

	return "unknown";
};

module.exports = sense;