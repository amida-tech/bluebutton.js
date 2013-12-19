/*
 * composer.js - Generates CCDA representation from BB.json.
 */
 

"use strict";

var ejs=require('ejs');
var fs=require('fs');
var jsdom = require("jsdom");

var composer = function(data){
  	//data must be an object/JSON
    if (!data || typeof(data)!="object") {
    	//TODO: throw a proper error here
      	return null;
    }

    //console.log("composer");

	var template = fs.readFileSync( "./lib/ccda_composer/main.ejs" ).toString('utf-8');
    //console.log("data: "+JSON.stringify(data, null, 4));

        try {
        	var filename=__dirname + '/ccda_composer/main.ejs';
        	var xml=ejs.render(template, {"filename":filename, bb:data, "test":"blah"});
            //console.log(xml);
            return xml;
        } catch (e) {
            console.log("CCDA generation failed");
            console.log(e);
        }

	return "";
};

module.exports = composer;