var assert = require("assert")
var fs = require("fs");
var BB = require("../build/bluebutton.js");

var composer = require("../lib/composer.js");

describe('Composer module |', function(){
	var bb_json;
	var bb_live;

  before(function(){
  	//loading static JSON
    bb_json = JSON.parse(fs.readFileSync('./test/fixtures/bb.json').toString());

    //loading CCDA and converting to JSON
	var data = fs.readFileSync( "./test/fixtures/CCD.example.xml" ).toString();

	var bb = BB(data);

	bb_live={"demographics":bb.demographics(),
		"allergies":bb.allergies(),
		"encounters":bb.encounters(),
		"immunizations":bb.immunizations(),
		"results":bb.labs(),
		"medications":bb.medications(),
		"problems":bb.problems(),
		"procedures":bb.procedures(),
		"vitals":bb.vitals()
	}
  });	

	it('should return NULL for no object/JSON with data passed', function(){
	  assert.notStrictEqual(undefined, composer(undefined));
	  assert.notStrictEqual(undefined, composer(null));
	  assert.notStrictEqual(undefined, composer(2013));
	})

	it('should return XML/CCDA for proper basic BB.json input', function(){
	  assert.notEqual('', composer(bb_json));
	})

	it('should return XML/CCDA for proper live BB.json input', function(){
	  assert.notEqual('', composer(bb_live));
	})


})