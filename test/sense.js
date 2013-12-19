var assert = require("assert")
var fs = require("fs");

var sense = require("../lib/sense.js");

describe('Sense module |', function(){
	var ccda="";
	var xml="";
	var json="";
	var large_json="";
	var text="";
	var broken_xml="";

  before(function(){
    ccda = fs.readFileSync('./test/fixtures/CCD.example.xml').toString();
    xml = fs.readFileSync('./test/fixtures/empty.xml').toString();
    json = fs.readFileSync('./test/fixtures/example.json').toString();
    large_json = fs.readFileSync('./test/fixtures/large.json').toString();
    text = fs.readFileSync('./test/fixtures/example.txt').toString();
    broken_xml = fs.readFileSync('./test/fixtures/broken.xml').toString();
  });	

	it('should return NULL for no string with data passed', function(){
	  assert.notStrictEqual(undefined, sense(undefined));
	  assert.notStrictEqual(undefined, sense(null));
	  assert.notStrictEqual(undefined, sense(2013));
	})

	it('should return CCDA for proper CCDA/XML input', function(){
	  assert.equal('ccda', sense(ccda));
	})

	it('should return XML for proper basic XML input', function(){
	  assert.equal('xml', sense(xml));
	})

	it('should return JSON for proper JSON input', function(){
	  assert.equal('json', sense(json));
	  assert.equal('json', sense(large_json));
	})

	it('should return UNKNOWN for text input', function(){
	  assert.equal('unknown', sense(text));
	})

	xit('should return UNKNOWN for broken XML input', function(){
	  assert.equal('unknown', sense(broken_xml));
	})

})