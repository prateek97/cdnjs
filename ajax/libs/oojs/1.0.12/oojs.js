/*!
 * OOjs v1.0.12
 * https://www.mediawiki.org/wiki/OOjs
 *
 * Copyright 2011-2014 OOjs Team and other contributors.
 * Released under the MIT license
 * http://oojs.mit-license.org
 *
 * Date: 2014-08-20T22:33:41Z
 */
( function ( global ) {

'use strict';

/*exported toString */
var
	/**
	 * Namespace for all classes, static methods and static properties.
	 * @class OO
	 * @singleton
	 */
	oo = {},
	hasOwn = oo.hasOwnProperty,
	toString = oo.toString;

/* Class Methods */

/**
 * Utility to initialize a class for OO inheritance.
 *
 * Currently this just initializes an empty static object.
 *
 * @param {Function} fn
 */
oo.initClass = function ( fn ) {
	fn.static = fn.static || {};
};

/**
 * Utility for common usage of Object#create for inheriting from one
 * prototype to another.
 *
 * Beware: This redefines the prototype, call before setting your prototypes.
 * Beware: This redefines the prototype, can only be called once on a function.
 *  If called multiple times on the same function, the previous prototype is lost.
 *  This is how prototypal inheritance works, it can only be one straight chain
 *  (just like classical inheritance in PHP for example). If you need to work with
 *  multiple constructors consider storing an instance of the other constructor in a
 *  property instead, or perhaps use a mixin (see OO.mixinClass).
 *
 *     function Thing() {}
 *     Thing.prototype.exists = function () {};
 *
 *     function Person() {
 *         Person.super.apply( this, arguments );
 *     }
 *     OO.inheritClass( Person, Thing );
 *     Person.static.defaultEyeCount = 2;
 *     Person.prototype.walk = function () {};
 *
 *     function Jumper() {
 *         Jumper.super.apply( this, arguments );
 *     }
 *     OO.inheritClass( Jumper, Person );
 *     Jumper.prototype.jump = function () {};
 *
 *     Jumper.static.defaultEyeCount === 2;
 *     var x = new Jumper();
 *     x.jump();
 *     x.walk();
 *     x instanceof Thing && x instanceof Person && x instanceof Jumper;
 *
 * @param {Function} targetFn
 * @param {Function} originFn
 * @throws {Error} If target already inherits from origin
 */
oo.inheritClass = function ( targetFn, originFn ) {
	if ( targetFn.prototype instanceof originFn ) {
		throw new Error( 'Target already inherits from origin' );
	}

	var targetConstructor = targetFn.prototype.constructor;

	// Using ['super'] instead of .super because 'super' is not supported
	// by IE 8 and below (bug 63303).
	// Provide .parent as alias for code supporting older browsers which
	// allows people to comply with their style guide.
	targetFn['super'] = targetFn.parent = originFn;

	targetFn.prototype = Object.create( originFn.prototype, {
		// Restore constructor property of targetFn
		constructor: {
			value: targetConstructor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	} );

	// Extend static properties - always initialize both sides
	oo.initClass( originFn );
	targetFn.static = Object.create( originFn.static );
};

/**
 * Utility to copy over *own* prototype properties of a mixin.
 * The 'constructor' (whether implicit or explicit) is not copied over.
 *
 * This does not create inheritance to the origin. If inheritance is needed
 * use oo.inheritClass instead.
 *
 * Beware: This can redefine a prototype property, call before setting your prototypes.
 * Beware: Don't call before oo.inheritClass.
 *
 *     function Foo() {}
 *     function Context() {}
 *
 *     // Avoid repeating this code
 *     function ContextLazyLoad() {}
 *     ContextLazyLoad.prototype.getContext = function () {
 *         if ( !this.context ) {
 *             this.context = new Context();
 *         }
 *         return this.context;
 *     };
 *
 *     function FooBar() {}
 *     OO.inheritClass( FooBar, Foo );
 *     OO.mixinClass( FooBar, ContextLazyLoad );
 *
 * @param {Function} targetFn
 * @param {Function} originFn
 */
oo.mixinClass = function ( targetFn, originFn ) {
	var key;

	// Copy prototype properties
	for ( key in originFn.prototype ) {
		if ( key !== 'constructor' && hasOwn.call( originFn.prototype, key ) ) {
			targetFn.prototype[key] = originFn.prototype[key];
		}
	}

	// Copy static properties - always initialize both sides
	oo.initClass( targetFn );
	if ( originFn.static ) {
		for ( key in originFn.static ) {
			if ( hasOwn.call( originFn.static, key ) ) {
				targetFn.static[key] = originFn.static[key];
			}
		}
	} else {
		oo.initClass( originFn );
	}
};

/* Object Methods */

/**
 * Create a new object that is an instance of the same
 * constructor as the input, inherits from the same object
 * and contains the same own properties.
 *
 * This makes a shallow non-recursive copy of own properties.
 * To create a recursive copy of plain objects, use #copy.
 *
 *     var foo = new Person( mom, dad );
 *     foo.setAge( 21 );
 *     var foo2 = OO.cloneObject( foo );
 *     foo.setAge( 22 );
 *
 *     // Then
 *     foo2 !== foo; // true
 *     foo2 instanceof Person; // true
 *     foo2.getAge(); // 21
 *     foo.getAge(); // 22
 *
 * @param {Object} origin
 * @return {Object} Clone of origin
 */
oo.cloneObject = function ( origin ) {
	var key, r;

	r = Object.create( origin.constructor.prototype );

	for ( key in origin ) {
		if ( hasOwn.call( origin, key ) ) {
			r[key] = origin[key];
		}
	}

	return r;
};

/**
 * Get an array of all property values in an object.
 *
 * @param {Object} Object to get values from
 * @return {Array} List of object values
 */
oo.getObjectValues = function ( obj ) {
	var key, values;

	if ( obj !== Object( obj ) ) {
		throw new TypeError( 'Called on non-object' );
	}

	values = [];
	for ( key in obj ) {
		if ( hasOwn.call( obj, key ) ) {
			values[values.length] = obj[key];
		}
	}

	return values;
};

/**
 * Recursively compares properties between two objects.
 *
 * A false result may be caused by property inequality or by properties in one object missing from
 * the other. An asymmetrical test may also be performed, which checks only that properties in the
 * first object are present in the second object, but not the inverse.
 *
 * If either a or b is null or undefined it will be treated as an empty object.
 *
 * @param {Object|undefined} a First object to compare
 * @param {Object|undefined} b Second object to compare
 * @param {boolean} [asymmetrical] Whether to check only that b contains values from a
 * @return {boolean} If the objects contain the same values as each other
 */
oo.compare = function ( a, b, asymmetrical ) {
	var aValue, bValue, aType, bType, k;

	if ( a === b ) {
		return true;
	}

	a = a || {};
	b = b || {};

	for ( k in a ) {
		if ( !hasOwn.call( a, k ) ) {
			// Support es3-shim: Without this filter, comparing [] to {} will be false in ES3
			// because the shimmed "forEach" is enumerable and shows up in Array but not Object.
			continue;
		}

		aValue = a[k];
		bValue = b[k];
		aType = typeof aValue;
		bType = typeof bValue;
		if ( aType !== bType ||
			( ( aType === 'string' || aType === 'number' ) && aValue !== bValue ) ||
			( aValue === Object( aValue ) && !oo.compare( aValue, bValue, asymmetrical ) ) ) {
			return false;
		}
	}
	// If the check is not asymmetrical, recursing with the arguments swapped will verify our result
	return asymmetrical ? true : oo.compare( b, a, true );
};

/**
 * Create a plain deep copy of any kind of object.
 *
 * Copies are deep, and will either be an object or an array depending on `source`.
 *
 * @param {Object} source Object to copy
 * @param {Function} [leafCallback] Applied to leaf values after they are cloned but before they are added to the clone
 * @param {Function} [nodeCallback] Applied to all values before they are cloned.  If the nodeCallback returns a value other than undefined, the returned value is used instead of attempting to clone.
 * @return {Object} Copy of source object
 */
oo.copy = function ( source, leafCallback, nodeCallback ) {
	var key, destination;

	if ( nodeCallback ) {
		// Extensibility: check before attempting to clone source.
		destination = nodeCallback( source );
		if ( destination !== undefined ) {
			return destination;
		}
	}

	if ( Array.isArray( source ) ) {
		// Array (fall through)
		destination = new Array( source.length );
	} else if ( source && typeof source.clone === 'function' ) {
		// Duck type object with custom clone method
		return leafCallback ? leafCallback( source.clone() ) : source.clone();
	} else if ( source && typeof source.cloneNode === 'function' ) {
		// DOM Node
		return leafCallback ?
			leafCallback( source.cloneNode( true ) ) :
			source.cloneNode( true );
	} else if ( oo.isPlainObject( source ) ) {
		// Plain objects (fall through)
		destination = {};
	} else {
		// Non-plain objects (incl. functions) and primitive values
		return leafCallback ? leafCallback( source ) : source;
	}

	// source is an array or a plain object
	for ( key in source ) {
		destination[key] = oo.copy( source[key], leafCallback, nodeCallback );
	}

	// This is an internal node, so we don't apply the leafCallback.
	return destination;
};

/**
 * Generate a hash of an object based on its name and data.
 *
 * Performance optimization: <http://jsperf.com/ve-gethash-201208#/toJson_fnReplacerIfAoForElse>
 *
 * To avoid two objects with the same values generating different hashes, we utilize the replacer
 * argument of JSON.stringify and sort the object by key as it's being serialized. This may or may
 * not be the fastest way to do this; we should investigate this further.
 *
 * Objects and arrays are hashed recursively. When hashing an object that has a .getHash()
 * function, we call that function and use its return value rather than hashing the object
 * ourselves. This allows classes to define custom hashing.
 *
 * @param {Object} val Object to generate hash for
 * @return {string} Hash of object
 */
oo.getHash = function ( val ) {
	return JSON.stringify( val, oo.getHash.keySortReplacer );
};

/**
 * Helper function for OO.getHash which sorts objects by key.
 *
 * This is a callback passed into JSON.stringify.
 *
 * @method getHash_keySortReplacer
 * @param {string} key Property name of value being replaced
 * @param {Mixed} val Property value to replace
 * @return {Mixed} Replacement value
 */
oo.getHash.keySortReplacer = function ( key, val ) {
	var normalized, keys, i, len;
	if ( val && typeof val.getHashObject === 'function' ) {
		// This object has its own custom hash function, use it
		val = val.getHashObject();
	}
	if ( !Array.isArray( val ) && Object( val ) === val ) {
		// Only normalize objects when the key-order is ambiguous
		// (e.g. any object not an array).
		normalized = {};
		keys = Object.keys( val ).sort();
		i = 0;
		len = keys.length;
		for ( ; i < len; i += 1 ) {
			normalized[keys[i]] = val[keys[i]];
		}
		return normalized;

	// Primitive values and arrays get stable hashes
	// by default. Lets those be stringified as-is.
	} else {
		return val;
	}
};

/**
 * Compute the union (duplicate-free merge) of a set of arrays.
 *
 * Arrays values must be convertable to object keys (strings).
 *
 * By building an object (with the values for keys) in parallel with
 * the array, a new item's existence in the union can be computed faster.
 *
 * @param {Array...} arrays Arrays to union
 * @return {Array} Union of the arrays
 */
oo.simpleArrayUnion = function () {
	var i, ilen, arr, j, jlen,
		obj = {},
		result = [];

	for ( i = 0, ilen = arguments.length; i < ilen; i++ ) {
		arr = arguments[i];
		for ( j = 0, jlen = arr.length; j < jlen; j++ ) {
			if ( !obj[ arr[j] ] ) {
				obj[ arr[j] ] = true;
				result.push( arr[j] );
			}
		}
	}

	return result;
};

/**
 * Combine arrays (intersection or difference).
 *
 * An intersection checks the item exists in 'b' while difference checks it doesn't.
 *
 * Arrays values must be convertable to object keys (strings).
 *
 * By building an object (with the values for keys) of 'b' we can
 * compute the result faster.
 *
 * @private
 * @param {Array} a First array
 * @param {Array} b Second array
 * @param {boolean} includeB Whether to items in 'b'
 * @return {Array} Combination (intersection or difference) of arrays
 */
function simpleArrayCombine( a, b, includeB ) {
	var i, ilen, isInB,
		bObj = {},
		result = [];

	for ( i = 0, ilen = b.length; i < ilen; i++ ) {
		bObj[ b[i] ] = true;
	}

	for ( i = 0, ilen = a.length; i < ilen; i++ ) {
		isInB = !!bObj[ a[i] ];
		if ( isInB === includeB ) {
			result.push( a[i] );
		}
	}

	return result;
}

/**
 * Compute the intersection of two arrays (items in both arrays).
 *
 * Arrays values must be convertable to object keys (strings).
 *
 * @param {Array} a First array
 * @param {Array} b Second array
 * @return {Array} Intersection of arrays
 */
oo.simpleArrayIntersection = function ( a, b ) {
	return simpleArrayCombine( a, b, true );
};

/**
 * Compute the difference of two arrays (items in 'a' but not 'b').
 *
 * Arrays values must be convertable to object keys (strings).
 *
 * @param {Array} a First array
 * @param {Array} b Second array
 * @return {Array} Intersection of arrays
 */
oo.simpleArrayDifference = function ( a, b ) {
	return simpleArrayCombine( a, b, false );
};

/*global hasOwn, toString */

/**
 * Assert whether a value is a plain object or not.
 *
 * @param {Mixed} obj
 * @return {boolean}
 */
oo.isPlainObject = function ( obj ) {
	/*jshint eqnull:true, eqeqeq:false */

	// Any object or value whose internal [[Class]] property is not "[object Object]"
	// Support IE8: Explicitly filter out DOM nodes
	// Support IE8: Explicitly filter out Window object (needs loose comparison)
	if ( !obj || toString.call( obj ) !== '[object Object]' || obj.nodeType || ( obj != null && obj == obj.window ) ) {
		return false;
	}

	// The try/catch suppresses exceptions thrown when attempting to access
	// the "constructor" property of certain host objects suich as window.location
	// in Firefox < 20 (https://bugzilla.mozilla.org/814622)
	try {
		if ( obj.constructor &&
				!hasOwn.call( obj.constructor.prototype, 'isPrototypeOf' ) ) {
			return false;
		}
	} catch ( e ) {
		return false;
	}

	return true;
};

/*global hasOwn */

/**
 * @class OO.EventEmitter
 *
 * @constructor
 */
oo.EventEmitter = function OoEventEmitter() {
	// Properties

	/**
	 * Storage of bound event handlers by event name.
	 *
	 * @property
	 */
	this.bindings = {};
};

oo.initClass( oo.EventEmitter );

/* Methods */

/**
 * Add a listener to events of a specific event.
 *
 * The listener can be a function or the string name of a method; if the latter, then the
 * name lookup happens at the time the listener is called.
 *
 * @param {string} event Type of event to listen to
 * @param {Function|string} method Function or method name to call when event occurs
 * @param {Array} [args] Arguments to pass to listener, will be prepended to emitted arguments
 * @param {Object} [context=null] Context object for function or method call
 * @throws {Error} Listener argument is not a function or a valid method name
 * @chainable
 */
oo.EventEmitter.prototype.on = function ( event, method, args, context ) {
	var bindings;

	this.constructor.static.validateMethod( method, context );

	if ( hasOwn.call( this.bindings, event ) ) {
		bindings = this.bindings[event];
	} else {
		// Auto-initialize bindings list
		bindings = this.bindings[event] = [];
	}
	// Add binding
	bindings.push( {
		method: method,
		args: args,
		context: ( arguments.length < 4 ) ? null : context
	} );
	return this;
};

/**
 * Adds a one-time listener to a specific event.
 *
 * @param {string} event Type of event to listen to
 * @param {Function} listener Listener to call when event occurs
 * @chainable
 */
oo.EventEmitter.prototype.once = function ( event, listener ) {
	var eventEmitter = this,
		listenerWrapper = function () {
			eventEmitter.off( event, listenerWrapper );
			listener.apply( eventEmitter, Array.prototype.slice.call( arguments, 0 ) );
		};
	return this.on( event, listenerWrapper );
};

/**
 * Remove a specific listener from a specific event.
 *
 * @param {string} event Type of event to remove listener from
 * @param {Function|string} [method] Listener to remove. Must be in the same form as was passed
 * to "on". Omit to remove all listeners.
 * @param {Object} [context=null] Context object function or method call
 * @chainable
 * @throws {Error} Listener argument is not a function or a valid method name
 */
oo.EventEmitter.prototype.off = function ( event, method, context ) {
	var i, bindings;

	if ( arguments.length === 1 ) {
		// Remove all bindings for event
		delete this.bindings[event];
		return this;
	}

	this.constructor.static.validateMethod( method, context );

	if ( !( event in this.bindings ) || !this.bindings[event].length ) {
		// No matching bindings
		return this;
	}

	// Default to null context
	if ( arguments.length < 3 ) {
		context = null;
	}

	// Remove matching handlers
	bindings = this.bindings[event];
	i = bindings.length;
	while ( i-- ) {
		if ( bindings[i].method === method && bindings[i].context === context ) {
			bindings.splice( i, 1 );
		}
	}

	// Cleanup if now empty
	if ( bindings.length === 0 ) {
		delete this.bindings[event];
	}
	return this;
};

/**
 * Emit an event.
 *
 * TODO: Should this be chainable? What is the usefulness of the boolean
 * return value here?
 *
 * @param {string} event Type of event
 * @param {Mixed} args First in a list of variadic arguments passed to event handler (optional)
 * @return {boolean} If event was handled by at least one listener
 */
oo.EventEmitter.prototype.emit = function ( event ) {
	var i, len, binding, bindings, args, method;

	if ( event in this.bindings ) {
		// Slicing ensures that we don't get tripped up by event handlers that add/remove bindings
		bindings = this.bindings[event].slice();
		args = Array.prototype.slice.call( arguments, 1 );
		for ( i = 0, len = bindings.length; i < len; i++ ) {
			binding = bindings[i];
			if ( typeof binding.method === 'string' ) {
				// Lookup method by name (late binding)
				method = binding.context[ binding.method ];
			} else {
				method = binding.method;
			}
			method.apply(
				binding.context,
				binding.args ? binding.args.concat( args ) : args
			);
		}
		return true;
	}
	return false;
};

/**
 * Connect event handlers to an object.
 *
 * @param {Object} context Object to call methods on when events occur
 * @param {Object.<string,string>|Object.<string,Function>|Object.<string,Array>} methods List of
 *  event bindings keyed by event name containing either method names, functions or arrays containing
 *  method name or function followed by a list of arguments to be passed to callback before emitted
 *  arguments
 * @chainable
 */
oo.EventEmitter.prototype.connect = function ( context, methods ) {
	var method, args, event;

	for ( event in methods ) {
		method = methods[event];
		// Allow providing additional args
		if ( Array.isArray( method ) ) {
			args = method.slice( 1 );
			method = method[0];
		} else {
			args = [];
		}
		// Add binding
		this.on( event, method, args, context );
	}
	return this;
};

/**
 * Disconnect event handlers from an object.
 *
 * @param {Object} context Object to disconnect methods from
 * @param {Object.<string,string>|Object.<string,Function>|Object.<string,Array>} [methods] List of
 * event bindings keyed by event name. Values can be either method names or functions, but must be
 * consistent with those used in the corresponding call to "connect".
 * @chainable
 */
oo.EventEmitter.prototype.disconnect = function ( context, methods ) {
	var i, event, bindings;

	if ( methods ) {
		// Remove specific connections to the context
		for ( event in methods ) {
			this.off( event, methods[event], context );
		}
	} else {
		// Remove all connections to the context
		for ( event in this.bindings ) {
			bindings = this.bindings[event];
			i = bindings.length;
			while ( i-- ) {
				// bindings[i] may have been removed by the previous step's
				// this.off so check it still exists
				if ( bindings[i] && bindings[i].context === context ) {
					this.off( event, bindings[i].method, context );
				}
			}
		}
	}

	return this;
};

/**
 * Validate a function or method call in a context
 *
 * For a method name, check that it names a function in the context object
 *
 * @static
 * @param {Function|string} method Function or method name
 * @param {Mixed} context The context of the call
 * @throws {Error} A method name is given but there is no context
 * @throws {Error} In the context object, no property exists with the given name
 * @throws {Error} In the context object, the named property is not a function
 */
oo.EventEmitter.static.validateMethod = function ( method, context ) {
	// Validate method and context
	if ( typeof method === 'string' ) {
		// Validate method
		if ( context === undefined || context === null ) {
			throw new Error( 'Method name "' + method + '" has no context.' );
		}
		if ( !( method in context ) ) {
			// Technically the method does not need to exist yet: it could be
			// added before call time. But this probably signals a typo.
			throw new Error( 'Method not found: "' + method + '"' );
		}
		if ( typeof context[method] !== 'function' ) {
			// Technically the property could be replaced by a function before
			// call time. But this probably signals a typo.
			throw new Error( 'Property "' + method + '" is not a function' );
		}
	} else if ( typeof method !== 'function' ) {
		throw new Error( 'Invalid callback. Function or method name expected.' );
	}
};

/*global hasOwn */

/**
 * @class OO.Registry
 * @mixins OO.EventEmitter
 *
 * @constructor
 */
oo.Registry = function OoRegistry() {
	// Mixin constructors
	oo.EventEmitter.call( this );

	// Properties
	this.registry = {};
};

/* Inheritance */

oo.mixinClass( oo.Registry, oo.EventEmitter );

/* Events */

/**
 * @event register
 * @param {string} name
 * @param {Mixed} data
 */

/* Methods */

/**
 * Associate one or more symbolic names with some data.
 *
 * Only the base name will be registered, overriding any existing entry with the same base name.
 *
 * @param {string|string[]} name Symbolic name or list of symbolic names
 * @param {Mixed} data Data to associate with symbolic name
 * @fires register
 * @throws {Error} Name argument must be a string or array
 */
oo.Registry.prototype.register = function ( name, data ) {
	var i, len;
	if ( typeof name === 'string' ) {
		this.registry[name] = data;
		this.emit( 'register', name, data );
	} else if ( Array.isArray( name ) ) {
		for ( i = 0, len = name.length; i < len; i++ ) {
			this.register( name[i], data );
		}
	} else {
		throw new Error( 'Name must be a string or array, cannot be a ' + typeof name );
	}
};

/**
 * Get data for a given symbolic name.
 *
 * Lookups are done using the base name.
 *
 * @param {string} name Symbolic name
 * @return {Mixed|undefined} Data associated with symbolic name
 */
oo.Registry.prototype.lookup = function ( name ) {
	if ( hasOwn.call( this.registry, name ) ) {
		return this.registry[name];
	}
};

/**
 * @class OO.Factory
 * @extends OO.Registry
 *
 * @constructor
 */
oo.Factory = function OoFactory() {
	oo.Factory.parent.call( this );

	// Properties
	this.entries = [];
};

/* Inheritance */

oo.inheritClass( oo.Factory, oo.Registry );

/* Methods */

/**
 * Register a constructor with the factory.
 *
 * Classes must have a static `name` property to be registered.
 *
 *     function MyClass() {};
 *     OO.initClass( MyClass );
 *     // Adds a static property to the class defining a symbolic name
 *     MyClass.static.name = 'mine';
 *     // Registers class with factory, available via symbolic name 'mine'
 *     factory.register( MyClass );
 *
 * @param {Function} constructor Constructor to use when creating object
 * @throws {Error} Name must be a string and must not be empty
 * @throws {Error} Constructor must be a function
 */
oo.Factory.prototype.register = function ( constructor ) {
	var name;

	if ( typeof constructor !== 'function' ) {
		throw new Error( 'constructor must be a function, cannot be a ' + typeof constructor );
	}
	name = constructor.static && constructor.static.name;
	if ( typeof name !== 'string' || name === '' ) {
		throw new Error( 'Name must be a string and must not be empty' );
	}
	this.entries.push( name );

	oo.Factory.parent.prototype.register.call( this, name, constructor );
};

/**
 * Create an object based on a name.
 *
 * Name is used to look up the constructor to use, while all additional arguments are passed to the
 * constructor directly, so leaving one out will pass an undefined to the constructor.
 *
 * @param {string} name Object name
 * @param {Mixed...} [args] Arguments to pass to the constructor
 * @return {Object} The new object
 * @throws {Error} Unknown object name
 */
oo.Factory.prototype.create = function ( name ) {
	var args, obj,
		constructor = this.lookup( name );

	if ( !constructor ) {
		throw new Error( 'No class registered by that name: ' + name );
	}

	// Convert arguments to array and shift the first argument (name) off
	args = Array.prototype.slice.call( arguments, 1 );

	// We can't use the "new" operator with .apply directly because apply needs a
	// context. So instead just do what "new" does: create an object that inherits from
	// the constructor's prototype (which also makes it an "instanceof" the constructor),
	// then invoke the constructor with the object as context, and return it (ignoring
	// the constructor's return value).
	obj = Object.create( constructor.prototype );
	constructor.apply( obj, args );
	return obj;
};

/*jshint node:true */
if ( typeof module !== 'undefined' && module.exports ) {
	module.exports = oo;
} else {
	global.OO = oo;
}

}( this ) );
