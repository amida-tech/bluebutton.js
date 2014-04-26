(function (root, factory) {

        if (typeof exports === 'object') {
            module.exports = factory();
        }
        else if (typeof define === 'function' && define.amd) {
            define(factory);
        }
        else {
            root.BlueButton = factory();
        }

    }(this, function () {

        /* BlueButton.js -- 0.1.0 */

/*
 * core.js - Essential and shared functionality.
 */

/* exported Core */
var Core = (function () {

  // Properties
  ///////////////////////////

  // Private Methods
  ///////////////////////////

  // Public Methods
  ///////////////////////////

  /*
   * Parses an HL7 date in String form and creates a new Date object.
   *
   * TODO: CCDA dates can be in form:
   *   <effectiveTime value="20130703094812"/>
   * ...or:
   *   <effectiveTime>
   *     <low value="19630617120000"/>
   *     <high value="20110207100000"/>
   *   </effectiveTime>
   * When latter, parseDate will not be given type `String`, but `null` and
   * log the error "date is not a string".
   */
  var parseDate = function (str) {
    if (!str || typeof str !== "string") {
      // console.log("Error: date is not a string");
      return null;
    }
    var year = str.substr(0, 4);
    // months start at 0, because why not
    var month = parseInt(str.substr(4, 2), 10) - 1;
    var day = str.substr(6, 2);

    var _date = new Date(year, month, day);
    var _userOffset = _date.getTimezoneOffset()*60000;
    //console.log(new Date(_date-_userOffset));
    //console.log(_date);
    //console.log("/n");

    return new Date(_date-_userOffset);

    //return new Date(year, month, day);
  };

  /*
   * Removes all `null` properties from an object.
   */
  var trim = function (o) {
    var y;
    for (var x in o) {
      if (o.hasOwnProperty(x)) {
        y = o[x];
        // if (y === null || (y instanceof Object && Object.keys(y).length == 0)) {
        if (y === null) {
          delete o[x];
        }
        if (y instanceof Object) y = trim(y);
      }
    }
    return o;
  };

  // Init
  ///////////////////////////

  // Reveal public methods
  return {
    parseDate: parseDate,
    trim: trim
  };

})();
;

/*
 * xml.js - XML parsing functions.
 */

/* exported XML */
var XML = (function () {
  
  // Private Methods
  ///////////////////////////
  
  /*
   * A function used to wrap DOM elements in an object so methods can be added
   * to the element object. IE8 does not allow methods to be added directly to
   * DOM objects.
   */
  var wrapElement = function (el) {
    function wrapElementHelper(currentEl) {
      return {
        el: currentEl,
        template: template,
        tag: tag,
        elsByTag: elsByTag,
        attr: attr,
        val: val,
        isEmpty: isEmpty
      };
    }
    
    // el is an array of elements
    if (el.length) {
      var els = [];
      for (var i = 0; i < el.length; i++) {
        els.push(wrapElementHelper(el[i]));
      }
      return els;
    
    // el is a single element
    } else {
      return wrapElementHelper(el);
    }
  };
  
  
  /*
   * Find element by tag name, then attribute value.
   */
  var tagAttrVal = function (el, tag, attr, value) {
    el = el.getElementsByTagName(tag);
    for (var i = 0; i < el.length; i++) {
      if (el[i].getAttribute(attr) === value) {
        return el[i];
      }
    }
  };
  
  
  /*
   * Search for a template ID, and return its parent element.
   * Example:
   *   <templateId root="2.16.840.1.113883.10.20.22.2.17"/>
   * Can be found using:
   *   el = dom.template('2.16.840.1.113883.10.20.22.2.17');
   */
  var template = function (templateId) {
    var el = tagAttrVal(this.el, 'templateId', 'root', templateId);
    if (!el) {
      return emptyEl();
    } else {
      return wrapElement(el.parentNode);
    }
  };
  
  
  /*
   * Search for the first occurrence of an element by tag name.
   */
  var tag = function (tag) {
    var el = this.el.getElementsByTagName(tag)[0];
    if (!el) {
      return emptyEl();
    } else {
      return wrapElement(el);
    }
  };
  
  
  /*
   * Search for all elements by tag name.
   */
  var elsByTag = function (tag) {
    return wrapElement(this.el.getElementsByTagName(tag));
  };
  
  
  /*
   * Retrieve the element's attribute value. Example:
   *   value = el.attr('displayName');
   */
  var attr = function (attr) {
    if (!this.el) { return null; }
    return this.el.getAttribute(attr);
  };
  
  
  /*
   * Retrieve the element's value. For example, if the element is:
   *   <city>Madison</city>
   * Use:
   *   value = el.tag('city').val();
   */
  var val = function () {
    if (!this.el) { return null; }
    try {
      return this.el.childNodes[0].nodeValue;
    } catch (e) {
      return null;
    }
  };
  
  
  /*
   * Creates and returns an empty DOM element with tag name "empty":
   *   <empty></empty>
   */
  var emptyEl = function () {
    var el = doc.createElement('empty');
    return wrapElement(el);
  };
  
  
  /*
   * Determines if the element is empty, i.e.:
   *   <empty></empty>
   * This element is created by function `emptyEL`.
   */
  var isEmpty = function () {
    if (this.el.tagName.toLowerCase() === 'empty') {
      return true;
    } else {
      return false;
    }
  };
  
  
  // Public Methods
  ///////////////////////////
  
  /*
   * Cross-browser XML parsing supporting IE8+ and Node.js.
   */
  var parse = function (data) {
    // XML data must be a string
    if (!data || typeof data !== "string") {
      console.log("BB Error: XML data is not a string");
      return null;
    }
    
    var xml;
    
    // Node
    if (isNode) {
      xml = jsdom.jsdom(data, jsdom.level(1, "core"));
      
    // Browser
    } else {
      
      // Standard parser
      if (window.DOMParser) {
        var parser = new DOMParser();
        xml = parser.parseFromString(data, "text/xml");
        
      // IE
      } else {
        try {
          xml = new ActiveXObject("Microsoft.XMLDOM");
          xml.async = "false";
          xml.loadXML(data);
        } catch (e) {
          console.log("BB ActiveX Exception: Could not parse XML");
        }
      }
    }
    
    if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
      console.log("BB Error: Could not parse XML");
      return null;
    }
    
    return wrapElement(xml);
  };
  
  
  // Init
  ///////////////////////////
  
  // Establish the root object, `window` in the browser, or `global` in Node.
  var root = this,
      jsdom,
      isNode = false,
      doc = root.document; // Will be `undefined` if we're in Node

  // Check if we're in Node. If so, pull in `jsdom` so we can simulate the DOM.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      isNode = true;
      jsdom = require("jsdom");
      doc = new (jsdom.level(1, "core").Document)();
    }
  }
  
  
  // Reveal public methods
  return {
    parse: parse
  };
  
})();
;

/*
 * codes.js
 */

/* exported Codes */
var Codes = (function () {
  
  // Properties
  ///////////////////////////
  
  // Private Methods
  ///////////////////////////
  
  /*
   * Administrative Gender (HL7 V3)
   * http://phinvads.cdc.gov/vads/ViewValueSet.action?id=8DE75E17-176B-DE11-9B52-0015173D1785
   * OID: 2.16.840.1.113883.1.11.1
   */
  var gender = function (code) {
    var map = {
      'F': 'female',
      'M': 'male',
      'UN': 'undifferentiated'
    };
    
    return map[code] || null;
  };
  
  /*
   * Marital Status (HL7)
   * http://phinvads.cdc.gov/vads/ViewValueSet.action?id=46D34BBC-617F-DD11-B38D-00188B398520
   * OID: 2.16.840.1.114222.4.11.809
   */
  var maritalStatus = function (code) {
    var map = {
      'N': 'annulled',
      'C': 'common law',
      'D': 'divorced',
      'P': 'domestic partner',
      'I': 'interlocutory',
      'E': 'legally separated',
      'G': 'living together',
      'M': 'married',
      'O': 'other',
      'R': 'registered domestic partner',
      'A': 'separated',
      'S': 'single',
      'U': 'unknown',
      'B': 'unmarried',
      'T': 'unreported',
      'W': 'widowed'
    };
    
    return map[code] || null;
  };
  
  // Init
  ///////////////////////////
  
  // Reveal public methods
  return {
    gender: gender,
    maritalStatus: maritalStatus
  };
  
})();
;

/*
 * c32.js
 */

var Parsers = Parsers || {};

Parsers.C32 = (function () {

  var parseDate = Core.parseDate;

  /*
   * Preprocesses the C32 document
   */
  var preprocess = function (c32) {
    c32.section = section;
    return c32;
  };


  /*
   * Get entries within a section, add `each` function
   */
  var entries = function () {
    var each = function (callback) {
      for (var i = 0; i < this.length; i++) {
        callback(this[i]);
      }
    };

    var els = this.elsByTag('entry');
    els.each = each;
    return els;
  };


  /*
   * Finds the section of a C32 document
   */
  var section = function (name) {
    var el;

    switch (name) {
      case 'allergies':
        el = this.template('2.16.840.1.113883.3.88.11.83.102');
        el.entries = entries;
        return el;
      case 'demographics':
        el = this.template('2.16.840.1.113883.3.88.11.32.1');
        el.entries = entries;
        return el;
      case 'encounters':
        el = this.template('2.16.840.1.113883.3.88.11.83.127');
        el.entries = entries;
        return el;
      case 'immunizations':
        el = this.template('2.16.840.1.113883.3.88.11.83.117');
        el.entries = entries;
        return el;
      case 'labs':
        el = this.template('2.16.840.1.113883.3.88.11.83.122');
        el.entries = entries;
        return el;
      case 'medications':
        el = this.template('2.16.840.1.113883.3.88.11.83.112');
        el.entries = entries;
        return el;
      case 'problems':
        el = this.template('2.16.840.1.113883.3.88.11.83.103');
        el.entries = entries;
        return el;
      case 'procedures':
        el = this.template('2.16.840.1.113883.3.88.11.83.108');
        el.entries = entries;
        return el;
      case 'vitals':
        el = this.template('2.16.840.1.113883.3.88.11.83.119');
        el.entries = entries;
        return el;
    }

    return null;
  };


  /*
   * Parses a C32 document
   */
  var run = function (c32) {
    var data = {}, el, i;

    c32 = preprocess(c32);

    // Parse allergies /////////////////////////////////////////////////////////
    data.allergies = [];

    var allergies = c32.section('allergies');

    allergies.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.template('2.16.840.1.113883.3.88.11.83.6').tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem'),
          code_system_name = el.attr('codeSystemName');

      // value => reaction_type
      el = entry.template('2.16.840.1.113883.3.88.11.83.6').tag('value');
      var reaction_type_name = el.attr('displayName'),
          reaction_type_code = el.attr('code'),
          reaction_type_code_system = el.attr('codeSystem'),
          reaction_type_code_system_name = el.attr('codeSystemName');

      // reaction
      el = entry.template('2.16.840.1.113883.10.20.1.54').tag('value');
      var reaction_name = el.attr('displayName'),
          reaction_code = el.attr('code'),
          reaction_code_system = el.attr('codeSystem');

      // severity
      el = entry.template('2.16.840.1.113883.10.20.1.55').tag('value');
      var severity = el.attr('displayName');

      // participant => allergen
      el = entry.tag('participant').tag('code');
      var allergen_name = el.attr('displayName'),
          allergen_code = el.attr('code'),
          allergen_code_system = el.attr('codeSystem'),
          allergen_code_system_name = el.attr('codeSystemName');

      // status
      el = entry.template('2.16.840.1.113883.10.20.1.39').tag('value');
      var status = el.attr('displayName');

      data.allergies.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        name: name,
        code: code,
        code_system: code_system,
        code_system_name: code_system_name,
        status: status,
        severity: severity,
        reaction: {
          name: reaction_name,
          code: reaction_code,
          code_system: reaction_code_system
        },
        reaction_type: {
          name: reaction_type_name,
          code: reaction_type_code,
          code_system: reaction_type_code_system,
          code_system_name: reaction_type_code_system_name
        },
        allergen: {
          name: allergen_name,
          code: allergen_code,
          code_system: allergen_code_system,
          code_system_name: allergen_code_system_name
        }
      });
    });


    // Parse demographics //////////////////////////////////////////////////////
    data.demographics = {};

    var demographics = c32.section('demographics');

    var patient = demographics.tag('patientRole');
    el = patient.tag('patient').tag('name');
    var prefix = el.tag('prefix').val();

    var els = el.elsByTag('given');
    var given = [];

    for (i = 0; i < els.length; i++) {
      given.push(els[i].val());
    }

    var family = el.tag('family').val();

    el = patient.tag('patient');
    var dob = parseDate(el.tag('birthTime').attr('value')),
        gender = Codes.gender(el.tag('administrativeGenderCode').attr('code')),
        marital_status = Codes.maritalStatus(el.tag('maritalStatusCode').attr('code'));

    el = patient.tag('addr');
    els = el.elsByTag('streetAddressLine');
    var street = [];

    for (i = 0; i < els.length; i++) {
      street.push(els[i].val());
    }

    var city = el.tag('city').val(),
        state = el.tag('state').val(),
        zip = el.tag('postalCode').val(),
        country = el.tag('country').val();

    el = patient.tag('telecom');
    var home = el.attr('value'),
        work = null,
        mobile = null;

    var email = null;

    var language = patient.tag('languageCommunication').tag('languageCode').attr('code'),
        race = patient.tag('raceCode').attr('displayName'),
        ethnicity = patient.tag('ethnicGroupCode').attr('displayName'),
        religion = patient.tag('religiousAffiliationCode').attr('displayName');

    el = patient.tag('birthplace');
    var birthplace_state = el.tag('state').val(),
        birthplace_zip = el.tag('postalCode').val(),
        birthplace_country = el.tag('country').val();

    el = patient.tag('guardian');
    var guardian_relationship = el.tag('code').attr('displayName'),
        guardian_home = el.tag('telecom').attr('value');
    el = el.tag('guardianPerson');

    els = el.elsByTag('given');
    var guardian_given = [];

    for (i = 0; i < els.length; i++) {
      guardian_given.push(els[i].val());
    }

    var guardian_family = el.tag('family').val();

    el = patient.tag('guardian').tag('addr');

    els = el.elsByTag('streetAddressLine');
    var guardian_street = [];

    for (i = 0; i < els.length; i++) {
      guardian_street.push(els[i].val());
    }

    var guardian_city = el.tag('city').val(),
        guardian_state = el.tag('state').val(),
        guardian_zip = el.tag('postalCode').val(),
        guardian_country = el.tag('country').val();

    el = patient.tag('providerOrganization');
    var provider_organization = el.tag('name').val(),
        provider_phone = el.tag('telecom').attr('value');

    els = el.elsByTag('streetAddressLine');
    var provider_street = [];

    for (i = 0; i < els.length; i++) {
      provider_street.push(els[i].val());
    }

    var provider_city = el.tag('city').val(),
        provider_state = el.tag('state').val(),
        provider_zip = el.tag('postalCode').val(),
        provider_country = el.tag('country').val();

    data.demographics = {
      name: {
        prefix: prefix,
        given: given,
        family: family
      },
      dob: dob,
      gender: gender,
      marital_status: marital_status,
      address: {
       street: street,
        city: city,
        state: state,
        zip: zip,
        country: country
      },
      phone: {
        home: home,
        work: work,
        mobile: mobile
      },
      email: email,
      language: language,
      race: race,
      ethnicity: ethnicity,
      religion: religion,
      birthplace: {
        state: birthplace_state,
        zip: birthplace_zip,
        country: birthplace_country
      },
      guardian: {
        name: {
          given: guardian_given,
          family: guardian_family
        },
        relationship: guardian_relationship,
        address: {
          street: guardian_street,
          city: guardian_city,
          state: guardian_state,
          zip: guardian_zip,
          country: guardian_country
        },
        phone: {
          home: guardian_home
        }
      },
      provider: {
        organization: provider_organization,
        phone: provider_phone,
        address: {
          street: provider_street,
          city: provider_city,
          state: provider_state,
          zip: provider_zip,
          country: provider_country
        }
      }
    };


    // Parse encounters ////////////////////////////////////////////////////////
    data.encounters = [];

    var encounters = c32.section('encounters');

    encounters.entries().each(function(entry) {

      var date = parseDate(entry.tag('effectiveTime').attr('value'));
      if (!date) {
        date = parseDate(entry.tag('effectiveTime').tag('low').attr('value'));
      }

      el = entry.tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem'),
          code_system_name = el.attr('codeSystemName'),
          code_system_version = el.attr('codeSystemVersion');

      // finding
      el = entry.tag('value');
      var finding_name = el.attr('displayName'),
          finding_code = el.attr('code'),
          finding_code_system = el.attr('codeSystem');

      // translation
      el = entry.tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      // performer
      el = entry.tag('performer');
      var performer_name = el.tag('name').val(),
          performer_code = el.attr('code'),
          performer_code_system = el.attr('codeSystem'),
          performer_code_system_name = el.attr('codeSystemName');

      // participant => location
      el = entry.tag('participant');
      var organization = el.tag('name').val();

      els = el.elsByTag('streetAddressLine');
      street = [];

      for (var j = 0; j < els.length; j++) {
        street.push(els[j].val());
      }

      var city = el.tag('city').val(),
          state = el.tag('state').val(),
          zip = el.tag('postalCode').val(),
          country = el.tag('country').val();

      data.encounters.push({
        date: date,
        name: name,
        code: code,
        code_system: code_system,
        code_system_name: code_system_name,
        code_system_version: code_system_version,
        finding: {
          name: finding_name,
          code: finding_code,
          code_system: finding_code_system
        },
        translation: {
          name: translation_name,
          code: translation_code,
          code_system: translation_code_system,
          code_system_name: translation_code_system_name
        },
        performer: {
          name: performer_name,
          code: performer_code,
          code_system: performer_code_system,
          code_system_name: performer_code_system_name
        },
        location: {
          organization: organization,
          street: street,
          city: city,
          state: state,
          zip: zip,
          country: country
        }
      });
    });


    // Parse immunizations /////////////////////////////////////////////////////
    data.immunizations = [];

    var immunizations = c32.section('immunizations');

    immunizations.entries().each(function(entry) {

      // date
      el = entry.tag('effectiveTime');
      var date = parseDate(el.attr('value'));

      // product
      el = entry.template('2.16.840.1.113883.10.20.1.53').tag('code');
      var product_name = el.attr('displayName'),
          product_code = el.attr('code'),
          product_code_system = el.attr('codeSystem'),
          product_code_system_name = el.attr('codeSystemName');

      // translation
      el = entry.template('2.16.840.1.113883.10.20.1.53').tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      // route
      el = entry.tag('routeCode');
      var route_name = el.attr('displayName'),
          route_code = el.attr('code'),
          route_code_system = el.attr('codeSystem'),
          route_code_system_name = el.attr('codeSystemName');

      // instructions
      el = entry.template('2.16.840.1.113883.10.20.1.49');
      var instructions_text = el.tag('text').val();
      el = el.tag('code');
      var education_name = el.attr('displayName'),
          education_code = el.attr('code'),
          education_code_system = el.attr('codeSystem');

      data.immunizations.push({
        date: date,
        product: {
          name: product_name,
          code: product_code,
          code_system: product_code_system,
          code_system_name: product_code_system_name,
          translation: {
            name: translation_name,
            code: translation_code,
            code_system: translation_code_system,
            code_system_name: translation_code_system_name
          }
        },
        route: {
          name: route_name,
          code: route_code,
          code_system: route_code_system,
          code_system_name: route_code_system_name
        },
        instructions: instructions_text,
        education_type: {
          name: education_name,
          code: education_code,
          code_system: education_code_system
        }
      });
    });


    // Parse labs //////////////////////////////////////////////////////////////
    data.labs = [];

    var labs = c32.section('labs');

    labs.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var panel_date = parseDate(entry.tag('effectiveTime').attr('value'));
      if (!panel_date) {
        panel_date = parseDate(entry.tag('effectiveTime').tag('low').attr('value'));
      }

      // panel
      el = entry.tag('code');
      var panel_name = el.attr('displayName'),
          panel_code = el.attr('code'),
          panel_code_system = el.attr('codeSystem'),
          panel_code_system_name = el.attr('codeSystemName');

      var result;
      var results = entry.elsByTag('component');
      var results_data = [];

      for (var i = 0; i < results.length; i++) {
        result = results[i];

        // sometimes results organizers contain non-results. we only want results
        if (result.template('2.16.840.1.113883.10.20.1.31').val()) {
          var date = parseDate(result.tag('effectiveTime').attr('value'));

          el = result.tag('code');
          var name = el.attr('displayName'),
              code = el.attr('code'),
              code_system = el.attr('codeSystem'),
              code_system_name = el.attr('codeSystemName');

          el = result.tag('value');
          var value = parseFloat(el.attr('value')),
              unit = el.attr('unit');

          el = result.tag('referenceRange');
          var reference_range_text = el.tag('observationRange').tag('text').val(),
              reference_range_low_unit = el.tag('observationRange').tag('low').attr('unit'),
              reference_range_low_value = el.tag('observationRange').tag('low').attr('value'),
              reference_range_high_unit = el.tag('observationRange').tag('high').attr('unit'),
              reference_range_high_value = el.tag('observationRange').tag('high').attr('value');

          results_data.push({
            date: date,
            name: name,
            value: value,
            unit: unit,
            code: code,
            code_system: code_system,
            code_system_name: code_system_name,
            reference_range: {
              text: reference_range_text,
              low_unit: reference_range_low_unit,
              low_value: reference_range_low_value,
              high_unit: reference_range_high_unit,
              high_value: reference_range_high_value,
            }
          });
        }
      }

      data.labs.push({
        name: panel_name,
        code: panel_code,
        code_system: panel_code_system,
        code_system_name: panel_code_system_name,
        date: panel_date,
        results: results_data
      });
    });


    // Parse medications ///////////////////////////////////////////////////////
    data.medications = [];

    var medications = c32.section('medications');

    medications.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.tag('manufacturedProduct').tag('code');
      var product_name = el.attr('displayName'),
          product_code = el.attr('code'),
          product_code_system = el.attr('codeSystem');

      el = entry.tag('manufacturedProduct').tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      el = entry.tag('doseQuantity');
      var dose_value = el.attr('value'),
          dose_unit = el.attr('unit');

      el = entry.tag('rateQuantity');
      var rate_quantity_value = el.attr('value'),
          rate_quantity_unit = el.attr('unit');

      el = entry.tag('precondition').tag('value');
      var precondition_name = el.attr('displayName'),
          precondition_code = el.attr('code'),
          precondition_code_system = el.attr('codeSystem');

      el = entry.template('2.16.840.1.113883.10.20.1.28').tag('value');
      var reason_name = el.attr('displayName'),
          reason_code = el.attr('code'),
          reason_code_system = el.attr('codeSystem');

      el = entry.tag('routeCode');
      var route_name = el.attr('displayName'),
          route_code = el.attr('code'),
          route_code_system = el.attr('codeSystem'),
          route_code_system_name = el.attr('codeSystemName');

      // participant => vehicle
      el = entry.tag('participant').tag('code');
      var vehicle_name = el.attr('displayName'),
          vehicle_code = el.attr('code'),
          vehicle_code_system = el.attr('codeSystem'),
          vehicle_code_system_name = el.attr('codeSystemName');

      el = entry.tag('administrationUnitCode');
      var administration_name = el.attr('displayName'),
          administration_code = el.attr('code'),
          administration_code_system = el.attr('codeSystem'),
          administration_code_system_name = el.attr('codeSystemName');

      // performer => prescriber
      el = entry.tag('performer');
      var prescriber_organization = el.tag('name').val(),
          prescriber_person = null;

      data.medications.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        product: {
          name: product_name,
          code: product_code,
          code_system: product_code_system,
          translation: {
            name: translation_name,
            code: translation_code,
            code_system: translation_code_system,
            code_system_name: translation_code_system_name
          }
        },
        dose_quantity: {
          value: dose_value,
          unit: dose_unit
        },
        rate_quantity: {
          value: rate_quantity_value,
          unit: rate_quantity_unit
        },
        precondition: {
          name: precondition_name,
          code: precondition_code,
          code_system: precondition_code_system
        },
        reason: {
          name: reason_name,
          code: reason_code,
          code_system: reason_code_system
        },
        route: {
          name: route_name,
          code: route_code,
          code_system: route_code_system,
          code_system_name: route_code_system_name
        },
        vehicle: {
          name: vehicle_name,
          code: vehicle_code,
          code_system: vehicle_code_system,
          code_system_name: vehicle_code_system_name
        },
        administration: {
          name: administration_name,
          code: administration_code,
          code_system: administration_code_system,
          code_system_name: administration_code_system_name
        },
        prescriber: {
          organization: prescriber_organization,
          person: prescriber_person
        }
      });
    });


    // Parse problems //////////////////////////////////////////////////////////
    data.problems = [];

    var problems = c32.section('problems');

    problems.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.template('2.16.840.1.113883.10.20.1.28').tag('value');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem');

      el = entry.template('2.16.840.1.113883.10.20.1.50');
      var status = el.tag('value').attr('displayName');

      el = entry.template('2.16.840.1.113883.10.20.1.38');
      var age = parseFloat(el.tag('value').attr('value'));

      data.problems.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        name: name,
        status: status,
        age: age,
        code: code,
        code_system: code_system
      });
    });


    // Parse procedures ////////////////////////////////////////////////////////
    data.procedures = [];

    var procedures = c32.section('procedures');

    procedures.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var date = parseDate(el.attr('value'));

      el = entry.tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem');

      // 'specimen' tag not always present
      // el = entry.tag('specimen').tag('code');
      // var specimen_name = el.attr('displayName'),
      //     specimen_code = el.attr('code'),
      //     specimen_code_system = el.attr('codeSystem');
      var specimen_name = null,
          specimen_code = null,
          specimen_code_system = null;

      el = entry.tag('performer').tag('addr');
      var organization = el.tag('name').val(),
          phone = el.tag('telecom').attr('value');

      els = el.elsByTag('streetAddressLine');
      street = [];

      for (var j = 0; j < els.length; j++) {
        street.push(els[j].val());
      }

      var city = el.tag('city').val(),
          state = el.tag('state').val(),
          zip = el.tag('postalCode').val(),
          country = el.tag('country').val();

      // participant => device
      el = entry.tag('participant').tag('code');
      var device_name = el.attr('displayName'),
          device_code = el.attr('code'),
          device_code_system = el.attr('codeSystem');

      data.procedures.push({
        date: date,
        name: name,
        code: code,
        code_system: code_system,
        specimen: {
          name: specimen_name,
          code: specimen_code,
          code_system: specimen_code_system
        },
        performer: {
          organization: organization,
          street: street,
          city: city,
          state: state,
          zip: zip,
          country: country,
          phone: phone
        },
        device: {
          name: device_name,
          code: device_code,
          code_system: device_code_system
        }
      });
    });


    // Parse vitals ////////////////////////////////////////////////////////////
    data.vitals = [];

    var vitals = c32.section('vitals');

    vitals.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var entry_date = parseDate(el.attr('value'));

      var result;
      var results = entry.elsByTag('component');
      var results_data = [];

      for (var j = 0; j < results.length; j++) {
        result = results[j];

        // Results

        el = result.tag('code');
        var name = el.attr('displayName'),
            code = el.attr('code'),
            code_system = el.attr('codeSystem'),
            code_system_name = el.attr('codeSystemName');

        el = result.tag('value');
        var value = parseFloat(el.attr('value')),
            unit = el.attr('unit');

        results_data.push({
          name: name,
          code: code,
          code_system: code_system,
          code_system_name: code_system_name,
          value: value,
          unit: unit
        });
      }

      data.vitals.push({
        date: entry_date,
        results: results_data
      });
    });

    // Return the parsed data
    return data;
  };


  // Reveal public methods
  return {
    run: run
  };

})();
;

/*
 * ccda.js
 */

var Parsers = Parsers || {};

Parsers.CCDA = (function () {

  var parseDate = Core.parseDate;

  /*
   * Preprocesses the CCDA document
   */
  var preprocess = function (ccda) {
    ccda.section = section;
    return ccda;
  };


  /*
   * Get entries within a section, add `each` function
   */
  var entries = function () {
    var each = function (callback) {
      for (var i = 0; i < this.length; i++) {
        callback(this[i]);
      }
    };

    var els = this.elsByTag('entry');
    els.each = each;
    return els;
  };


  /*
   * Finds the section of a CCDA document
   */
  var section = function (name) {
    var el;

    switch (name) {
      case 'allergies':
        el = this.template('2.16.840.1.113883.10.20.22.2.6.1');
        el.entries = entries;
        return el;
      case 'demographics':
        el = this.template('2.16.840.1.113883.10.20.22.1.1');
        el.entries = entries;
        return el;
      case 'encounters':
        el = this.template('2.16.840.1.113883.10.20.22.2.22');
        if (el.isEmpty()) {
          el = this.template('2.16.840.1.113883.10.20.22.2.22.1');
          el.entries = entries;
          return el;
        } else {
          el.entries = entries;
          return el;
        }
        break;
      case 'immunizations':
        el = this.template('2.16.840.1.113883.10.20.22.2.2.1');
        if (el.isEmpty()) {
          el = this.template('2.16.840.1.113883.10.20.22.2.2');
          el.entries = entries;
          return el;
        } else {
          el.entries = entries;
          return el;
        }
        break;
      case 'labs':
        el = this.template('2.16.840.1.113883.10.20.22.2.3.1');
        el.entries = entries;
        return el;
      case 'medications':
        el = this.template('2.16.840.1.113883.10.20.22.2.1.1');
        el.entries = entries;
        return el;
      case 'problems':
        el = this.template('2.16.840.1.113883.10.20.22.2.5.1');
        if (el.isEmpty()) {
          el = this.template('2.16.840.1.113883.10.20.22.2.5');
          el.entries = entries;
          return el;
        } else {
          el.entries = entries;
          return el;
        }
        break;
      case 'procedures':
        el = this.template('2.16.840.1.113883.10.20.22.2.7.1');
        if (el.isEmpty()) {
          el = this.template('2.16.840.1.113883.10.20.22.2.7');
        } else {
          el.entries = entries;
          return el;
        }
        break;
      case 'vitals':
        el = this.template('2.16.840.1.113883.10.20.22.2.4.1');
        el.entries = entries;
        return el;
    }

    return null;
  };


  /*
   * Parses a CCDA document
   */
  var run = function (ccda) {
    var data = {}, el, i;

    ccda = preprocess(ccda);

    // Parse allergies /////////////////////////////////////////////////////////
    data.allergies = [];

    var allergies = ccda.section('allergies');

    if (allergies) allergies.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.template('2.16.840.1.113883.10.20.22.4.7').tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem'),
          code_system_name = el.attr('codeSystemName');

      // value => reaction_type
      el = entry.template('2.16.840.1.113883.10.20.22.4.7').tag('value');
      var reaction_type_name = el.attr('displayName'),
          reaction_type_code = el.attr('code'),
          reaction_type_code_system = el.attr('codeSystem'),
          reaction_type_code_system_name = el.attr('codeSystemName');

      // reaction
      el = entry.template('2.16.840.1.113883.10.20.22.4.9').tag('value');
      var reaction_name = el.attr('displayName'),
          reaction_code = el.attr('code'),
          reaction_code_system = el.attr('codeSystem');

      // severity
      el = entry.template('2.16.840.1.113883.10.20.22.4.8').tag('value');
      var severity = el.attr('displayName');

      // participant => allergen
      el = entry.tag('participant').tag('code');
      var allergen_name = el.attr('displayName'),
          allergen_code = el.attr('code'),
          allergen_code_system = el.attr('codeSystem'),
          allergen_code_system_name = el.attr('codeSystemName');

      // status
      el = entry.template('2.16.840.1.113883.10.20.22.4.28').tag('value');
      var status = el.attr('displayName');

      data.allergies.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        name: name,
        code: code,
        code_system: code_system,
        code_system_name: code_system_name,
        status: status,
        severity: severity,
        reaction: {
          name: reaction_name,
          code: reaction_code,
          code_system: reaction_code_system
        },
        reaction_type: {
          name: reaction_type_name,
          code: reaction_type_code,
          code_system: reaction_type_code_system,
          code_system_name: reaction_type_code_system_name
        },
        allergen: {
          name: allergen_name,
          code: allergen_code,
          code_system: allergen_code_system,
          code_system_name: allergen_code_system_name
        }
      });
    });


    // Parse demographics //////////////////////////////////////////////////////
    data.demographics = {};

    var demographics = ccda.section('demographics');

    var patient = demographics.tag('patientRole');
    el = patient.tag('patient').tag('name');
    var prefix = el.tag('prefix').val();

    var els = el.elsByTag('given');
    var given = [];

    for (i = 0; i < els.length; i++) {
      given.push(els[i].val());
    }

    var family = el.tag('family').val();

    el = patient.tag('patient');
    var dob = parseDate(el.tag('birthTime').attr('value')),
        gender = Codes.gender(el.tag('administrativeGenderCode').attr('code')),
        marital_status = Codes.maritalStatus(el.tag('maritalStatusCode').attr('code'));

    el = patient.tag('addr');
    els = el.elsByTag('streetAddressLine');
    var street = [];

    for (i = 0; i < els.length; i++) {
      street.push(els[i].val());
    }

    var city = el.tag('city').val(),
        state = el.tag('state').val(),
        zip = el.tag('postalCode').val(),
        country = el.tag('country').val();

    el = patient.tag('telecom');
    var home = el.attr('value'),
        work = null,
        mobile = null;

    var email = null;

    var language = patient.tag('languageCommunication').tag('languageCode').attr('code'),
        race = patient.tag('raceCode').attr('displayName'),
        ethnicity = patient.tag('ethnicGroupCode').attr('displayName'),
        religion = patient.tag('religiousAffiliationCode').attr('displayName');

    el = patient.tag('birthplace');
    var birthplace_state = el.tag('state').val(),
        birthplace_zip = el.tag('postalCode').val(),
        birthplace_country = el.tag('country').val();

    el = patient.tag('guardian');
    var guardian_relationship = el.tag('code').attr('displayName'),
        guardian_home = el.tag('telecom').attr('value');
    el = el.tag('guardianPerson');

    els = el.elsByTag('given');
    var guardian_given = [];

    for (i = 0; i < els.length; i++) {
      guardian_given.push(els[i].val());
    }

    var guardian_family = el.tag('family').val();

    el = patient.tag('guardian').tag('addr');

    els = el.elsByTag('streetAddressLine');
    var guardian_street = [];

    for (i = 0; i < els.length; i++) {
      guardian_street.push(els[i].val());
    }

    var guardian_city = el.tag('city').val(),
        guardian_state = el.tag('state').val(),
        guardian_zip = el.tag('postalCode').val(),
        guardian_country = el.tag('country').val();

    el = patient.tag('providerOrganization');
    var provider_organization = el.tag('name').val(),
        provider_phone = el.tag('telecom').attr('value');

    els = el.elsByTag('streetAddressLine');
    var provider_street = [];

    for (i = 0; i < els.length; i++) {
      provider_street.push(els[i].val());
    }

    var provider_city = el.tag('city').val(),
        provider_state = el.tag('state').val(),
        provider_zip = el.tag('postalCode').val(),
        provider_country = el.tag('country').val();

    data.demographics = {
      name: {
        prefix: prefix,
        given: given,
        family: family
      },
      dob: dob,
      gender: gender,
      marital_status: marital_status,
      address: {
       street: street,
        city: city,
        state: state,
        zip: zip,
        country: country
      },
      phone: {
        home: home,
        work: work,
        mobile: mobile
      },
      email: email,
      language: language,
      race: race,
      ethnicity: ethnicity,
      religion: religion,
      birthplace: {
        state: birthplace_state,
        zip: birthplace_zip,
        country: birthplace_country
      },
      guardian: {
        name: {
          given: guardian_given,
          family: guardian_family
        },
        relationship: guardian_relationship,
        address: {
          street: guardian_street,
          city: guardian_city,
          state: guardian_state,
          zip: guardian_zip,
          country: guardian_country
        },
        phone: {
          home: guardian_home
        }
      },
      provider: {
        organization: provider_organization,
        phone: provider_phone,
        address: {
          street: provider_street,
          city: provider_city,
          state: provider_state,
          zip: provider_zip,
          country: provider_country
        }
      }
    };


    // Parse encounters ////////////////////////////////////////////////////////
    data.encounters = [];

    var encounters = ccda.section('encounters');

    if (encounters) encounters.entries().each(function(entry) {

      var date = parseDate(entry.tag('effectiveTime').attr('value'));

      el = entry.tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem'),
          code_system_name = el.attr('codeSystemName'),
          code_system_version = el.attr('codeSystemVersion');

      // finding
      el = entry.tag('value');
      var finding_name = el.attr('displayName'),
          finding_code = el.attr('code'),
          finding_code_system = el.attr('codeSystem');

      // translation
      el = entry.tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      // performer
      el = entry.tag('performer').tag('code');
      var performer_name = el.attr('displayName'),
          performer_code = el.attr('code'),
          performer_code_system = el.attr('codeSystem'),
          performer_code_system_name = el.attr('codeSystemName');

      // participant => location
      el = entry.tag('participant');
      var organization = el.tag('code').attr('displayName');

      els = el.elsByTag('streetAddressLine');
      street = [];

      for (var j = 0; j < els.length; j++) {
        street.push(els[j].val());
      }

      var city = el.tag('city').val(),
          state = el.tag('state').val(),
          zip = el.tag('postalCode').val(),
          country = el.tag('country').val();

      data.encounters.push({
        date: date,
        name: name,
        code: code,
        code_system: code_system,
        code_system_name: code_system_name,
        code_system_version: code_system_version,
        finding: {
          name: finding_name,
          code: finding_code,
          code_system: finding_code_system
        },
        translation: {
          name: translation_name,
          code: translation_code,
          code_system: translation_code_system,
          code_system_name: translation_code_system_name
        },
        performer: {
          name: performer_name,
          code: performer_code,
          code_system: performer_code_system,
          code_system_name: performer_code_system_name
        },
        location: {
          organization: organization,
          street: street,
          city: city,
          state: state,
          zip: zip,
          country: country
        }
      });
    });


    // Parse immunizations /////////////////////////////////////////////////////
    data.immunizations = [];

    var immunizations = ccda.section('immunizations');

    if (immunizations) immunizations.entries().each(function(entry) {

      // date
      el = entry.tag('effectiveTime');
      var date = parseDate(el.attr('value'));

      // product
      el = entry.template('2.16.840.1.113883.10.20.22.4.54').tag('code');
      var product_name = el.attr('displayName'),
          product_code = el.attr('code'),
          product_code_system = el.attr('codeSystem'),
          product_code_system_name = el.attr('codeSystemName');

      // translation
      el = entry.template('2.16.840.1.113883.10.20.22.4.54').tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      // route
      el = entry.tag('routeCode');
      var route_name = el.attr('displayName'),
          route_code = el.attr('code'),
          route_code_system = el.attr('codeSystem'),
          route_code_system_name = el.attr('codeSystemName');

      // instructions
      el = entry.template('2.16.840.1.113883.10.20.22.4.20');
      var instructions_text = el.tag('text').val();
      el = el.tag('code');
      var education_name = el.attr('displayName'),
          education_code = el.attr('code'),
          education_code_system = el.attr('codeSystem');

      data.immunizations.push({
        date: date,
        product: {
          name: product_name,
          code: product_code,
          code_system: product_code_system,
          code_system_name: product_code_system_name,
          translation: {
            name: translation_name,
            code: translation_code,
            code_system: translation_code_system,
            code_system_name: translation_code_system_name
          }
        },
        route: {
          name: route_name,
          code: route_code,
          code_system: route_code_system,
          code_system_name: route_code_system_name
        },
        instructions: instructions_text,
        education_type: {
          name: education_name,
          code: education_code,
          code_system: education_code_system
        }
      });
    });


    // Parse labs //////////////////////////////////////////////////////////////
    data.labs = [];

    var labs = ccda.section('labs');

    if (labs) labs.entries().each(function(entry) {

      // panel
      el = entry.tag('code');
      var panel_name = el.attr('displayName'),
          panel_code = el.attr('code'),
          panel_code_system = el.attr('codeSystem'),
          panel_code_system_name = el.attr('codeSystemName');

      var result;
      var results = entry.elsByTag('component');
      var results_data = [];

      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var date = parseDate(result.tag('effectiveTime').attr('value'));

        el = result.tag('code');
        var name = el.attr('displayName'),
            code = el.attr('code'),
            code_system = el.attr('codeSystem'),
            code_system_name = el.attr('codeSystemName');

        el = result.tag('value');
        var value = parseFloat(el.attr('value')),
            unit = el.attr('unit');

        el = result.tag('referenceRange');
        var reference_range_text = el.tag('observationRange').tag('text').val(),
            reference_range_low_unit = el.tag('observationRange').tag('low').attr('unit'),
            reference_range_low_value = el.tag('observationRange').tag('low').attr('value'),
            reference_range_high_unit = el.tag('observationRange').tag('high').attr('unit'),
            reference_range_high_value = el.tag('observationRange').tag('high').attr('value');

        results_data.push({
          date: date,
          name: name,
          value: value,
          unit: unit,
          code: code,
          code_system: code_system,
          code_system_name: code_system_name,
          reference_range: {
            text: reference_range_text,
            low_unit: reference_range_low_unit,
            low_value: reference_range_low_value,
            high_unit: reference_range_high_unit,
            high_value: reference_range_high_value,
          }
        });
      }

      data.labs.push({
        name: panel_name,
        code: panel_code,
        code_system: panel_code_system,
        code_system_name: panel_code_system_name,
        results: results_data
      });
    });


    // Parse medications ///////////////////////////////////////////////////////
    data.medications = [];

    var medications = ccda.section('medications');

    if (medications) medications.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.tag('manufacturedProduct').tag('code');
      var product_name = el.attr('displayName'),
          product_code = el.attr('code'),
          product_code_system = el.attr('codeSystem');

      el = entry.tag('manufacturedProduct').tag('translation');
      var translation_name = el.attr('displayName'),
          translation_code = el.attr('code'),
          translation_code_system = el.attr('codeSystem'),
          translation_code_system_name = el.attr('codeSystemName');

      el = entry.tag('doseQuantity');
      var dose_value = el.attr('value'),
          dose_unit = el.attr('unit');

      el = entry.tag('rateQuantity');
      var rate_quantity_value = el.attr('value'),
          rate_quantity_unit = el.attr('unit');

      el = entry.tag('precondition').tag('value');
      var precondition_name = el.attr('displayName'),
          precondition_code = el.attr('code'),
          precondition_code_system = el.attr('codeSystem');

      el = entry.template('2.16.840.1.113883.10.20.22.4.19').tag('value');
      var reason_name = el.attr('displayName'),
          reason_code = el.attr('code'),
          reason_code_system = el.attr('codeSystem');

      el = entry.tag('routeCode');
      var route_name = el.attr('displayName'),
          route_code = el.attr('code'),
          route_code_system = el.attr('codeSystem'),
          route_code_system_name = el.attr('codeSystemName');

      // participant => vehicle
      el = entry.tag('participant').tag('code');
      var vehicle_name = el.attr('displayName'),
          vehicle_code = el.attr('code'),
          vehicle_code_system = el.attr('codeSystem'),
          vehicle_code_system_name = el.attr('codeSystemName');

      el = entry.tag('administrationUnitCode');
      var administration_name = el.attr('displayName'),
          administration_code = el.attr('code'),
          administration_code_system = el.attr('codeSystem'),
          administration_code_system_name = el.attr('codeSystemName');

      // performer => prescriber
      el = entry.tag('performer');
      var prescriber_organization = el.tag('name').val(),
          prescriber_person = null;

      data.medications.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        product: {
          name: product_name,
          code: product_code,
          code_system: product_code_system,
          translation: {
            name: translation_name,
            code: translation_code,
            code_system: translation_code_system,
            code_system_name: translation_code_system_name
          }
        },
        dose_quantity: {
          value: dose_value,
          unit: dose_unit
        },
        rate_quantity: {
          value: rate_quantity_value,
          unit: rate_quantity_unit
        },
        precondition: {
          name: precondition_name,
          code: precondition_code,
          code_system: precondition_code_system
        },
        reason: {
          name: reason_name,
          code: reason_code,
          code_system: reason_code_system
        },
        route: {
          name: route_name,
          code: route_code,
          code_system: route_code_system,
          code_system_name: route_code_system_name
        },
        vehicle: {
          name: vehicle_name,
          code: vehicle_code,
          code_system: vehicle_code_system,
          code_system_name: vehicle_code_system_name
        },
        administration: {
          name: administration_name,
          code: administration_code,
          code_system: administration_code_system,
          code_system_name: administration_code_system_name
        },
        prescriber: {
          organization: prescriber_organization,
          person: prescriber_person
        }
      });
    });


    // Parse problems //////////////////////////////////////////////////////////
    data.problems = [];

    var problems = ccda.section('problems');

    if (problems) problems.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var start_date = parseDate(el.tag('low').attr('value')),
          end_date = parseDate(el.tag('high').attr('value'));

      el = entry.template('2.16.840.1.113883.10.20.22.4.4').tag('value');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem');

      el = entry.template('2.16.840.1.113883.10.20.22.4.6');
      var status = el.tag('value').attr('displayName');

      el = entry.template('2.16.840.1.113883.10.20.22.4.31');
      var age = parseFloat(el.tag('value').attr('value'));

      data.problems.push({
        date_range: {
          start: start_date,
          end: end_date
        },
        name: name,
        status: status,
        age: age,
        code: code,
        code_system: code_system
      });
    });


    // Parse procedures ////////////////////////////////////////////////////////
    data.procedures = [];

    var procedures = ccda.section('procedures');

    if (procedures) procedures.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var date = parseDate(el.attr('value'));

      el = entry.tag('code');
      var name = el.attr('displayName'),
          code = el.attr('code'),
          code_system = el.attr('codeSystem');

      // 'specimen' tag not always present
      // el = entry.tag('specimen').tag('code');
      // var specimen_name = el.attr('displayName'),
      //     specimen_code = el.attr('code'),
      //     specimen_code_system = el.attr('codeSystem');
      var specimen_name = null,
          specimen_code = null,
          specimen_code_system = null;

      el = entry.tag('performer').tag('addr');
      var organization = el.tag('name').val(),
          phone = el.tag('telecom').attr('value');

      els = el.elsByTag('streetAddressLine');
      street = [];

      for (var j = 0; j < els.length; j++) {
        street.push(els[j].val());
      }

      var city = el.tag('city').val(),
          state = el.tag('state').val(),
          zip = el.tag('postalCode').val(),
          country = el.tag('country').val();

      // participant => device
      el = entry.tag('participant').tag('code');
      var device_name = el.attr('displayName'),
          device_code = el.attr('code'),
          device_code_system = el.attr('codeSystem');

      data.procedures.push({
        date: date,
        name: name,
        code: code,
        code_system: code_system,
        specimen: {
          name: specimen_name,
          code: specimen_code,
          code_system: specimen_code_system
        },
        performer: {
          organization: organization,
          street: street,
          city: city,
          state: state,
          zip: zip,
          country: country,
          phone: phone
        },
        device: {
          name: device_name,
          code: device_code,
          code_system: device_code_system
        }
      });
    });


    // Parse vitals ////////////////////////////////////////////////////////////
    data.vitals = [];

    var vitals = ccda.section('vitals');

    if (vitals) vitals.entries().each(function(entry) {

      el = entry.tag('effectiveTime');
      var entry_date = parseDate(el.attr('value'));

      var result;
      var results = entry.elsByTag('component');
      var results_data = [];

      for (var i = 0; i < results.length; i++) {
        result = results[i];

        el = result.tag('code');
        var name = el.attr('displayName'),
            code = el.attr('code'),
            code_system = el.attr('codeSystem'),
            code_system_name = el.attr('codeSystemName');

        el = result.tag('value');
        var value = parseFloat(el.attr('value')),
            unit = el.attr('unit');

        results_data.push({
          name: name,
          code: code,
          code_system: code_system,
          code_system_name: code_system_name,
          value: value,
          unit: unit
        });
      }

      data.vitals.push({
        date: entry_date,
        results: results_data
      });
    });

    // Return the parsed data
    return data;
  };


  // Reveal public methods
  return {
    run: run
  };

})();
;

/*
 * bluebutton.js - The public `BlueButton` object.
 */

/* exported BlueButton */
var BlueButton = function (source) {
  
  // Dependancies
  ///////////////////////////
  
  // Properties
  ///////////////////////////
  var xmlDOM = null,
      type = '',
      data = {};
  
  // Private Methods
  ///////////////////////////
  var addMethods = function (objects) {
    var json = function () { return JSON.stringify(this, null, 2); };
    
    for (var i = 0; i < objects.length; i++) {
      objects[i].json = json;
    }
  };
  
  // Public Methods
  ///////////////////////////
  var doc = function () { return data.document; };
  var allergies = function () { return data.allergies; };
  var demographics = function () { return data.demographics; };
  var encounters = function () { return data.encounters; };
  var immunizations = function () { return data.immunizations; };
  var labs = function () { return data.labs; };
  var medications = function () { return data.medications; };
  var problems = function () { return data.problems; };
  var procedures = function () { return data.procedures; };
  var vitals = function () { return data.vitals; };
  
  // Init
  ///////////////////////////
  
  // Remove leading and trailing whitespace
  source = source.replace(/^\s+|\s+$/g,'');
  
  // Detect document type
  if (source.substr(0, 5) === "<?xml") {
    xmlDOM = XML.parse(source);
    
    if (!xmlDOM.template('2.16.840.1.113883.3.88.11.32.1').isEmpty()) {
      type = "c32";
    } else if(!xmlDOM.template('2.16.840.1.113883.10.20.22.1.2').isEmpty()) {
      type = "ccda";
    }
  } else {
    type = "json";
  }
  
  switch (type) {
    case "c32":
      data = Parsers.C32.run(xmlDOM);
      break;
    case "ccda":
      data = Parsers.CCDA.run(xmlDOM);
      break;
    case "json":
      var json;
      try {
        json = JSON.parse(source);
      } catch (e) {
        console.log("BB Exception: Could not parse JSON");
      }
      console.log("BB Error: Blue Button JSON not yet implemented.");
      console.log(json);
      break;
  }
  
  data.document = { type: type };
  
  addMethods([
    data,
    data.document,
    data.allergies,
    data.demographics,
    data.encounters,
    data.immunizations,
    data.labs,
    data.medications,
    data.problems,
    data.procedures,
    data.vitals
  ]);
  
  // Reveal public methods
  return {
    xmlDOM: xmlDOM,
    data: data,
    document: doc,
    allergies: allergies,
    demographics: demographics,
    encounters: encounters,
    immunizations: immunizations,
    labs: labs,
    medications: medications,
    problems: problems,
    procedures: procedures,
    vitals: vitals
  };
    
};

        return BlueButton;

    }));