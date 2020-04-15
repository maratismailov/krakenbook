
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function () {
  'use strict';

  function noop() {}

  const identity = x => x;

  function assign(tar, src) {
  	for (const k in src) tar[k] = src[k];
  	return tar;
  }

  function add_location(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file, line, column, char }
  	};
  }

  function run(fn) {
  	return fn();
  }

  function blank_object() {
  	return Object.create(null);
  }

  function run_all(fns) {
  	fns.forEach(run);
  }

  function is_function(thing) {
  	return typeof thing === 'function';
  }

  function safe_not_equal(a, b) {
  	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }

  function validate_store(store, name) {
  	if (!store || typeof store.subscribe !== 'function') {
  		throw new Error(`'${name}' is not a store with a 'subscribe' method`);
  	}
  }

  function subscribe(component, store, callback) {
  	const unsub = store.subscribe(callback);

  	component.$$.on_destroy.push(unsub.unsubscribe
  		? () => unsub.unsubscribe()
  		: unsub);
  }

  function create_slot(definition, ctx, fn) {
  	if (definition) {
  		const slot_ctx = get_slot_context(definition, ctx, fn);
  		return definition[0](slot_ctx);
  	}
  }

  function get_slot_context(definition, ctx, fn) {
  	return definition[1]
  		? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
  		: ctx.$$scope.ctx;
  }

  function get_slot_changes(definition, ctx, changed, fn) {
  	return definition[1]
  		? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
  		: ctx.$$scope.changed || {};
  }

  function exclude_internal_props(props) {
  	const result = {};
  	for (const k in props) if (k[0] !== '$') result[k] = props[k];
  	return result;
  }

  const tasks = new Set();
  let running = false;

  function run_tasks() {
  	tasks.forEach(task => {
  		if (!task[0](window.performance.now())) {
  			tasks.delete(task);
  			task[1]();
  		}
  	});

  	running = tasks.size > 0;
  	if (running) requestAnimationFrame(run_tasks);
  }

  function loop(fn) {
  	let task;

  	if (!running) {
  		running = true;
  		requestAnimationFrame(run_tasks);
  	}

  	return {
  		promise: new Promise(fulfil => {
  			tasks.add(task = [fn, fulfil]);
  		}),
  		abort() {
  			tasks.delete(task);
  		}
  	};
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor || null);
  }

  function detach(node) {
  	node.parentNode.removeChild(node);
  }

  function destroy_each(iterations, detaching) {
  	for (let i = 0; i < iterations.length; i += 1) {
  		if (iterations[i]) iterations[i].d(detaching);
  	}
  }

  function element(name) {
  	return document.createElement(name);
  }

  function text(data) {
  	return document.createTextNode(data);
  }

  function space() {
  	return text(' ');
  }

  function empty() {
  	return text('');
  }

  function listen(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  	return () => node.removeEventListener(event, handler, options);
  }

  function attr(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);
  	else node.setAttribute(attribute, value);
  }

  function set_attributes(node, attributes) {
  	for (const key in attributes) {
  		if (key === 'style') {
  			node.style.cssText = attributes[key];
  		} else if (key in node) {
  			node[key] = attributes[key];
  		} else {
  			attr(node, key, attributes[key]);
  		}
  	}
  }

  function children(element) {
  	return Array.from(element.childNodes);
  }

  function set_data(text, data) {
  	data = '' + data;
  	if (text.data !== data) text.data = data;
  }

  function set_style(node, key, value) {
  	node.style.setProperty(key, value);
  }

  function custom_event(type, detail) {
  	const e = document.createEvent('CustomEvent');
  	e.initCustomEvent(type, false, false, detail);
  	return e;
  }

  let stylesheet;
  let active = 0;
  let current_rules = {};

  // https://github.com/darkskyapp/string-hash/blob/master/index.js
  function hash(str) {
  	let hash = 5381;
  	let i = str.length;

  	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
  	return hash >>> 0;
  }

  function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  	const step = 16.666 / duration;
  	let keyframes = '{\n';

  	for (let p = 0; p <= 1; p += step) {
  		const t = a + (b - a) * ease(p);
  		keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
  	}

  	const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
  	const name = `__svelte_${hash(rule)}_${uid}`;

  	if (!current_rules[name]) {
  		if (!stylesheet) {
  			const style = element('style');
  			document.head.appendChild(style);
  			stylesheet = style.sheet;
  		}

  		current_rules[name] = true;
  		stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  	}

  	const animation = node.style.animation || '';
  	node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;

  	active += 1;
  	return name;
  }

  function delete_rule(node, name) {
  	node.style.animation = (node.style.animation || '')
  		.split(', ')
  		.filter(name
  			? anim => anim.indexOf(name) < 0 // remove specific animation
  			: anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
  		)
  		.join(', ');

  	if (name && !--active) clear_rules();
  }

  function clear_rules() {
  	requestAnimationFrame(() => {
  		if (active) return;
  		let i = stylesheet.cssRules.length;
  		while (i--) stylesheet.deleteRule(i);
  		current_rules = {};
  	});
  }

  let current_component;

  function set_current_component(component) {
  	current_component = component;
  }

  function get_current_component() {
  	if (!current_component) throw new Error(`Function called outside component initialization`);
  	return current_component;
  }

  function beforeUpdate(fn) {
  	get_current_component().$$.before_render.push(fn);
  }

  function onMount(fn) {
  	get_current_component().$$.on_mount.push(fn);
  }

  function onDestroy(fn) {
  	get_current_component().$$.on_destroy.push(fn);
  }

  function createEventDispatcher() {
  	const component = current_component;

  	return (type, detail) => {
  		const callbacks = component.$$.callbacks[type];

  		if (callbacks) {
  			// TODO are there situations where events could be dispatched
  			// in a server (non-DOM) environment?
  			const event = custom_event(type, detail);
  			callbacks.slice().forEach(fn => {
  				fn.call(component, event);
  			});
  		}
  	};
  }

  function setContext(key, context) {
  	get_current_component().$$.context.set(key, context);
  }

  function getContext(key) {
  	return get_current_component().$$.context.get(key);
  }

  const dirty_components = [];

  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];

  function schedule_update() {
  	if (!update_scheduled) {
  		update_scheduled = true;
  		resolved_promise.then(flush);
  	}
  }

  function add_render_callback(fn) {
  	render_callbacks.push(fn);
  }

  function flush() {
  	const seen_callbacks = new Set();

  	do {
  		// first, call beforeUpdate functions
  		// and update components
  		while (dirty_components.length) {
  			const component = dirty_components.shift();
  			set_current_component(component);
  			update(component.$$);
  		}

  		while (binding_callbacks.length) binding_callbacks.shift()();

  		// then, once components are updated, call
  		// afterUpdate functions. This may cause
  		// subsequent updates...
  		while (render_callbacks.length) {
  			const callback = render_callbacks.pop();
  			if (!seen_callbacks.has(callback)) {
  				callback();

  				// ...so guard against infinite loops
  				seen_callbacks.add(callback);
  			}
  		}
  	} while (dirty_components.length);

  	while (flush_callbacks.length) {
  		flush_callbacks.pop()();
  	}

  	update_scheduled = false;
  }

  function update($$) {
  	if ($$.fragment) {
  		$$.update($$.dirty);
  		run_all($$.before_render);
  		$$.fragment.p($$.dirty, $$.ctx);
  		$$.dirty = null;

  		$$.after_render.forEach(add_render_callback);
  	}
  }

  let promise;

  function wait() {
  	if (!promise) {
  		promise = Promise.resolve();
  		promise.then(() => {
  			promise = null;
  		});
  	}

  	return promise;
  }

  function dispatch(node, direction, kind) {
  	node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
  }

  let outros;

  function group_outros() {
  	outros = {
  		remaining: 0,
  		callbacks: []
  	};
  }

  function check_outros() {
  	if (!outros.remaining) {
  		run_all(outros.callbacks);
  	}
  }

  function on_outro(callback) {
  	outros.callbacks.push(callback);
  }

  function create_bidirectional_transition(node, fn, params, intro) {
  	let config = fn(node, params);

  	let t = intro ? 0 : 1;

  	let running_program = null;
  	let pending_program = null;
  	let animation_name = null;

  	function clear_animation() {
  		if (animation_name) delete_rule(node, animation_name);
  	}

  	function init(program, duration) {
  		const d = program.b - t;
  		duration *= Math.abs(d);

  		return {
  			a: t,
  			b: program.b,
  			d,
  			duration,
  			start: program.start,
  			end: program.start + duration,
  			group: program.group
  		};
  	}

  	function go(b) {
  		const {
  			delay = 0,
  			duration = 300,
  			easing = identity,
  			tick: tick$$1 = noop,
  			css
  		} = config;

  		const program = {
  			start: window.performance.now() + delay,
  			b
  		};

  		if (!b) {
  			program.group = outros;
  			outros.remaining += 1;
  		}

  		if (running_program) {
  			pending_program = program;
  		} else {
  			// if this is an intro, and there's a delay, we need to do
  			// an initial tick and/or apply CSS animation immediately
  			if (css) {
  				clear_animation();
  				animation_name = create_rule(node, t, b, duration, delay, easing, css);
  			}

  			if (b) tick$$1(0, 1);

  			running_program = init(program, duration);
  			add_render_callback(() => dispatch(node, b, 'start'));

  			loop(now => {
  				if (pending_program && now > pending_program.start) {
  					running_program = init(pending_program, duration);
  					pending_program = null;

  					dispatch(node, running_program.b, 'start');

  					if (css) {
  						clear_animation();
  						animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
  					}
  				}

  				if (running_program) {
  					if (now >= running_program.end) {
  						tick$$1(t = running_program.b, 1 - t);
  						dispatch(node, running_program.b, 'end');

  						if (!pending_program) {
  							// we're done
  							if (running_program.b) {
  								// intro — we can tidy up immediately
  								clear_animation();
  							} else {
  								// outro — needs to be coordinated
  								if (!--running_program.group.remaining) run_all(running_program.group.callbacks);
  							}
  						}

  						running_program = null;
  					}

  					else if (now >= running_program.start) {
  						const p = now - running_program.start;
  						t = running_program.a + running_program.d * easing(p / running_program.duration);
  						tick$$1(t, 1 - t);
  					}
  				}

  				return !!(running_program || pending_program);
  			});
  		}
  	}

  	return {
  		run(b) {
  			if (typeof config === 'function') {
  				wait().then(() => {
  					config = config();
  					go(b);
  				});
  			} else {
  				go(b);
  			}
  		},

  		end() {
  			clear_animation();
  			running_program = pending_program = null;
  		}
  	};
  }

  function get_spread_update(levels, updates) {
  	const update = {};

  	const to_null_out = {};
  	const accounted_for = { $$scope: 1 };

  	let i = levels.length;
  	while (i--) {
  		const o = levels[i];
  		const n = updates[i];

  		if (n) {
  			for (const key in o) {
  				if (!(key in n)) to_null_out[key] = 1;
  			}

  			for (const key in n) {
  				if (!accounted_for[key]) {
  					update[key] = n[key];
  					accounted_for[key] = 1;
  				}
  			}

  			levels[i] = n;
  		} else {
  			for (const key in o) {
  				accounted_for[key] = 1;
  			}
  		}
  	}

  	for (const key in to_null_out) {
  		if (!(key in update)) update[key] = undefined;
  	}

  	return update;
  }

  function mount_component(component, target, anchor) {
  	const { fragment, on_mount, on_destroy, after_render } = component.$$;

  	fragment.m(target, anchor);

  	// onMount happens after the initial afterUpdate. Because
  	// afterUpdate callbacks happen in reverse order (inner first)
  	// we schedule onMount callbacks before afterUpdate callbacks
  	add_render_callback(() => {
  		const new_on_destroy = on_mount.map(run).filter(is_function);
  		if (on_destroy) {
  			on_destroy.push(...new_on_destroy);
  		} else {
  			// Edge case - component was destroyed immediately,
  			// most likely as a result of a binding initialising
  			run_all(new_on_destroy);
  		}
  		component.$$.on_mount = [];
  	});

  	after_render.forEach(add_render_callback);
  }

  function destroy(component, detaching) {
  	if (component.$$) {
  		run_all(component.$$.on_destroy);
  		component.$$.fragment.d(detaching);

  		// TODO null out other refs, including component.$$ (but need to
  		// preserve final state?)
  		component.$$.on_destroy = component.$$.fragment = null;
  		component.$$.ctx = {};
  	}
  }

  function make_dirty(component, key) {
  	if (!component.$$.dirty) {
  		dirty_components.push(component);
  		schedule_update();
  		component.$$.dirty = blank_object();
  	}
  	component.$$.dirty[key] = true;
  }

  function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
  	const parent_component = current_component;
  	set_current_component(component);

  	const props = options.props || {};

  	const $$ = component.$$ = {
  		fragment: null,
  		ctx: null,

  		// state
  		props: prop_names,
  		update: noop,
  		not_equal: not_equal$$1,
  		bound: blank_object(),

  		// lifecycle
  		on_mount: [],
  		on_destroy: [],
  		before_render: [],
  		after_render: [],
  		context: new Map(parent_component ? parent_component.$$.context : []),

  		// everything else
  		callbacks: blank_object(),
  		dirty: null
  	};

  	let ready = false;

  	$$.ctx = instance
  		? instance(component, props, (key, value) => {
  			if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
  				if ($$.bound[key]) $$.bound[key](value);
  				if (ready) make_dirty(component, key);
  			}
  		})
  		: props;

  	$$.update();
  	ready = true;
  	run_all($$.before_render);
  	$$.fragment = create_fragment($$.ctx);

  	if (options.target) {
  		if (options.hydrate) {
  			$$.fragment.l(children(options.target));
  		} else {
  			$$.fragment.c();
  		}

  		if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
  		mount_component(component, options.target, options.anchor);
  		flush();
  	}

  	set_current_component(parent_component);
  }

  class SvelteComponent {
  	$destroy() {
  		destroy(this, true);
  		this.$destroy = noop;
  	}

  	$on(type, callback) {
  		const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
  		callbacks.push(callback);

  		return () => {
  			const index = callbacks.indexOf(callback);
  			if (index !== -1) callbacks.splice(index, 1);
  		};
  	}

  	$set() {
  		// overridden by instance, if it has props
  	}
  }

  class SvelteComponentDev extends SvelteComponent {
  	constructor(options) {
  		if (!options || (!options.target && !options.$$inline)) {
  			throw new Error(`'target' is a required option`);
  		}

  		super();
  	}

  	$destroy() {
  		super.$destroy();
  		this.$destroy = () => {
  			console.warn(`Component was already destroyed`); // eslint-disable-line no-console
  		};
  	}
  }

  function noop$1() {}

  function run$1(fn) {
  	return fn();
  }

  function run_all$1(fns) {
  	fns.forEach(run$1);
  }

  function safe_not_equal$1(a, b) {
  	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }

  function readable(value, start) {
      return {
          subscribe: writable(value, start).subscribe,
      };
  }
  function writable(value, start = noop$1) {
      let stop;
      const subscribers = [];
      function set(new_value) {
          if (safe_not_equal$1(value, new_value)) {
              value = new_value;
              if (!stop) {
                  return; // not ready
              }
              subscribers.forEach((s) => s[1]());
              subscribers.forEach((s) => s[0](value));
          }
      }
      function update(fn) {
          set(fn(value));
      }
      function subscribe$$1(run$$1, invalidate = noop$1) {
          const subscriber = [run$$1, invalidate];
          subscribers.push(subscriber);
          if (subscribers.length === 1) {
              stop = start(set) || noop$1;
          }
          run$$1(value);
          return () => {
              const index = subscribers.indexOf(subscriber);
              if (index !== -1) {
                  subscribers.splice(index, 1);
              }
              if (subscribers.length === 0) {
                  stop();
              }
          };
      }
      return { set, update, subscribe: subscribe$$1 };
  }
  function derived(stores, fn, initial_value) {
      const single = !Array.isArray(stores);
      const stores_array = single
          ? [stores]
          : stores;
      const auto = fn.length < 2;
      return readable(initial_value, (set) => {
          let inited = false;
          const values = [];
          let pending = 0;
          let cleanup = noop$1;
          const sync = () => {
              if (pending) {
                  return;
              }
              cleanup();
              const result = fn(single ? values[0] : values, set);
              if (auto) {
                  set(result);
              }
              else {
                  cleanup = result || noop$1;
              }
          };
          const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
              values[i] = value;
              pending &= ~(1 << i);
              if (inited) {
                  sync();
              }
          }, () => {
              pending |= (1 << i);
          }));
          inited = true;
          sync();
          return function stop() {
              run_all$1(unsubscribers);
              cleanup();
          };
      });
  }

  /* src/components/HelloWorld.svelte generated by Svelte v3.4.0 */

  var bind = function bind(fn, thisArg) {
    return function wrap() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      return fn.apply(thisArg, args);
    };
  };

  /*global toString:true*/

  // utils is a library of generic helper functions non-specific to axios

  var toString = Object.prototype.toString;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Array, otherwise false
   */
  function isArray(val) {
    return toString.call(val) === '[object Array]';
  }

  /**
   * Determine if a value is undefined
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  function isUndefined(val) {
    return typeof val === 'undefined';
  }

  /**
   * Determine if a value is a Buffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Buffer, otherwise false
   */
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
      && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  function isArrayBuffer(val) {
    return toString.call(val) === '[object ArrayBuffer]';
  }

  /**
   * Determine if a value is a FormData
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  function isFormData(val) {
    return (typeof FormData !== 'undefined') && (val instanceof FormData);
  }

  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    var result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
      result = ArrayBuffer.isView(val);
    } else {
      result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a String, otherwise false
   */
  function isString(val) {
    return typeof val === 'string';
  }

  /**
   * Determine if a value is a Number
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Number, otherwise false
   */
  function isNumber(val) {
    return typeof val === 'number';
  }

  /**
   * Determine if a value is an Object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Object, otherwise false
   */
  function isObject(val) {
    return val !== null && typeof val === 'object';
  }

  /**
   * Determine if a value is a Date
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Date, otherwise false
   */
  function isDate(val) {
    return toString.call(val) === '[object Date]';
  }

  /**
   * Determine if a value is a File
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a File, otherwise false
   */
  function isFile(val) {
    return toString.call(val) === '[object File]';
  }

  /**
   * Determine if a value is a Blob
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  function isBlob(val) {
    return toString.call(val) === '[object Blob]';
  }

  /**
   * Determine if a value is a Function
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  /**
   * Determine if a value is a Stream
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  function isStream(val) {
    return isObject(val) && isFunction(val.pipe);
  }

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
  }

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   * @returns {String} The String freed of excess whitespace
   */
  function trim(str) {
    return str.replace(/^\s*/, '').replace(/\s*$/, '');
  }

  /**
   * Determine if we're running in a standard browser environment
   *
   * This allows axios to run in a web worker, and react-native.
   * Both environments support XMLHttpRequest, but not fully standard globals.
   *
   * web workers:
   *  typeof window -> undefined
   *  typeof document -> undefined
   *
   * react-native:
   *  navigator.product -> 'ReactNative'
   * nativescript
   *  navigator.product -> 'NativeScript' or 'NS'
   */
  function isStandardBrowserEnv() {
    if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                             navigator.product === 'NativeScript' ||
                                             navigator.product === 'NS')) {
      return false;
    }
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    );
  }

  /**
   * Iterate over an Array or an Object invoking a function for each item.
   *
   * If `obj` is an Array callback will be called passing
   * the value, index, and complete array for each item.
   *
   * If 'obj' is an Object callback will be called passing
   * the value, key, and complete object for each property.
   *
   * @param {Object|Array} obj The object to iterate
   * @param {Function} fn The callback to invoke for each item
   */
  function forEach(obj, fn) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
      return;
    }

    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }

  /**
   * Accepts varargs expecting each argument to be an object, then
   * immutably merges the properties of each object and returns result.
   *
   * When multiple objects contain the same key the later object in
   * the arguments list will take precedence.
   *
   * Example:
   *
   * ```js
   * var result = merge({foo: 123}, {foo: 456});
   * console.log(result.foo); // outputs 456
   * ```
   *
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === 'object' && typeof val === 'object') {
        result[key] = merge(result[key], val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Function equal to merge with the difference being that no reference
   * to original objects is kept.
   *
   * @see merge
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function deepMerge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === 'object' && typeof val === 'object') {
        result[key] = deepMerge(result[key], val);
      } else if (typeof val === 'object') {
        result[key] = deepMerge({}, val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   * @return {Object} The resulting value of object a
   */
  function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
      if (thisArg && typeof val === 'function') {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    });
    return a;
  }

  var utils = {
    isArray: isArray,
    isArrayBuffer: isArrayBuffer,
    isBuffer: isBuffer,
    isFormData: isFormData,
    isArrayBufferView: isArrayBufferView,
    isString: isString,
    isNumber: isNumber,
    isObject: isObject,
    isUndefined: isUndefined,
    isDate: isDate,
    isFile: isFile,
    isBlob: isBlob,
    isFunction: isFunction,
    isStream: isStream,
    isURLSearchParams: isURLSearchParams,
    isStandardBrowserEnv: isStandardBrowserEnv,
    forEach: forEach,
    merge: merge,
    deepMerge: deepMerge,
    extend: extend,
    trim: trim
  };

  function encode(val) {
    return encodeURIComponent(val).
      replace(/%40/gi, '@').
      replace(/%3A/gi, ':').
      replace(/%24/g, '$').
      replace(/%2C/gi, ',').
      replace(/%20/g, '+').
      replace(/%5B/gi, '[').
      replace(/%5D/gi, ']');
  }

  /**
   * Build a URL by appending params to the end
   *
   * @param {string} url The base of the url (e.g., http://www.google.com)
   * @param {object} [params] The params to be appended
   * @returns {string} The formatted url
   */
  var buildURL = function buildURL(url, params, paramsSerializer) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }

    var serializedParams;
    if (paramsSerializer) {
      serializedParams = paramsSerializer(params);
    } else if (utils.isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      var parts = [];

      utils.forEach(params, function serialize(val, key) {
        if (val === null || typeof val === 'undefined') {
          return;
        }

        if (utils.isArray(val)) {
          key = key + '[]';
        } else {
          val = [val];
        }

        utils.forEach(val, function parseValue(v) {
          if (utils.isDate(v)) {
            v = v.toISOString();
          } else if (utils.isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(encode(key) + '=' + encode(v));
        });
      });

      serializedParams = parts.join('&');
    }

    if (serializedParams) {
      var hashmarkIndex = url.indexOf('#');
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }

      url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
  };

  function InterceptorManager() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected
    });
    return this.handlers.length - 1;
  };

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   */
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   */
  InterceptorManager.prototype.forEach = function forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };

  var InterceptorManager_1 = InterceptorManager;

  /**
   * Transform the data for a request or a response
   *
   * @param {Object|String} data The data to be transformed
   * @param {Array} headers The headers for the request or response
   * @param {Array|Function} fns A single function or Array of functions
   * @returns {*} The resulting transformed data
   */
  var transformData = function transformData(data, headers, fns) {
    /*eslint no-param-reassign:0*/
    utils.forEach(fns, function transform(fn) {
      data = fn(data, headers);
    });

    return data;
  };

  var isCancel = function isCancel(value) {
    return !!(value && value.__CANCEL__);
  };

  var global$1 = (typeof global !== "undefined" ? global :
              typeof self !== "undefined" ? self :
              typeof window !== "undefined" ? window : {});

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
      throw new Error('clearTimeout has not been defined');
  }
  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;
  if (typeof global$1.setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
  }
  if (typeof global$1.clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch(e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch(e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }


  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }



  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }

  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }
  function nextTick(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  }
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  var title = 'browser';
  var platform = 'browser';
  var browser = true;
  var env = {};
  var argv = [];
  var version = ''; // empty string to avoid regexp issues
  var versions = {};
  var release = {};
  var config = {};

  function noop$2() {}

  var on = noop$2;
  var addListener = noop$2;
  var once = noop$2;
  var off = noop$2;
  var removeListener = noop$2;
  var removeAllListeners = noop$2;
  var emit = noop$2;

  function binding(name) {
      throw new Error('process.binding is not supported');
  }

  function cwd () { return '/' }
  function chdir (dir) {
      throw new Error('process.chdir is not supported');
  }function umask() { return 0; }

  // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
  var performance = global$1.performance || {};
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() };

  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  function hrtime(previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime%1)*1e9);
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds<0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }
    return [seconds,nanoseconds]
  }

  var startTime = new Date();
  function uptime() {
    var currentTime = new Date();
    var dif = currentTime - startTime;
    return dif / 1000;
  }

  var process = {
    nextTick: nextTick,
    title: title,
    browser: browser,
    env: env,
    argv: argv,
    version: version,
    versions: versions,
    on: on,
    addListener: addListener,
    once: once,
    off: off,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners,
    emit: emit,
    binding: binding,
    cwd: cwd,
    chdir: chdir,
    umask: umask,
    hrtime: hrtime,
    platform: platform,
    release: release,
    config: config,
    uptime: uptime
  };

  var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
    utils.forEach(headers, function processHeader(value, name) {
      if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
        headers[normalizedName] = value;
        delete headers[name];
      }
    });
  };

  /**
   * Update an Error with the specified config, error code, and response.
   *
   * @param {Error} error The error to update.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The error.
   */
  var enhanceError = function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
      error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: this.config,
        code: this.code
      };
    };
    return error;
  };

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The created error.
   */
  var createError = function createError(message, config, code, request, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, request, response);
  };

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   */
  var settle = function settle(resolve, reject, response) {
    var validateStatus = response.config.validateStatus;
    if (!validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(createError(
        'Request failed with status code ' + response.status,
        response.config,
        null,
        response.request,
        response
      ));
    }
  };

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  var isAbsoluteURL = function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
  };

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   * @returns {string} The combined URL
   */
  var combineURLs = function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL;
  };

  /**
   * Creates a new URL by combining the baseURL with the requestedURL,
   * only when the requestedURL is not already an absolute URL.
   * If the requestURL is absolute, this function returns the requestedURL untouched.
   *
   * @param {string} baseURL The base URL
   * @param {string} requestedURL Absolute or relative URL to combine
   * @returns {string} The combined full path
   */
  var buildFullPath = function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  };

  // Headers whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  var ignoreDuplicateOf = [
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ];

  /**
   * Parse headers into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} headers Headers needing to be parsed
   * @returns {Object} Headers parsed into an object
   */
  var parseHeaders = function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;

    if (!headers) { return parsed; }

    utils.forEach(headers.split('\n'), function parser(line) {
      i = line.indexOf(':');
      key = utils.trim(line.substr(0, i)).toLowerCase();
      val = utils.trim(line.substr(i + 1));

      if (key) {
        if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
          return;
        }
        if (key === 'set-cookie') {
          parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      }
    });

    return parsed;
  };

  var isURLSameOrigin = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        var urlParsingNode = document.createElement('a');
        var originURL;

        /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
        function resolveURL(url) {
          var href = url;

          if (msie) {
          // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute('href', href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }

        originURL = resolveURL(window.location.href);

        /**
      * Determine if a URL shares the same origin as the current location
      *
      * @param {String} requestURL The URL to test
      * @returns {boolean} True if URL shares the same origin, otherwise false
      */
        return function isURLSameOrigin(requestURL) {
          var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })()
  );

  var cookies = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs support document.cookie
      (function standardBrowserEnv() {
        return {
          write: function write(name, value, expires, path, domain, secure) {
            var cookie = [];
            cookie.push(name + '=' + encodeURIComponent(value));

            if (utils.isNumber(expires)) {
              cookie.push('expires=' + new Date(expires).toGMTString());
            }

            if (utils.isString(path)) {
              cookie.push('path=' + path);
            }

            if (utils.isString(domain)) {
              cookie.push('domain=' + domain);
            }

            if (secure === true) {
              cookie.push('secure');
            }

            document.cookie = cookie.join('; ');
          },

          read: function read(name) {
            var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
            return (match ? decodeURIComponent(match[3]) : null);
          },

          remove: function remove(name) {
            this.write(name, '', Date.now() - 86400000);
          }
        };
      })() :

    // Non standard browser env (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return {
          write: function write() {},
          read: function read() { return null; },
          remove: function remove() {}
        };
      })()
  );

  var xhr = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      var requestData = config.data;
      var requestHeaders = config.headers;

      if (utils.isFormData(requestData)) {
        delete requestHeaders['Content-Type']; // Let the browser set it
      }

      var request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        var username = config.auth.username || '';
        var password = config.auth.password || '';
        requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
      }

      var fullPath = buildFullPath(config.baseURL, config.url);
      request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

      // Set the request timeout in MS
      request.timeout = config.timeout;

      // Listen for ready state
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }

        // Prepare the response
        var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
        var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
        var response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config,
          request: request
        };

        settle(resolve, reject, response);

        // Clean up request
        request = null;
      };

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(createError('Request aborted', config, 'ECONNABORTED', request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(createError('Network Error', config, null, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
          request));

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (utils.isStandardBrowserEnv()) {
        var cookies$1 = cookies;

        // Add xsrf header
        var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
          cookies$1.read(config.xsrfCookieName) :
          undefined;

        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }

      // Add headers to the request
      if ('setRequestHeader' in request) {
        utils.forEach(requestHeaders, function setRequestHeader(val, key) {
          if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
            // Remove Content-Type if data is undefined
            delete requestHeaders[key];
          } else {
            // Otherwise add header to the request
            request.setRequestHeader(key, val);
          }
        });
      }

      // Add withCredentials to request if needed
      if (!utils.isUndefined(config.withCredentials)) {
        request.withCredentials = !!config.withCredentials;
      }

      // Add responseType to request if needed
      if (config.responseType) {
        try {
          request.responseType = config.responseType;
        } catch (e) {
          // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
          // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
          if (config.responseType !== 'json') {
            throw e;
          }
        }
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === 'function') {
        request.addEventListener('progress', config.onDownloadProgress);
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === 'function' && request.upload) {
        request.upload.addEventListener('progress', config.onUploadProgress);
      }

      if (config.cancelToken) {
        // Handle cancellation
        config.cancelToken.promise.then(function onCanceled(cancel) {
          if (!request) {
            return;
          }

          request.abort();
          reject(cancel);
          // Clean up request
          request = null;
        });
      }

      if (requestData === undefined) {
        requestData = null;
      }

      // Send the request
      request.send(requestData);
    });
  };

  var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  function setContentTypeIfUnset(headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
      headers['Content-Type'] = value;
    }
  }

  function getDefaultAdapter() {
    var adapter;
    if (typeof XMLHttpRequest !== 'undefined') {
      // For browsers use XHR adapter
      adapter = xhr;
    } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
      // For node use HTTP adapter
      adapter = xhr;
    }
    return adapter;
  }

  var defaults = {
    adapter: getDefaultAdapter(),

    transformRequest: [function transformRequest(data, headers) {
      normalizeHeaderName(headers, 'Accept');
      normalizeHeaderName(headers, 'Content-Type');
      if (utils.isFormData(data) ||
        utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      if (utils.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils.isURLSearchParams(data)) {
        setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
        return data.toString();
      }
      if (utils.isObject(data)) {
        setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
        return JSON.stringify(data);
      }
      return data;
    }],

    transformResponse: [function transformResponse(data) {
      /*eslint no-param-reassign:0*/
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) { /* Ignore */ }
      }
      return data;
    }],

    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',

    maxContentLength: -1,

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };

  defaults.headers = {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  };

  utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
  });

  var defaults_1 = defaults;

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   * @returns {Promise} The Promise to be fulfilled
   */
  var dispatchRequest = function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    // Ensure headers exist
    config.headers = config.headers || {};

    // Transform request data
    config.data = transformData(
      config.data,
      config.headers,
      config.transformRequest
    );

    // Flatten headers
    config.headers = utils.merge(
      config.headers.common || {},
      config.headers[config.method] || {},
      config.headers
    );

    utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      function cleanHeaderConfig(method) {
        delete config.headers[method];
      }
    );

    var adapter = config.adapter || defaults_1.adapter;

    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData(
        response.data,
        response.headers,
        config.transformResponse
      );

      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData(
            reason.response.data,
            reason.response.headers,
            config.transformResponse
          );
        }
      }

      return Promise.reject(reason);
    });
  };

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   * @returns {Object} New object resulting from merging config2 to config1
   */
  var mergeConfig = function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    var config = {};

    var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
    var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
    var defaultToConfig2Keys = [
      'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
      'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
      'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
      'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
      'httpsAgent', 'cancelToken', 'socketPath'
    ];

    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      }
    });

    utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
      if (utils.isObject(config2[prop])) {
        config[prop] = utils.deepMerge(config1[prop], config2[prop]);
      } else if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      } else if (utils.isObject(config1[prop])) {
        config[prop] = utils.deepMerge(config1[prop]);
      } else if (typeof config1[prop] !== 'undefined') {
        config[prop] = config1[prop];
      }
    });

    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      } else if (typeof config1[prop] !== 'undefined') {
        config[prop] = config1[prop];
      }
    });

    var axiosKeys = valueFromConfig2Keys
      .concat(mergeDeepPropertiesKeys)
      .concat(defaultToConfig2Keys);

    var otherKeys = Object
      .keys(config2)
      .filter(function filterAxiosKeys(key) {
        return axiosKeys.indexOf(key) === -1;
      });

    utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop];
      } else if (typeof config1[prop] !== 'undefined') {
        config[prop] = config1[prop];
      }
    });

    return config;
  };

  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  function Axios(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager_1(),
      response: new InterceptorManager_1()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  Axios.prototype.request = function request(config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    config = mergeConfig(this.defaults, config);

    // Set config.method
    if (config.method) {
      config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
      config.method = this.defaults.method.toLowerCase();
    } else {
      config.method = 'get';
    }

    // Hook up interceptors middleware
    var chain = [dispatchRequest, undefined];
    var promise = Promise.resolve(config);

    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  };

  Axios.prototype.getUri = function getUri(config) {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
  };

  // Provide aliases for supported request methods
  utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url
      }));
    };
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, data, config) {
      return this.request(utils.merge(config || {}, {
        method: method,
        url: url,
        data: data
      }));
    };
  });

  var Axios_1 = Axios;

  /**
   * A `Cancel` is an object that is thrown when an operation is canceled.
   *
   * @class
   * @param {string=} message The message.
   */
  function Cancel(message) {
    this.message = message;
  }

  Cancel.prototype.toString = function toString() {
    return 'Cancel' + (this.message ? ': ' + this.message : '');
  };

  Cancel.prototype.__CANCEL__ = true;

  var Cancel_1 = Cancel;

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @class
   * @param {Function} executor The executor function.
   */
  function CancelToken(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    var resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    var token = this;
    executor(function cancel(message) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new Cancel_1(message);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  CancelToken.prototype.throwIfRequested = function throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  };

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  CancelToken.source = function source() {
    var cancel;
    var token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token: token,
      cancel: cancel
    };
  };

  var CancelToken_1 = CancelToken;

  /**
   * Syntactic sugar for invoking a function and expanding an array for arguments.
   *
   * Common use case would be to use `Function.prototype.apply`.
   *
   *  ```js
   *  function f(x, y, z) {}
   *  var args = [1, 2, 3];
   *  f.apply(null, args);
   *  ```
   *
   * With `spread` this example can be re-written.
   *
   *  ```js
   *  spread(function(x, y, z) {})([1, 2, 3]);
   *  ```
   *
   * @param {Function} callback
   * @returns {Function}
   */
  var spread = function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  };

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   * @return {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    var context = new Axios_1(defaultConfig);
    var instance = bind(Axios_1.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios_1.prototype, context);

    // Copy context to instance
    utils.extend(instance, context);

    return instance;
  }

  // Create the default instance to be exported
  var axios = createInstance(defaults_1);

  // Expose Axios class to allow class inheritance
  axios.Axios = Axios_1;

  // Factory for creating new instances
  axios.create = function create(instanceConfig) {
    return createInstance(mergeConfig(axios.defaults, instanceConfig));
  };

  // Expose Cancel & CancelToken
  axios.Cancel = Cancel_1;
  axios.CancelToken = CancelToken_1;
  axios.isCancel = isCancel;

  // Expose all/spread
  axios.all = function all(promises) {
    return Promise.all(promises);
  };
  axios.spread = spread;

  var axios_1 = axios;

  // Allow use of default import syntax in TypeScript
  var default_1 = axios;
  axios_1.default = default_1;

  var axios$1 = axios_1;

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var node = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  /**
   * Node Class as base class for TextNode and HTMLElement.
   */
  var Node = /** @class */ (function () {
      function Node() {
          this.childNodes = [];
      }
      return Node;
  }());
  exports.default = Node;
  });

  unwrapExports(node);

  var type = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var NodeType;
  (function (NodeType) {
      NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
      NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
      NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
  })(NodeType || (NodeType = {}));
  exports.default = NodeType;
  });

  unwrapExports(type);

  var comment = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var node_1 = __importDefault(node);
  var type_1 = __importDefault(type);
  var CommentNode = /** @class */ (function (_super) {
      __extends(CommentNode, _super);
      function CommentNode(value) {
          var _this = _super.call(this) || this;
          /**
           * Node Type declaration.
           * @type {Number}
           */
          _this.nodeType = type_1.default.COMMENT_NODE;
          _this.rawText = value;
          return _this;
      }
      Object.defineProperty(CommentNode.prototype, "text", {
          /**
           * Get unescaped text value of current node and its children.
           * @return {string} text content
           */
          get: function () {
              return this.rawText;
          },
          enumerable: true,
          configurable: true
      });
      CommentNode.prototype.toString = function () {
          return "<!--" + this.rawText + "-->";
      };
      return CommentNode;
  }(node_1.default));
  exports.default = CommentNode;
  });

  unwrapExports(comment);

  var he = createCommonjsModule(function (module, exports) {
  (function(root) {

  	// Detect free variables `exports`.
  	var freeExports = exports;

  	// Detect free variable `module`.
  	var freeModule = module &&
  		module.exports == freeExports && module;

  	// Detect free variable `global`, from Node.js or Browserified code,
  	// and use it as `root`.
  	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
  	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
  		root = freeGlobal;
  	}

  	/*--------------------------------------------------------------------------*/

  	// All astral symbols.
  	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  	// All ASCII symbols (not just printable ASCII) except those listed in the
  	// first column of the overrides table.
  	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
  	var regexAsciiWhitelist = /[\x01-\x7F]/g;
  	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
  	// code points listed in the first column of the overrides table on
  	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
  	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

  	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
  	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

  	var regexEscape = /["&'<>`]/g;
  	var escapeMap = {
  		'"': '&quot;',
  		'&': '&amp;',
  		'\'': '&#x27;',
  		'<': '&lt;',
  		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
  		// following is not strictly necessary unless it’s part of a tag or an
  		// unquoted attribute value. We’re only escaping it to support those
  		// situations, and for XML support.
  		'>': '&gt;',
  		// In Internet Explorer ≤ 8, the backtick character can be used
  		// to break out of (un)quoted attribute values or HTML comments.
  		// See http://html5sec.org/#102, http://html5sec.org/#108, and
  		// http://html5sec.org/#133.
  		'`': '&#x60;'
  	};

  	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
  	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  	var regexDecode = /&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)([=a-zA-Z0-9])?/g;
  	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
  	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
  	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
  	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

  	/*--------------------------------------------------------------------------*/

  	var stringFromCharCode = String.fromCharCode;

  	var object = {};
  	var hasOwnProperty = object.hasOwnProperty;
  	var has = function(object, propertyName) {
  		return hasOwnProperty.call(object, propertyName);
  	};

  	var contains = function(array, value) {
  		var index = -1;
  		var length = array.length;
  		while (++index < length) {
  			if (array[index] == value) {
  				return true;
  			}
  		}
  		return false;
  	};

  	var merge = function(options, defaults) {
  		if (!options) {
  			return defaults;
  		}
  		var result = {};
  		var key;
  		for (key in defaults) {
  			// A `hasOwnProperty` check is not needed here, since only recognized
  			// option names are used anyway. Any others are ignored.
  			result[key] = has(options, key) ? options[key] : defaults[key];
  		}
  		return result;
  	};

  	// Modified version of `ucs2encode`; see https://mths.be/punycode.
  	var codePointToSymbol = function(codePoint, strict) {
  		var output = '';
  		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
  			// See issue #4:
  			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
  			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
  			// REPLACEMENT CHARACTER.”
  			if (strict) {
  				parseError('character reference outside the permissible Unicode range');
  			}
  			return '\uFFFD';
  		}
  		if (has(decodeMapNumeric, codePoint)) {
  			if (strict) {
  				parseError('disallowed character reference');
  			}
  			return decodeMapNumeric[codePoint];
  		}
  		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
  			parseError('disallowed character reference');
  		}
  		if (codePoint > 0xFFFF) {
  			codePoint -= 0x10000;
  			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
  			codePoint = 0xDC00 | codePoint & 0x3FF;
  		}
  		output += stringFromCharCode(codePoint);
  		return output;
  	};

  	var hexEscape = function(codePoint) {
  		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
  	};

  	var decEscape = function(codePoint) {
  		return '&#' + codePoint + ';';
  	};

  	var parseError = function(message) {
  		throw Error('Parse error: ' + message);
  	};

  	/*--------------------------------------------------------------------------*/

  	var encode = function(string, options) {
  		options = merge(options, encode.options);
  		var strict = options.strict;
  		if (strict && regexInvalidRawCodePoint.test(string)) {
  			parseError('forbidden code point');
  		}
  		var encodeEverything = options.encodeEverything;
  		var useNamedReferences = options.useNamedReferences;
  		var allowUnsafeSymbols = options.allowUnsafeSymbols;
  		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

  		var escapeBmpSymbol = function(symbol) {
  			return escapeCodePoint(symbol.charCodeAt(0));
  		};

  		if (encodeEverything) {
  			// Encode ASCII symbols.
  			string = string.replace(regexAsciiWhitelist, function(symbol) {
  				// Use named references if requested & possible.
  				if (useNamedReferences && has(encodeMap, symbol)) {
  					return '&' + encodeMap[symbol] + ';';
  				}
  				return escapeBmpSymbol(symbol);
  			});
  			// Shorten a few escapes that represent two symbols, of which at least one
  			// is within the ASCII range.
  			if (useNamedReferences) {
  				string = string
  					.replace(/&gt;\u20D2/g, '&nvgt;')
  					.replace(/&lt;\u20D2/g, '&nvlt;')
  					.replace(/&#x66;&#x6A;/g, '&fjlig;');
  			}
  			// Encode non-ASCII symbols.
  			if (useNamedReferences) {
  				// Encode non-ASCII symbols that can be replaced with a named reference.
  				string = string.replace(regexEncodeNonAscii, function(string) {
  					// Note: there is no need to check `has(encodeMap, string)` here.
  					return '&' + encodeMap[string] + ';';
  				});
  			}
  			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
  		} else if (useNamedReferences) {
  			// Apply named character references.
  			// Encode `<>"'&` using named character references.
  			if (!allowUnsafeSymbols) {
  				string = string.replace(regexEscape, function(string) {
  					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
  				});
  			}
  			// Shorten escapes that represent two symbols, of which at least one is
  			// `<>"'&`.
  			string = string
  				.replace(/&gt;\u20D2/g, '&nvgt;')
  				.replace(/&lt;\u20D2/g, '&nvlt;');
  			// Encode non-ASCII symbols that can be replaced with a named reference.
  			string = string.replace(regexEncodeNonAscii, function(string) {
  				// Note: there is no need to check `has(encodeMap, string)` here.
  				return '&' + encodeMap[string] + ';';
  			});
  		} else if (!allowUnsafeSymbols) {
  			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
  			// using named character references.
  			string = string.replace(regexEscape, escapeBmpSymbol);
  		}
  		return string
  			// Encode astral symbols.
  			.replace(regexAstralSymbols, function($0) {
  				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
  				var high = $0.charCodeAt(0);
  				var low = $0.charCodeAt(1);
  				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
  				return escapeCodePoint(codePoint);
  			})
  			// Encode any remaining BMP symbols that are not printable ASCII symbols
  			// using a hexadecimal escape.
  			.replace(regexBmpWhitelist, escapeBmpSymbol);
  	};
  	// Expose default options (so they can be overridden globally).
  	encode.options = {
  		'allowUnsafeSymbols': false,
  		'encodeEverything': false,
  		'strict': false,
  		'useNamedReferences': false,
  		'decimal' : false
  	};

  	var decode = function(html, options) {
  		options = merge(options, decode.options);
  		var strict = options.strict;
  		if (strict && regexInvalidEntity.test(html)) {
  			parseError('malformed character reference');
  		}
  		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7) {
  			var codePoint;
  			var semicolon;
  			var decDigits;
  			var hexDigits;
  			var reference;
  			var next;
  			if ($1) {
  				// Decode decimal escapes, e.g. `&#119558;`.
  				decDigits = $1;
  				semicolon = $2;
  				if (strict && !semicolon) {
  					parseError('character reference was not terminated by a semicolon');
  				}
  				codePoint = parseInt(decDigits, 10);
  				return codePointToSymbol(codePoint, strict);
  			}
  			if ($3) {
  				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
  				hexDigits = $3;
  				semicolon = $4;
  				if (strict && !semicolon) {
  					parseError('character reference was not terminated by a semicolon');
  				}
  				codePoint = parseInt(hexDigits, 16);
  				return codePointToSymbol(codePoint, strict);
  			}
  			if ($5) {
  				// Decode named character references with trailing `;`, e.g. `&copy;`.
  				reference = $5;
  				if (has(decodeMap, reference)) {
  					return decodeMap[reference];
  				} else {
  					// Ambiguous ampersand. https://mths.be/notes/ambiguous-ampersands
  					if (strict) {
  						parseError(
  							'named character reference was not terminated by a semicolon'
  						);
  					}
  					return $0;
  				}
  			}
  			// If we’re still here, it’s a legacy reference for sure. No need for an
  			// extra `if` check.
  			// Decode named character references without trailing `;`, e.g. `&amp`
  			// This is only a parse error if it gets converted to `&`, or if it is
  			// followed by `=` in an attribute context.
  			reference = $6;
  			next = $7;
  			if (next && options.isAttributeValue) {
  				if (strict && next == '=') {
  					parseError('`&` did not start a character reference');
  				}
  				return $0;
  			} else {
  				if (strict) {
  					parseError(
  						'named character reference was not terminated by a semicolon'
  					);
  				}
  				// Note: there is no need to check `has(decodeMapLegacy, reference)`.
  				return decodeMapLegacy[reference] + (next || '');
  			}
  		});
  	};
  	// Expose default options (so they can be overridden globally).
  	decode.options = {
  		'isAttributeValue': false,
  		'strict': false
  	};

  	var escape = function(string) {
  		return string.replace(regexEscape, function($0) {
  			// Note: there is no need to check `has(escapeMap, $0)` here.
  			return escapeMap[$0];
  		});
  	};

  	/*--------------------------------------------------------------------------*/

  	var he = {
  		'version': '1.1.1',
  		'encode': encode,
  		'decode': decode,
  		'escape': escape,
  		'unescape': decode
  	};

  	// Some AMD build optimizers, like r.js, check for specific condition patterns
  	// like the following:
  	if (freeExports && !freeExports.nodeType) {
  		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
  			freeModule.exports = he;
  		} else { // in Narwhal or RingoJS v0.7.0-
  			for (var key in he) {
  				has(he, key) && (freeExports[key] = he[key]);
  			}
  		}
  	} else { // in Rhino or a web browser
  		root.he = he;
  	}

  }(commonjsGlobal));
  });

  var text$1 = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var type_1 = __importDefault(type);
  var node_1 = __importDefault(node);
  /**
   * TextNode to contain a text element in DOM tree.
   * @param {string} value [description]
   */
  var TextNode = /** @class */ (function (_super) {
      __extends(TextNode, _super);
      function TextNode(value) {
          var _this = _super.call(this) || this;
          /**
           * Node Type declaration.
           * @type {Number}
           */
          _this.nodeType = type_1.default.TEXT_NODE;
          _this.rawText = value;
          return _this;
      }
      Object.defineProperty(TextNode.prototype, "text", {
          /**
           * Get unescaped text value of current node and its children.
           * @return {string} text content
           */
          get: function () {
              return this.rawText;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(TextNode.prototype, "isWhitespace", {
          /**
           * Detect if the node contains only white space.
           * @return {bool}
           */
          get: function () {
              return /^(\s|&nbsp;)*$/.test(this.rawText);
          },
          enumerable: true,
          configurable: true
      });
      TextNode.prototype.toString = function () {
          return this.text;
      };
      return TextNode;
  }(node_1.default));
  exports.default = TextNode;
  });

  unwrapExports(text$1);

  var matcher = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  /**
   * Cache to store generated match functions
   * @type {Object}
   */
  var pMatchFunctionCache = {};
  /**
   * Function cache
   */
  var functionCache = {
      f145: function (el, tagName, classes) {
          tagName = tagName || '';
          classes = classes || [];
          if (el.id !== tagName.substr(1)) {
              return false;
          }
          for (var cls = classes, i = 0; i < cls.length; i++) {
              if (el.classNames.indexOf(cls[i]) === -1) {
                  return false;
              }
          }
          return true;
      },
      f45: function (el, tagName, classes) {
          tagName = tagName || '';
          classes = classes || [];
          for (var cls = classes, i = 0; i < cls.length; i++) {
              if (el.classNames.indexOf(cls[i]) === -1) {
                  return false;
              }
          }
          return true;
      },
      f15: function (el, tagName) {
          tagName = tagName || '';
          if (el.id !== tagName.substr(1)) {
              return false;
          }
          return true;
      },
      f1: function (el, tagName) {
          tagName = tagName || '';
          if (el.id !== tagName.substr(1)) {
              return false;
          }
      },
      f5: function () {
          return true;
      },
      f55: function (el, tagName, classes, attr_key) {
          tagName = tagName || '';
          classes = classes || [];
          attr_key = attr_key || '';
          var attrs = el.attributes;
          return attrs.hasOwnProperty(attr_key);
      },
      f245: function (el, tagName, classes, attr_key, value) {
          tagName = tagName || '';
          classes = classes || [];
          attr_key = attr_key || '';
          value = value || '';
          var attrs = el.attributes;
          return Object.keys(attrs).some(function (key) {
              var val = attrs[key];
              return key === attr_key && val === value;
          });
          // for (let cls = classes, i = 0; i < cls.length; i++) {if (el.classNames.indexOf(cls[i]) === -1){ return false;}}
          // return true;
      },
      f25: function (el, tagName, classes, attr_key, value) {
          tagName = tagName || '';
          classes = classes || [];
          attr_key = attr_key || '';
          value = value || '';
          var attrs = el.attributes;
          return Object.keys(attrs).some(function (key) {
              var val = attrs[key];
              return key === attr_key && val === value;
          });
          // return true;
      },
      f2: function (el, tagName, classes, attr_key, value) {
          tagName = tagName || '';
          classes = classes || [];
          attr_key = attr_key || '';
          value = value || '';
          var attrs = el.attributes;
          return Object.keys(attrs).some(function (key) {
              var val = attrs[key];
              return key === attr_key && val === value;
          });
      },
      f345: function (el, tagName, classes) {
          tagName = tagName || '';
          classes = classes || [];
          if (el.tagName !== tagName) {
              return false;
          }
          for (var cls = classes, i = 0; i < cls.length; i++) {
              if (el.classNames.indexOf(cls[i]) === -1) {
                  return false;
              }
          }
          return true;
      },
      f35: function (el, tagName) {
          tagName = tagName || '';
          return el.tagName === tagName;
      },
      f3: function (el, tagName) {
          tagName = tagName || '';
          if (el.tagName !== tagName) {
              return false;
          }
      }
  };
  /**
   * Matcher class to make CSS match
   *
   * @class Matcher
   */
  var Matcher = /** @class */ (function () {
      /**
       * Creates an instance of Matcher.
       * @param {string} selector
       *
       * @memberof Matcher
       */
      function Matcher(selector) {
          this.nextMatch = 0;
          functionCache.f5 = functionCache.f5;
          this.matchers = selector.split(' ').map(function (matcher) {
              if (pMatchFunctionCache[matcher])
                  return pMatchFunctionCache[matcher];
              var parts = matcher.split('.');
              var tagName = parts[0];
              var classes = parts.slice(1).sort();
              // let source = '"use strict";';
              var function_name = 'f';
              var attr_key = '';
              var value = '';
              if (tagName && tagName !== '*') {
                  var reg = void 0;
                  if (tagName.startsWith('#')) {
                      // source += 'if (el.id != ' + JSON.stringify(tagName.substr(1)) + ') return false;';// 1
                      function_name += '1';
                  }
                  else {
                      reg = /^\[\s*(\S+)\s*(=|!=)\s*((((["'])([^\6]*)\6))|(\S*?))\]\s*/.exec(tagName);
                      if (reg) {
                          attr_key = reg[1];
                          var method = reg[2];
                          if (method !== '=' && method !== '!=') {
                              throw new Error('Selector not supported, Expect [key${op}value].op must be =,!=');
                          }
                          if (method === '=') {
                              method = '==';
                          }
                          value = reg[7] || reg[8];
                          // source += `let attrs = el.attributes;for (let key in attrs){const val = attrs[key]; if (key == "${attr_key}" && val == "${value}"){return true;}} return false;`;// 2
                          function_name += '2';
                      }
                      else if (reg = /^\[(.*?)\]/.exec(tagName)) {
                          attr_key = reg[1];
                          function_name += '5';
                      }
                      else {
                          // source += 'if (el.tagName != ' + JSON.stringify(tagName) + ') return false;';// 3
                          function_name += '3';
                      }
                  }
              }
              if (classes.length > 0) {
                  // source += 'for (let cls = ' + JSON.stringify(classes) + ', i = 0; i < cls.length; i++) if (el.classNames.indexOf(cls[i]) === -1) return false;';// 4
                  function_name += '4';
              }
              // source += 'return true;';// 5
              function_name += '5';
              var obj = {
                  func: functionCache[function_name],
                  tagName: tagName || '',
                  classes: classes || '',
                  attr_key: attr_key || '',
                  value: value || ''
              };
              // source = source || '';
              return pMatchFunctionCache[matcher] = obj;
          });
      }
      /**
       * Trying to advance match pointer
       * @param  {HTMLElement} el element to make the match
       * @return {bool}           true when pointer advanced.
       */
      Matcher.prototype.advance = function (el) {
          if (this.nextMatch < this.matchers.length &&
              this.matchers[this.nextMatch].func(el, this.matchers[this.nextMatch].tagName, this.matchers[this.nextMatch].classes, this.matchers[this.nextMatch].attr_key, this.matchers[this.nextMatch].value)) {
              this.nextMatch++;
              return true;
          }
          return false;
      };
      /**
       * Rewind the match pointer
       */
      Matcher.prototype.rewind = function () {
          this.nextMatch--;
      };
      Object.defineProperty(Matcher.prototype, "matched", {
          /**
           * Trying to determine if match made.
           * @return {bool} true when the match is made
           */
          get: function () {
              return this.nextMatch === this.matchers.length;
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Rest match pointer.
       * @return {[type]} [description]
       */
      Matcher.prototype.reset = function () {
          this.nextMatch = 0;
      };
      /**
       * flush cache to free memory
       */
      Matcher.prototype.flushCache = function () {
          pMatchFunctionCache = {};
      };
      return Matcher;
  }());
  exports.default = Matcher;
  });

  unwrapExports(matcher);

  var back = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  function arr_back(arr) {
      return arr[arr.length - 1];
  }
  exports.default = arr_back;
  });

  unwrapExports(back);

  var html = createCommonjsModule(function (module, exports) {
  var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
      var extendStatics = function (d, b) {
          extendStatics = Object.setPrototypeOf ||
              ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
              function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
          return extendStatics(d, b);
      };
      return function (d, b) {
          extendStatics(d, b);
          function __() { this.constructor = d; }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
  })();
  var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });

  var node_1 = __importDefault(node);
  var type_1 = __importDefault(type);
  var text_1 = __importDefault(text$1);
  var matcher_1 = __importDefault(matcher);
  var back_1 = __importDefault(back);
  var comment_1 = __importDefault(comment);
  var kBlockElements = {
      div: true,
      p: true,
      // ul: true,
      // ol: true,
      li: true,
      // table: true,
      // tr: true,
      td: true,
      section: true,
      br: true
  };
  /**
   * HTMLElement, which contains a set of children.
   *
   * Note: this is a minimalist implementation, no complete tree
   *   structure provided (no parentNode, nextSibling,
   *   previousSibling etc).
   * @class HTMLElement
   * @extends {Node}
   */
  var HTMLElement = /** @class */ (function (_super) {
      __extends(HTMLElement, _super);
      /**
       * Creates an instance of HTMLElement.
       * @param keyAttrs	id and class attribute
       * @param [rawAttrs]	attributes in string
       *
       * @memberof HTMLElement
       */
      function HTMLElement(tagName, keyAttrs, rawAttrs, parentNode) {
          if (rawAttrs === void 0) { rawAttrs = ''; }
          if (parentNode === void 0) { parentNode = null; }
          var _this = _super.call(this) || this;
          _this.tagName = tagName;
          _this.rawAttrs = rawAttrs;
          _this.parentNode = parentNode;
          _this.classNames = [];
          /**
           * Node Type declaration.
           */
          _this.nodeType = type_1.default.ELEMENT_NODE;
          _this.rawAttrs = rawAttrs || '';
          _this.parentNode = parentNode || null;
          _this.childNodes = [];
          if (keyAttrs.id) {
              _this.id = keyAttrs.id;
          }
          if (keyAttrs.class) {
              _this.classNames = keyAttrs.class.split(/\s+/);
          }
          return _this;
      }
      /**
       * Remove Child element from childNodes array
       * @param {HTMLElement} node     node to remove
       */
      HTMLElement.prototype.removeChild = function (node) {
          this.childNodes = this.childNodes.filter(function (child) {
              return (child !== node);
          });
      };
      /**
       * Exchanges given child with new child
       * @param {HTMLElement} oldNode     node to exchange
       * @param {HTMLElement} newNode     new node
       */
      HTMLElement.prototype.exchangeChild = function (oldNode, newNode) {
          var idx = -1;
          for (var i = 0; i < this.childNodes.length; i++) {
              if (this.childNodes[i] === oldNode) {
                  idx = i;
                  break;
              }
          }
          this.childNodes[idx] = newNode;
      };
      Object.defineProperty(HTMLElement.prototype, "rawText", {
          /**
           * Get escpaed (as-it) text value of current node and its children.
           * @return {string} text content
           */
          get: function () {
              return this.childNodes.reduce(function (pre, cur) {
                  return pre += cur.rawText;
              }, '');
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(HTMLElement.prototype, "text", {
          /**
           * Get unescaped text value of current node and its children.
           * @return {string} text content
           */
          get: function () {
              return he.decode(this.rawText);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(HTMLElement.prototype, "structuredText", {
          /**
           * Get structured Text (with '\n' etc.)
           * @return {string} structured text
           */
          get: function () {
              var currentBlock = [];
              var blocks = [currentBlock];
              function dfs(node) {
                  if (node.nodeType === type_1.default.ELEMENT_NODE) {
                      if (kBlockElements[node.tagName]) {
                          if (currentBlock.length > 0) {
                              blocks.push(currentBlock = []);
                          }
                          node.childNodes.forEach(dfs);
                          if (currentBlock.length > 0) {
                              blocks.push(currentBlock = []);
                          }
                      }
                      else {
                          node.childNodes.forEach(dfs);
                      }
                  }
                  else if (node.nodeType === type_1.default.TEXT_NODE) {
                      if (node.isWhitespace) {
                          // Whitespace node, postponed output
                          currentBlock.prependWhitespace = true;
                      }
                      else {
                          var text = node.text;
                          if (currentBlock.prependWhitespace) {
                              text = ' ' + text;
                              currentBlock.prependWhitespace = false;
                          }
                          currentBlock.push(text);
                      }
                  }
              }
              dfs(this);
              return blocks
                  .map(function (block) {
                  // Normalize each line's whitespace
                  return block.join('').trim().replace(/\s{2,}/g, ' ');
              })
                  .join('\n').replace(/\s+$/, ''); // trimRight;
          },
          enumerable: true,
          configurable: true
      });
      HTMLElement.prototype.toString = function () {
          var tag = this.tagName;
          if (tag) {
              var is_un_closed = /^meta$/i.test(tag);
              var is_self_closed = /^(img|br|hr|area|base|input|doctype|link)$/i.test(tag);
              var attrs = this.rawAttrs ? ' ' + this.rawAttrs : '';
              if (is_un_closed) {
                  return "<" + tag + attrs + ">";
              }
              else if (is_self_closed) {
                  return "<" + tag + attrs + " />";
              }
              else {
                  return "<" + tag + attrs + ">" + this.innerHTML + "</" + tag + ">";
              }
          }
          else {
              return this.innerHTML;
          }
      };
      Object.defineProperty(HTMLElement.prototype, "innerHTML", {
          get: function () {
              return this.childNodes.map(function (child) {
                  return child.toString();
              }).join('');
          },
          enumerable: true,
          configurable: true
      });
      HTMLElement.prototype.set_content = function (content, options) {
          if (options === void 0) { options = {}; }
          if (content instanceof node_1.default) {
              content = [content];
          }
          else if (typeof content == 'string') {
              var r = parse(content, options);
              content = r.childNodes.length ? r.childNodes : [new text_1.default(content)];
          }
          this.childNodes = content;
      };
      Object.defineProperty(HTMLElement.prototype, "outerHTML", {
          get: function () {
              return this.toString();
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Trim element from right (in block) after seeing pattern in a TextNode.
       * @param  {RegExp} pattern pattern to find
       * @return {HTMLElement}    reference to current node
       */
      HTMLElement.prototype.trimRight = function (pattern) {
          for (var i = 0; i < this.childNodes.length; i++) {
              var childNode = this.childNodes[i];
              if (childNode.nodeType === type_1.default.ELEMENT_NODE) {
                  childNode.trimRight(pattern);
              }
              else {
                  var index = childNode.rawText.search(pattern);
                  if (index > -1) {
                      childNode.rawText = childNode.rawText.substr(0, index);
                      // trim all following nodes.
                      this.childNodes.length = i + 1;
                  }
              }
          }
          return this;
      };
      Object.defineProperty(HTMLElement.prototype, "structure", {
          /**
           * Get DOM structure
           * @return {string} strucutre
           */
          get: function () {
              var res = [];
              var indention = 0;
              function write(str) {
                  res.push('  '.repeat(indention) + str);
              }
              function dfs(node) {
                  var idStr = node.id ? ('#' + node.id) : '';
                  var classStr = node.classNames.length ? ('.' + node.classNames.join('.')) : '';
                  write(node.tagName + idStr + classStr);
                  indention++;
                  node.childNodes.forEach(function (childNode) {
                      if (childNode.nodeType === type_1.default.ELEMENT_NODE) {
                          dfs(childNode);
                      }
                      else if (childNode.nodeType === type_1.default.TEXT_NODE) {
                          if (!childNode.isWhitespace)
                              write('#text');
                      }
                  });
                  indention--;
              }
              dfs(this);
              return res.join('\n');
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Remove whitespaces in this sub tree.
       * @return {HTMLElement} pointer to this
       */
      HTMLElement.prototype.removeWhitespace = function () {
          var _this = this;
          var o = 0;
          this.childNodes.forEach(function (node) {
              if (node.nodeType === type_1.default.TEXT_NODE) {
                  if (node.isWhitespace) {
                      return;
                  }
                  node.rawText = node.rawText.trim();
              }
              else if (node.nodeType === type_1.default.ELEMENT_NODE) {
                  node.removeWhitespace();
              }
              _this.childNodes[o++] = node;
          });
          this.childNodes.length = o;
          return this;
      };
      /**
       * Query CSS selector to find matching nodes.
       * @param  {string}         selector Simplified CSS selector
       * @param  {Matcher}        selector A Matcher instance
       * @return {HTMLElement[]}  matching elements
       */
      HTMLElement.prototype.querySelectorAll = function (selector) {
          var _this = this;
          var matcher;
          if (selector instanceof matcher_1.default) {
              matcher = selector;
              matcher.reset();
          }
          else {
              if (selector.includes(',')) {
                  var selectors = selector.split(',');
                  return Array.from(selectors.reduce(function (pre, cur) {
                      var result = _this.querySelectorAll(cur.trim());
                      return result.reduce(function (p, c) {
                          return p.add(c);
                      }, pre);
                  }, new Set()));
              }
              matcher = new matcher_1.default(selector);
          }
          var stack = [];
          return this.childNodes.reduce(function (res, cur) {
              stack.push([cur, 0, false]);
              while (stack.length) {
                  var state = back_1.default(stack); // get last element
                  var el = state[0];
                  if (state[1] === 0) {
                      // Seen for first time.
                      if (el.nodeType !== type_1.default.ELEMENT_NODE) {
                          stack.pop();
                          continue;
                      }
                      var html_el = el;
                      state[2] = matcher.advance(html_el);
                      if (state[2]) {
                          if (matcher.matched) {
                              res.push(html_el);
                              res.push.apply(res, (html_el.querySelectorAll(selector)));
                              // no need to go further.
                              matcher.rewind();
                              stack.pop();
                              continue;
                          }
                      }
                  }
                  if (state[1] < el.childNodes.length) {
                      stack.push([el.childNodes[state[1]++], 0, false]);
                  }
                  else {
                      if (state[2]) {
                          matcher.rewind();
                      }
                      stack.pop();
                  }
              }
              return res;
          }, []);
      };
      /**
       * Query CSS Selector to find matching node.
       * @param  {string}         selector Simplified CSS selector
       * @param  {Matcher}        selector A Matcher instance
       * @return {HTMLElement}    matching node
       */
      HTMLElement.prototype.querySelector = function (selector) {
          var matcher;
          if (selector instanceof matcher_1.default) {
              matcher = selector;
              matcher.reset();
          }
          else {
              matcher = new matcher_1.default(selector);
          }
          var stack = [];
          for (var _i = 0, _a = this.childNodes; _i < _a.length; _i++) {
              var node = _a[_i];
              stack.push([node, 0, false]);
              while (stack.length) {
                  var state = back_1.default(stack);
                  var el = state[0];
                  if (state[1] === 0) {
                      // Seen for first time.
                      if (el.nodeType !== type_1.default.ELEMENT_NODE) {
                          stack.pop();
                          continue;
                      }
                      state[2] = matcher.advance(el);
                      if (state[2]) {
                          if (matcher.matched) {
                              return el;
                          }
                      }
                  }
                  if (state[1] < el.childNodes.length) {
                      stack.push([el.childNodes[state[1]++], 0, false]);
                  }
                  else {
                      if (state[2])
                          matcher.rewind();
                      stack.pop();
                  }
              }
          }
          return null;
      };
      /**
       * Append a child node to childNodes
       * @param  {Node} node node to append
       * @return {Node}      node appended
       */
      HTMLElement.prototype.appendChild = function (node) {
          // node.parentNode = this;
          this.childNodes.push(node);
          if (node instanceof HTMLElement) {
              node.parentNode = this;
          }
          return node;
      };
      Object.defineProperty(HTMLElement.prototype, "firstChild", {
          /**
           * Get first child node
           * @return {Node} first child node
           */
          get: function () {
              return this.childNodes[0];
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(HTMLElement.prototype, "lastChild", {
          /**
           * Get last child node
           * @return {Node} last child node
           */
          get: function () {
              return back_1.default(this.childNodes);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(HTMLElement.prototype, "attributes", {
          /**
           * Get attributes
           * @return {Object} parsed and unescaped attributes
           */
          get: function () {
              if (this._attrs) {
                  return this._attrs;
              }
              this._attrs = {};
              var attrs = this.rawAttributes;
              for (var key in attrs) {
                  var val = attrs[key] || '';
                  this._attrs[key] = he.decode(val);
              }
              return this._attrs;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(HTMLElement.prototype, "rawAttributes", {
          /**
           * Get escaped (as-it) attributes
           * @return {Object} parsed attributes
           */
          get: function () {
              if (this._rawAttrs)
                  return this._rawAttrs;
              var attrs = {};
              if (this.rawAttrs) {
                  var re = /\b([a-z][a-z0-9\-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/ig;
                  var match = void 0;
                  while (match = re.exec(this.rawAttrs)) {
                      attrs[match[1]] = match[2] || match[3] || match[4] || null;
                  }
              }
              this._rawAttrs = attrs;
              return attrs;
          },
          enumerable: true,
          configurable: true
      });
      HTMLElement.prototype.removeAttribute = function (key) {
          var attrs = this.rawAttributes;
          delete attrs[key];
          // Update this.attribute
          if (this._attrs) {
              delete this._attrs[key];
          }
          // Update rawString
          this.rawAttrs = Object.keys(attrs).map(function (name) {
              var val = JSON.stringify(attrs[name]);
              if (val === undefined || val === 'null') {
                  return name;
              }
              else {
                  return name + '=' + val;
              }
          }).join(' ');
      };
      HTMLElement.prototype.hasAttribute = function (key) {
          return key in this.attributes;
      };
      /**
       * Get an attribute
       * @return {string} value of the attribute
       */
      HTMLElement.prototype.getAttribute = function (key) {
          return this.attributes[key];
      };
      /**
       * Set an attribute value to the HTMLElement
       * @param {string} key The attribute name
       * @param {string} value The value to set, or null / undefined to remove an attribute
       */
      HTMLElement.prototype.setAttribute = function (key, value) {
          if (arguments.length < 2) {
              throw new Error('Failed to execute \'setAttribute\' on \'Element\'');
          }
          var attrs = this.rawAttributes;
          attrs[key] = String(value);
          if (this._attrs) {
              this._attrs[key] = he.decode(attrs[key]);
          }
          // Update rawString
          this.rawAttrs = Object.keys(attrs).map(function (name) {
              var val = JSON.stringify(attrs[name]);
              if (val === undefined || val === 'null') {
                  return name;
              }
              else {
                  return name + '=' + val;
              }
          }).join(' ');
      };
      /**
       * Replace all the attributes of the HTMLElement by the provided attributes
       * @param {Attributes} attributes the new attribute set
       */
      HTMLElement.prototype.setAttributes = function (attributes) {
          // Invalidate current this.attributes
          if (this._attrs) {
              delete this._attrs;
          }
          // Invalidate current this.rawAttributes
          if (this._rawAttrs) {
              delete this._rawAttrs;
          }
          // Update rawString
          this.rawAttrs = Object.keys(attributes).map(function (name) {
              var val = attributes[name];
              if (val === undefined || val === null) {
                  return name;
              }
              else {
                  return name + '=' + JSON.stringify(String(val));
              }
          }).join(' ');
      };
      HTMLElement.prototype.insertAdjacentHTML = function (where, html) {
          var _a, _b;
          var _this = this;
          if (arguments.length < 2) {
              throw new Error('2 arguments required');
          }
          var p = parse(html);
          if (where === 'afterend') {
              p.childNodes.forEach(function (n) {
                  _this.parentNode.appendChild(n);
              });
          }
          else if (where === 'afterbegin') {
              (_a = this.childNodes).unshift.apply(_a, p.childNodes);
          }
          else if (where === 'beforeend') {
              p.childNodes.forEach(function (n) {
                  _this.appendChild(n);
              });
          }
          else if (where === 'beforebegin') {
              (_b = this.parentNode.childNodes).unshift.apply(_b, p.childNodes);
          }
          else {
              throw new Error("The value provided ('" + where + "') is not one of 'beforebegin', 'afterbegin', 'beforeend', or 'afterend'");
          }
          if (!where || html === undefined || html === null) {
              return;
          }
      };
      return HTMLElement;
  }(node_1.default));
  exports.default = HTMLElement;
  // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
  var kMarkupPattern = /<!--[^]*?(?=-->)-->|<(\/?)([a-z][-.:0-9_a-z]*)\s*([^>]*?)(\/?)>/ig;
  var kAttributePattern = /(^|\s)(id|class)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/ig;
  var kSelfClosingElements = {
      area: true,
      base: true,
      br: true,
      col: true,
      hr: true,
      img: true,
      input: true,
      link: true,
      meta: true,
      source: true
  };
  var kElementsClosedByOpening = {
      li: { li: true },
      p: { p: true, div: true },
      b: { div: true },
      td: { td: true, th: true },
      th: { td: true, th: true },
      h1: { h1: true },
      h2: { h2: true },
      h3: { h3: true },
      h4: { h4: true },
      h5: { h5: true },
      h6: { h6: true }
  };
  var kElementsClosedByClosing = {
      li: { ul: true, ol: true },
      a: { div: true },
      b: { div: true },
      i: { div: true },
      p: { div: true },
      td: { tr: true, table: true },
      th: { tr: true, table: true }
  };
  var kBlockTextElements = {
      script: true,
      noscript: true,
      style: true,
      pre: true
  };
  /**
   * Parses HTML and returns a root element
   * Parse a chuck of HTML source.
   * @param  {string} data      html
   * @return {HTMLElement}      root element
   */
  function parse(data, options) {
      if (options === void 0) { options = {}; }
      var root = new HTMLElement(null, {});
      var currentParent = root;
      var stack = [root];
      var lastTextPos = -1;
      var match;
      var _loop_1 = function () {
          if (lastTextPos > -1) {
              if (lastTextPos + match[0].length < kMarkupPattern.lastIndex) {
                  // if has content
                  var text = data.substring(lastTextPos, kMarkupPattern.lastIndex - match[0].length);
                  currentParent.appendChild(new text_1.default(text));
              }
          }
          lastTextPos = kMarkupPattern.lastIndex;
          if (match[0][1] === '!') {
              // this is a comment
              if (options.comment) {
                  // Only keep what is in between <!-- and -->
                  var text = data.substring(lastTextPos - 3, lastTextPos - match[0].length + 4);
                  currentParent.appendChild(new comment_1.default(text));
              }
              return "continue";
          }
          if (options.lowerCaseTagName)
              match[2] = match[2].toLowerCase();
          if (!match[1]) {
              // not </ tags
              var attrs = {};
              for (var attMatch = void 0; attMatch = kAttributePattern.exec(match[3]);) {
                  attrs[attMatch[2]] = attMatch[4] || attMatch[5] || attMatch[6];
              }
              var tagName = currentParent.tagName;
              if (!match[4] && kElementsClosedByOpening[tagName]) {
                  if (kElementsClosedByOpening[tagName][match[2]]) {
                      stack.pop();
                      currentParent = back_1.default(stack);
                  }
              }
              currentParent = currentParent.appendChild(new HTMLElement(match[2], attrs, match[3]));
              stack.push(currentParent);
              if (kBlockTextElements[match[2]]) {
                  // a little test to find next </script> or </style> ...
                  var closeMarkup_1 = '</' + match[2] + '>';
                  var index = (function () {
                      if (options.lowerCaseTagName) {
                          return data.toLocaleLowerCase().indexOf(closeMarkup_1, kMarkupPattern.lastIndex);
                      }
                      else {
                          return data.indexOf(closeMarkup_1, kMarkupPattern.lastIndex);
                      }
                  })();
                  if (options[match[2]]) {
                      var text = void 0;
                      if (index === -1) {
                          // there is no matching ending for the text element.
                          text = data.substr(kMarkupPattern.lastIndex);
                      }
                      else {
                          text = data.substring(kMarkupPattern.lastIndex, index);
                      }
                      if (text.length > 0) {
                          currentParent.appendChild(new text_1.default(text));
                      }
                  }
                  if (index === -1) {
                      lastTextPos = kMarkupPattern.lastIndex = data.length + 1;
                  }
                  else {
                      lastTextPos = kMarkupPattern.lastIndex = index + closeMarkup_1.length;
                      match[1] = 'true';
                  }
              }
          }
          if (match[1] || match[4] ||
              kSelfClosingElements[match[2]]) {
              // </ or /> or <br> etc.
              while (true) {
                  if (currentParent.tagName === match[2]) {
                      stack.pop();
                      currentParent = back_1.default(stack);
                      break;
                  }
                  else {
                      var tagName = currentParent.tagName;
                      // Trying to close current tag, and move on
                      if (kElementsClosedByClosing[tagName]) {
                          if (kElementsClosedByClosing[tagName][match[2]]) {
                              stack.pop();
                              currentParent = back_1.default(stack);
                              continue;
                          }
                      }
                      // Use aggressive strategy to handle unmatching markups.
                      break;
                  }
              }
          }
      };
      while (match = kMarkupPattern.exec(data)) {
          _loop_1();
      }
      var valid = !!(stack.length === 1);
      if (!options.noFix) {
          var response = root;
          response.valid = valid;
          var _loop_2 = function () {
              // Handle each error elements.
              var last = stack.pop();
              var oneBefore = back_1.default(stack);
              if (last.parentNode && last.parentNode.parentNode) {
                  if (last.parentNode === oneBefore && last.tagName === oneBefore.tagName) {
                      // Pair error case <h3> <h3> handle : Fixes to <h3> </h3>
                      oneBefore.removeChild(last);
                      last.childNodes.forEach(function (child) {
                          oneBefore.parentNode.appendChild(child);
                      });
                      stack.pop();
                  }
                  else {
                      // Single error  <div> <h3> </div> handle: Just removes <h3>
                      oneBefore.removeChild(last);
                      last.childNodes.forEach(function (child) {
                          oneBefore.appendChild(child);
                      });
                  }
              }
          };
          while (stack.length > 1) {
              _loop_2();
          }
          response.childNodes.forEach(function (node) {
              if (node instanceof HTMLElement) {
                  node.parentNode = null;
              }
          });
          return response;
      }
      else {
          var response = new text_1.default(data);
          response.valid = valid;
          return response;
      }
  }
  exports.parse = parse;
  });

  unwrapExports(html);
  var html_1 = html.parse;

  var dist = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports, "__esModule", { value: true });

  exports.CommentNode = comment.default;

  exports.HTMLElement = html.default;
  exports.parse = html.parse;
  exports.default = html.parse;

  exports.Node = node.default;

  exports.TextNode = text$1.default;

  exports.NodeType = type.default;
  });

  unwrapExports(dist);
  var dist_1 = dist.CommentNode;
  var dist_2 = dist.HTMLElement;
  var dist_3 = dist.parse;
  var dist_4 = dist.Node;
  var dist_5 = dist.TextNode;
  var dist_6 = dist.NodeType;

  /*
  Adapted from https://github.com/mattdesl
  Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
  */

  function cubicOut(t) {
  	const f = t - 1.0;
  	return f * f * f + 1.0;
  }

  function fly(node, {
  	delay = 0,
  	duration = 400,
  	easing = cubicOut,
  	x = 0,
  	y = 0,
  	opacity = 0
  }) {
  	const style = getComputedStyle(node);
  	const target_opacity = +style.opacity;
  	const transform = style.transform === 'none' ? '' : style.transform;

  	const od = target_opacity * (1 - opacity);

  	return {
  		delay,
  		duration,
  		easing,
  		css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
  	};
  }

  /* src/components/Search.svelte generated by Svelte v3.4.0 */

  const file = "src/components/Search.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = Object.create(ctx);
  	child_ctx.result = list[i];
  	child_ctx.index = i;
  	return child_ctx;
  }

  // (242:4) {:else}
  function create_else_block(ctx) {
  	var div, t0_value = ctx.result, t0, t1, if_block_anchor, current, dispose;

  	function click_handler_2() {
  		return ctx.click_handler_2(ctx);
  	}

  	var if_block = (ctx.book_menu[ctx.index]) && create_if_block_1(ctx);

  	return {
  		c: function create() {
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = space();
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  			add_location(div, file, 242, 6, 7256);
  			dispose = listen(div, "click", click_handler_2);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, t0);
  			insert(target, t1, anchor);
  			if (if_block) if_block.m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, new_ctx) {
  			ctx = new_ctx;
  			if ((!current || changed.results) && t0_value !== (t0_value = ctx.result)) {
  				set_data(t0, t0_value);
  			}

  			if (ctx.book_menu[ctx.index]) {
  				if (!if_block) {
  					if_block = create_if_block_1(ctx);
  					if_block.c();
  					if_block.i(1);
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				} else {
  									if_block.i(1);
  				}
  			} else if (if_block) {
  				group_outros();
  				on_outro(() => {
  					if_block.d(1);
  					if_block = null;
  				});

  				if_block.o(1);
  				check_outros();
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (if_block) if_block.i();
  			current = true;
  		},

  		o: function outro(local) {
  			if (if_block) if_block.o();
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(div);
  				detach(t1);
  			}

  			if (if_block) if_block.d(detaching);

  			if (detaching) {
  				detach(if_block_anchor);
  			}

  			dispose();
  		}
  	};
  }

  // (240:4) {#if (result.includes('Найденные книги') || result.includes('Найденные писатели') || result.includes('Найденные серии'))}
  function create_if_block(ctx) {
  	var h2, t_value = ctx.result, t;

  	return {
  		c: function create() {
  			h2 = element("h2");
  			t = text(t_value);
  			set_style(h2, "font-size", "1.5em");
  			add_location(h2, file, 240, 6, 7195);
  		},

  		m: function mount(target, anchor) {
  			insert(target, h2, anchor);
  			append(h2, t);
  		},

  		p: function update(changed, ctx) {
  			if ((changed.results) && t_value !== (t_value = ctx.result)) {
  				set_data(t, t_value);
  			}
  		},

  		i: noop,
  		o: noop,

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(h2);
  			}
  		}
  	};
  }

  // (244:6) {#if book_menu[index]}
  function create_if_block_1(ctx) {
  	var div, div_transition, current;

  	return {
  		c: function create() {
  			div = element("div");
  			div.textContent = "details add to library";
  			set_style(div, "color", "green");
  			add_location(div, file, 244, 6, 7348);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			current = true;
  		},

  		i: function intro(local) {
  			if (current) return;
  			add_render_callback(() => {
  				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -25, duration: 500 }, true);
  				div_transition.run(1);
  			});

  			current = true;
  		},

  		o: function outro(local) {
  			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -25, duration: 500 }, false);
  			div_transition.run(0);

  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(div);
  				if (div_transition) div_transition.end();
  			}
  		}
  	};
  }

  // (239:2) {#each results as result, index}
  function create_each_block(ctx) {
  	var current_block_type_index, if_block, if_block_anchor, current;

  	var if_block_creators = [
  		create_if_block,
  		create_else_block
  	];

  	var if_blocks = [];

  	function select_block_type(ctx) {
  		if ((ctx.result.includes('Найденные книги') || ctx.result.includes('Найденные писатели') || ctx.result.includes('Найденные серии'))) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c: function create() {
  			if_block.c();
  			if_block_anchor = empty();
  		},

  		m: function mount(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);
  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(changed, ctx);
  			} else {
  				group_outros();
  				on_outro(() => {
  					if_blocks[previous_block_index].d(1);
  					if_blocks[previous_block_index] = null;
  				});
  				if_block.o(1);
  				check_outros();

  				if_block = if_blocks[current_block_type_index];
  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}
  				if_block.i(1);
  				if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (if_block) if_block.i();
  			current = true;
  		},

  		o: function outro(local) {
  			if (if_block) if_block.o();
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if_blocks[current_block_type_index].d(detaching);

  			if (detaching) {
  				detach(if_block_anchor);
  			}
  		}
  	};
  }

  function create_fragment(ctx) {
  	var t0, div0, input0, t1, button0, t3, div2, label0, input1, t4, span0, t5, span1, t7, span2, t9, label1, input2, t10, span3, t11, span4, t13, span5, t15, label2, input3, t16, span6, t17, span7, t19, span8, t21, div1, button1, t22, t23, p, t24, t25_value = ctx.page_number + 1, t25, t26, t27, t28, button2, t29, t30, div3, img, t31, div4, t32, div5, t33, t34, div6, current, dispose;

  	var each_value = ctx.results;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	function outro_block(i, detaching, local) {
  		if (each_blocks[i]) {
  			if (detaching) {
  				on_outro(() => {
  					each_blocks[i].d(detaching);
  					each_blocks[i] = null;
  				});
  			}

  			each_blocks[i].o(local);
  		}
  	}

  	return {
  		c: function create() {
  			t0 = space();
  			div0 = element("div");
  			input0 = element("input");
  			t1 = space();
  			button0 = element("button");
  			button0.textContent = "Search";
  			t3 = space();
  			div2 = element("div");
  			label0 = element("label");
  			input1 = element("input");
  			t4 = space();
  			span0 = element("span");
  			t5 = space();
  			span1 = element("span");
  			span1.textContent = "Серии";
  			t7 = space();
  			span2 = element("span");
  			span2.textContent = " ";
  			t9 = space();
  			label1 = element("label");
  			input2 = element("input");
  			t10 = space();
  			span3 = element("span");
  			t11 = space();
  			span4 = element("span");
  			span4.textContent = "Авторы";
  			t13 = space();
  			span5 = element("span");
  			span5.textContent = " ";
  			t15 = space();
  			label2 = element("label");
  			input3 = element("input");
  			t16 = space();
  			span6 = element("span");
  			t17 = space();
  			span7 = element("span");
  			span7.textContent = "Книги";
  			t19 = space();
  			span8 = element("span");
  			span8.textContent = " ";
  			t21 = space();
  			div1 = element("div");
  			button1 = element("button");
  			t22 = text("Предыдущая");
  			t23 = space();
  			p = element("p");
  			t24 = text("Страница ");
  			t25 = text(t25_value);
  			t26 = text(" из ");
  			t27 = text(ctx.pages_total);
  			t28 = space();
  			button2 = element("button");
  			t29 = text("Следующая");
  			t30 = space();
  			div3 = element("div");
  			img = element("img");
  			t31 = space();
  			div4 = element("div");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			t32 = space();
  			div5 = element("div");
  			t33 = text(ctx.results);
  			t34 = space();
  			div6 = element("div");
  			document.title = "kraken book";
  			input0.id = "search_input";
  			input0.className = "bg-white focus:outline-none border border-gray-300 rounded-lg py-2\n    px-4 w-9 static m-2";
  			attr(input0, "type", "search");
  			input0.placeholder = "Enter book name";
  			add_location(input0, file, 187, 2, 5696);
  			button0.className = "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4";
  			add_location(button0, file, 194, 2, 5909);
  			div0.className = "";
  			add_location(div0, file, 186, 0, 5679);
  			attr(input1, "type", "checkbox");
  			input1.className = "svelte-1yvib7k";
  			add_location(input1, file, 203, 4, 6114);
  			span0.className = "slider round svelte-1yvib7k";
  			add_location(span0, file, 204, 4, 6174);
  			label0.className = "switch svelte-1yvib7k";
  			add_location(label0, file, 202, 2, 6087);
  			add_location(span1, file, 206, 2, 6217);
  			add_location(span2, file, 207, 2, 6238);
  			attr(input2, "type", "checkbox");
  			input2.className = "svelte-1yvib7k";
  			add_location(input2, file, 209, 4, 6287);
  			span3.className = "slider round svelte-1yvib7k";
  			add_location(span3, file, 210, 4, 6347);
  			label1.className = "switch svelte-1yvib7k";
  			add_location(label1, file, 208, 2, 6260);
  			add_location(span4, file, 212, 2, 6390);
  			add_location(span5, file, 213, 2, 6412);
  			attr(input3, "type", "checkbox");
  			input3.className = "svelte-1yvib7k";
  			add_location(input3, file, 215, 4, 6461);
  			span6.className = "slider round svelte-1yvib7k";
  			add_location(span6, file, 216, 4, 6519);
  			label2.className = "switch svelte-1yvib7k";
  			add_location(label2, file, 214, 2, 6434);
  			add_location(span7, file, 218, 2, 6562);
  			add_location(span8, file, 219, 2, 6583);
  			button1.className = "" + ctx.prev_button + " svelte-1yvib7k";
  			add_location(button1, file, 222, 4, 6630);
  			p.className = "" + ctx.is_pages + " svelte-1yvib7k";
  			add_location(p, file, 225, 4, 6732);
  			button2.className = "" + ctx.next_button + " svelte-1yvib7k";
  			add_location(button2, file, 226, 4, 6804);
  			div1.className = "Pages svelte-1yvib7k";
  			add_location(div1, file, 221, 2, 6606);
  			div2.className = "m-2 text-maintxt";
  			add_location(div2, file, 201, 0, 6054);
  			img.src = "./assets/loading.svg";
  			img.alt = "Loading...";
  			add_location(img, file, 233, 2, 6941);
  			div3.className = "" + ctx.loading + " svelte-1yvib7k";
  			add_location(div3, file, 232, 0, 6917);
  			div4.className = "" + ctx.results_css + " svelte-1yvib7k";
  			add_location(div4, file, 237, 0, 7002);
  			add_location(div5, file, 251, 0, 7501);
  			set_style(div6, "padding-bottom", "80px");
  			add_location(div6, file, 252, 0, 7522);

  			dispose = [
  				listen(window, "keydown", ctx.handleEnter),
  				listen(input0, "input", ctx.input0_input_handler),
  				listen(button0, "click", ctx.handleNewSearch),
  				listen(input1, "change", ctx.input1_change_handler),
  				listen(input2, "change", ctx.input2_change_handler),
  				listen(input3, "change", ctx.input3_change_handler),
  				listen(button1, "click", ctx.click_handler),
  				listen(button2, "click", ctx.click_handler_1)
  			];
  		},

  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			insert(target, t0, anchor);
  			insert(target, div0, anchor);
  			append(div0, input0);

  			input0.value = ctx.querie;

  			append(div0, t1);
  			append(div0, button0);
  			insert(target, t3, anchor);
  			insert(target, div2, anchor);
  			append(div2, label0);
  			append(label0, input1);

  			input1.checked = ctx.series_checked;

  			append(label0, t4);
  			append(label0, span0);
  			append(div2, t5);
  			append(div2, span1);
  			append(div2, t7);
  			append(div2, span2);
  			append(div2, t9);
  			append(div2, label1);
  			append(label1, input2);

  			input2.checked = ctx.author_checked;

  			append(label1, t10);
  			append(label1, span3);
  			append(div2, t11);
  			append(div2, span4);
  			append(div2, t13);
  			append(div2, span5);
  			append(div2, t15);
  			append(div2, label2);
  			append(label2, input3);

  			input3.checked = ctx.book_checked;

  			append(label2, t16);
  			append(label2, span6);
  			append(div2, t17);
  			append(div2, span7);
  			append(div2, t19);
  			append(div2, span8);
  			append(div2, t21);
  			append(div2, div1);
  			append(div1, button1);
  			append(button1, t22);
  			append(div1, t23);
  			append(div1, p);
  			append(p, t24);
  			append(p, t25);
  			append(p, t26);
  			append(p, t27);
  			append(div1, t28);
  			append(div1, button2);
  			append(button2, t29);
  			insert(target, t30, anchor);
  			insert(target, div3, anchor);
  			append(div3, img);
  			insert(target, t31, anchor);
  			insert(target, div4, anchor);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div4, null);
  			}

  			insert(target, t32, anchor);
  			insert(target, div5, anchor);
  			append(div5, t33);
  			insert(target, t34, anchor);
  			insert(target, div6, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.querie) input0.value = ctx.querie;
  			if (changed.series_checked) input1.checked = ctx.series_checked;
  			if (changed.author_checked) input2.checked = ctx.author_checked;
  			if (changed.book_checked) input3.checked = ctx.book_checked;

  			if (!current || changed.prev_button) {
  				button1.className = "" + ctx.prev_button + " svelte-1yvib7k";
  			}

  			if ((!current || changed.page_number) && t25_value !== (t25_value = ctx.page_number + 1)) {
  				set_data(t25, t25_value);
  			}

  			if (!current || changed.pages_total) {
  				set_data(t27, ctx.pages_total);
  			}

  			if (!current || changed.is_pages) {
  				p.className = "" + ctx.is_pages + " svelte-1yvib7k";
  			}

  			if (!current || changed.next_button) {
  				button2.className = "" + ctx.next_button + " svelte-1yvib7k";
  			}

  			if (!current || changed.loading) {
  				div3.className = "" + ctx.loading + " svelte-1yvib7k";
  			}

  			if (changed.results || changed.book_menu) {
  				each_value = ctx.results;

  				for (var i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  						each_blocks[i].i(1);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].i(1);
  						each_blocks[i].m(div4, null);
  					}
  				}

  				group_outros();
  				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
  				check_outros();
  			}

  			if (!current || changed.results_css) {
  				div4.className = "" + ctx.results_css + " svelte-1yvib7k";
  			}

  			if (!current || changed.results) {
  				set_data(t33, ctx.results);
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

  			current = true;
  		},

  		o: function outro(local) {
  			each_blocks = each_blocks.filter(Boolean);
  			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(t0);
  				detach(div0);
  				detach(t3);
  				detach(div2);
  				detach(t30);
  				detach(div3);
  				detach(t31);
  				detach(div4);
  			}

  			destroy_each(each_blocks, detaching);

  			if (detaching) {
  				detach(t32);
  				detach(div5);
  				detach(t34);
  				detach(div6);
  			}

  			run_all(dispose);
  		}
  	};
  }

  function instance($$self, $$props, $$invalidate) {
  	

    let querie = null;
    let page_number = 0;
    let result = "";
    let results = "";
    let series_checked = false;
    let author_checked = false;
    let book_checked = true;
    let pages_total = 0;
    let prev_button = "Hidden";
    let next_button = "Hidden";
    let is_pages = "Hidden";
    let loading = "Hidden";
    let results_css = "Hidden";
    let book_menu = [];

    function handleEnter(event) {
      // key = event.key;
      let key_code = event.keyCode;
      if (key_code === 13) {
        document.getElementById("search_input").blur();
        handleNewSearch();
      }
    }

    beforeUpdate(() => {
      $$invalidate('prev_button', prev_button = "Hidden");
      if (page_number > 0) {
        $$invalidate('prev_button', prev_button =
          "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4");
      }

      $$invalidate('next_button', next_button =
        "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4");
      if (page_number >= pages_total - 1) {
        $$invalidate('next_button', next_button = "Hidden");
      }

      $$invalidate('is_pages', is_pages = "Hidden");
      if (pages_total !== 0) {
        $$invalidate('is_pages', is_pages =
          "focus:outline-none bg-mainbtn m-2 static rounded-lg py-2 px-4");
      }
      // determine whether we should auto-scroll
      // once the DOM is updated...
    });

    function changePageNumber(arg) {
      $$invalidate('page_number', page_number += arg);
      handleSearch();
    }

    function handleSearch() {
      $$invalidate('results_css', results_css = "Hidden");
      $$invalidate('loading', loading = null);
      let pre_querie = querie.replace(/ /g, "+");
      if (series_checked) {
        pre_querie = pre_querie + "&chs=on";
      }
      if (author_checked) {
        pre_querie = pre_querie + "&cha=on";
      }
      if (book_checked) {
        pre_querie = pre_querie + "&chb=on";
      }
      if (book_checked || series_checked || author_checked) {
        const search_querie =
          "https://flibustasearch.herokuapp.com/http://flibusta.is/booksearch?page=" +
          page_number +
          "&ask=" +
          pre_querie;
        axios$1.get(search_querie).then(response => {
          $$invalidate('result', result = response.data);
          refineResult();
          // this.setState({ result: response.data }, () => this.refineResult());
        });
      }

      // pre_querie = pre_querie + "&chb=on";
    }

    function handleNewSearch() {
      $$invalidate('page_number', page_number = 0);
      handleSearch();
    }

    function refineResult() {
      $$invalidate('loading', loading = "Hidden");
      const result0 = String(result);
      const result1 = result0.substring(
        result.indexOf('<h1 class="title">Поиск книг</h1>') + 0
      );
      const result2 = result1.substring(
        0,
        result1.indexOf('<div id="sidebar-right" class="sidebar">')
      );
      const array1 = result2.split("\n");
      const array2 = array1.filter(String);
      $$invalidate('pages_total', pages_total = array2.filter(elem => {
        if (
          elem.includes('class="pager"') ||
          elem.includes('<li class="pager-item"')
        ) {
          return true;
        }
      }));

      const array3 = array2.filter(elem => {
        if (elem.includes('h1 class="title"')) {
          return false;
        }
        if (elem.includes("input type=submit value")) {
          return false;
        }
        if (elem.includes('<input type="checkbox"')) {
          return false;
        }
        if (elem.includes('<a href="http://fbsearch.ru">')) {
          return false;
        }
        if (elem.includes('class="pager')) {
          return false;
        }

        return true;
      });
      // const array6 = array3.map

      const array5 = array3.map((elem, index) => {
        if (elem.includes("<ul>")) {
          elem = elem.substr(elem.indexOf("<ul>") + 4);
          // console.log('found!')
        }
        elem = elem.replace(/<span style="background-color: #FFFCBB">/g, "");
        elem = elem.replace(/<\/span>/g, "");
        elem = elem.replace("<b>", "");
        elem = elem.replace("</b>", "");
        elem = elem.replace(/<a href="\//g, '<a href="http://flibusta.is/');

        // if (elem.includes("flibusta.is/b")) {
        //   elem =
        //     elem +
        //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
        //     '/fb2">fb2 </a>' +
        //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
        //     '/epub">epub </a>' +
        //     elem.substring(elem.indexOf("<a href"), elem.indexOf('">')) +
        //     '/mobi">mobi</a>';
        // }

        return elem;
      });

      const array6 = array5.map(elem => {
        elem = dist_3(elem);
        return elem.structuredText;
      });
      $$invalidate('book_menu', book_menu = array5.map(() => {
        return null
      }));
      // console.log('array6 is', array6);
      // result = parse(array5)
      $$invalidate('results', results = array6);
      $$invalidate('results_css', results_css = "text-maintxt m-2");
      // this.setState({ result2: array6, pagesTotal: pagesTotal.length / 2 });
      // result2 = array6
      $$invalidate('pages_total', pages_total = pages_total.length / 2);
      console.log(book_menu);
    }
    function showBookMenu(index) {
      book_menu[index] = !book_menu[index]; $$invalidate('book_menu', book_menu);
    }

  	function input0_input_handler() {
  		querie = this.value;
  		$$invalidate('querie', querie);
  	}

  	function input1_change_handler() {
  		series_checked = this.checked;
  		$$invalidate('series_checked', series_checked);
  	}

  	function input2_change_handler() {
  		author_checked = this.checked;
  		$$invalidate('author_checked', author_checked);
  	}

  	function input3_change_handler() {
  		book_checked = this.checked;
  		$$invalidate('book_checked', book_checked);
  	}

  	function click_handler() {
  		return changePageNumber(-1);
  	}

  	function click_handler_1() {
  		return changePageNumber(1);
  	}

  	function click_handler_2({ index }) {
  		return showBookMenu(index);
  	}

  	return {
  		querie,
  		page_number,
  		results,
  		series_checked,
  		author_checked,
  		book_checked,
  		pages_total,
  		prev_button,
  		next_button,
  		is_pages,
  		loading,
  		results_css,
  		book_menu,
  		handleEnter,
  		changePageNumber,
  		handleSearch,
  		handleNewSearch,
  		refineResult,
  		showBookMenu,
  		input0_input_handler,
  		input1_change_handler,
  		input2_change_handler,
  		input3_change_handler,
  		click_handler,
  		click_handler_1,
  		click_handler_2
  	};
  }

  class Search extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, ["changePageNumber", "handleSearch", "handleNewSearch", "refineResult", "showBookMenu"]);

  		const { ctx } = this.$$;
  		const props = options.props || {};
  		if (ctx.changePageNumber === undefined && !('changePageNumber' in props)) {
  			console.warn("<Search> was created without expected prop 'changePageNumber'");
  		}
  		if (ctx.handleSearch === undefined && !('handleSearch' in props)) {
  			console.warn("<Search> was created without expected prop 'handleSearch'");
  		}
  		if (ctx.handleNewSearch === undefined && !('handleNewSearch' in props)) {
  			console.warn("<Search> was created without expected prop 'handleNewSearch'");
  		}
  		if (ctx.refineResult === undefined && !('refineResult' in props)) {
  			console.warn("<Search> was created without expected prop 'refineResult'");
  		}
  		if (ctx.showBookMenu === undefined && !('showBookMenu' in props)) {
  			console.warn("<Search> was created without expected prop 'showBookMenu'");
  		}
  	}

  	get changePageNumber() {
  		return this.$$.ctx.changePageNumber;
  	}

  	set changePageNumber(value) {
  		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get handleSearch() {
  		return this.$$.ctx.handleSearch;
  	}

  	set handleSearch(value) {
  		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get handleNewSearch() {
  		return this.$$.ctx.handleNewSearch;
  	}

  	set handleNewSearch(value) {
  		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get refineResult() {
  		return this.$$.ctx.refineResult;
  	}

  	set refineResult(value) {
  		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get showBookMenu() {
  		return this.$$.ctx.showBookMenu;
  	}

  	set showBookMenu(value) {
  		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src/components/Library.svelte generated by Svelte v3.4.0 */

  const file$1 = "src/components/Library.svelte";

  function create_fragment$1(ctx) {
  	var t, div;

  	return {
  		c: function create() {
  			t = space();
  			div = element("div");
  			div.textContent = "library";
  			document.title = "library";
  			add_location(div, file$1, 10, 0, 95);
  		},

  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			insert(target, t, anchor);
  			insert(target, div, anchor);
  		},

  		p: noop,
  		i: noop,
  		o: noop,

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(t);
  				detach(div);
  			}
  		}
  	};
  }

  class Library extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, null, create_fragment$1, safe_not_equal, []);
  	}
  }

  /* src/components/Settings.svelte generated by Svelte v3.4.0 */

  const file$2 = "src/components/Settings.svelte";

  function create_fragment$2(ctx) {
  	var t, div;

  	return {
  		c: function create() {
  			t = space();
  			div = element("div");
  			div.textContent = "settings";
  			document.title = "settings";
  			add_location(div, file$2, 10, 0, 96);
  		},

  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			insert(target, t, anchor);
  			insert(target, div, anchor);
  		},

  		p: noop,
  		i: noop,
  		o: noop,

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(t);
  				detach(div);
  			}
  		}
  	};
  }

  class Settings extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, null, create_fragment$2, safe_not_equal, []);
  	}
  }

  const LOCATION = {};
  const ROUTER = {};

  /**
   * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
   *
   * https://github.com/reach/router/blob/master/LICENSE
   * */

  function getLocation(source) {
    return {
      ...source.location,
      state: source.history.state,
      key: (source.history.state && source.history.state.key) || "initial"
    };
  }

  function createHistory(source, options) {
    const listeners = [];
    let location = getLocation(source);

    return {
      get location() {
        return location;
      },

      listen(listener) {
        listeners.push(listener);

        const popstateListener = () => {
          location = getLocation(source);
          listener({ location, action: "POP" });
        };

        source.addEventListener("popstate", popstateListener);

        return () => {
          source.removeEventListener("popstate", popstateListener);

          const index = listeners.indexOf(listener);
          listeners.splice(index, 1);
        };
      },

      navigate(to, { state, replace = false } = {}) {
        state = { ...state, key: Date.now() + "" };
        // try...catch iOS Safari limits to 100 pushState calls
        try {
          if (replace) {
            source.history.replaceState(state, null, to);
          } else {
            source.history.pushState(state, null, to);
          }
        } catch (e) {
          source.location[replace ? "replace" : "assign"](to);
        }

        location = getLocation(source);
        listeners.forEach(listener => listener({ location, action: "PUSH" }));
      }
    };
  }

  // Stores history entries in memory for testing or other platforms like Native
  function createMemorySource(initialPathname = "/") {
    let index = 0;
    const stack = [{ pathname: initialPathname, search: "" }];
    const states = [];

    return {
      get location() {
        return stack[index];
      },
      addEventListener(name, fn) {},
      removeEventListener(name, fn) {},
      history: {
        get entries() {
          return stack;
        },
        get index() {
          return index;
        },
        get state() {
          return states[index];
        },
        pushState(state, _, uri) {
          const [pathname, search = ""] = uri.split("?");
          index++;
          stack.push({ pathname, search });
          states.push(state);
        },
        replaceState(state, _, uri) {
          const [pathname, search = ""] = uri.split("?");
          stack[index] = { pathname, search };
          states[index] = state;
        }
      }
    };
  }

  // Global history uses window.history as the source if available,
  // otherwise a memory history
  const canUseDOM = Boolean(
    typeof window !== "undefined" &&
      window.document &&
      window.document.createElement
  );
  const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
  const { navigate } = globalHistory;

  /**
   * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
   *
   * https://github.com/reach/router/blob/master/LICENSE
   * */

  const paramRe = /^:(.+)/;

  const SEGMENT_POINTS = 4;
  const STATIC_POINTS = 3;
  const DYNAMIC_POINTS = 2;
  const SPLAT_PENALTY = 1;
  const ROOT_POINTS = 1;

  /**
   * Check if `string` starts with `search`
   * @param {string} string
   * @param {string} search
   * @return {boolean}
   */
  function startsWith(string, search) {
    return string.substr(0, search.length) === search;
  }

  /**
   * Check if `segment` is a root segment
   * @param {string} segment
   * @return {boolean}
   */
  function isRootSegment(segment) {
    return segment === "";
  }

  /**
   * Check if `segment` is a dynamic segment
   * @param {string} segment
   * @return {boolean}
   */
  function isDynamic(segment) {
    return paramRe.test(segment);
  }

  /**
   * Check if `segment` is a splat
   * @param {string} segment
   * @return {boolean}
   */
  function isSplat(segment) {
    return segment[0] === "*";
  }

  /**
   * Split up the URI into segments delimited by `/`
   * @param {string} uri
   * @return {string[]}
   */
  function segmentize(uri) {
    return (
      uri
        // Strip starting/ending `/`
        .replace(/(^\/+|\/+$)/g, "")
        .split("/")
    );
  }

  /**
   * Strip `str` of potential start and end `/`
   * @param {string} str
   * @return {string}
   */
  function stripSlashes(str) {
    return str.replace(/(^\/+|\/+$)/g, "");
  }

  /**
   * Score a route depending on how its individual segments look
   * @param {object} route
   * @param {number} index
   * @return {object}
   */
  function rankRoute(route, index) {
    const score = route.default
      ? 0
      : segmentize(route.path).reduce((score, segment) => {
          score += SEGMENT_POINTS;

          if (isRootSegment(segment)) {
            score += ROOT_POINTS;
          } else if (isDynamic(segment)) {
            score += DYNAMIC_POINTS;
          } else if (isSplat(segment)) {
            score -= SEGMENT_POINTS + SPLAT_PENALTY;
          } else {
            score += STATIC_POINTS;
          }

          return score;
        }, 0);

    return { route, score, index };
  }

  /**
   * Give a score to all routes and sort them on that
   * @param {object[]} routes
   * @return {object[]}
   */
  function rankRoutes(routes) {
    return (
      routes
        .map(rankRoute)
        // If two routes have the exact same score, we go by index instead
        .sort((a, b) =>
          a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
        )
    );
  }

  /**
   * Ranks and picks the best route to match. Each segment gets the highest
   * amount of points, then the type of segment gets an additional amount of
   * points where
   *
   *  static > dynamic > splat > root
   *
   * This way we don't have to worry about the order of our routes, let the
   * computers do it.
   *
   * A route looks like this
   *
   *  { path, default, value }
   *
   * And a returned match looks like:
   *
   *  { route, params, uri }
   *
   * @param {object[]} routes
   * @param {string} uri
   * @return {?object}
   */
  function pick(routes, uri) {
    let match;
    let default_;

    const [uriPathname] = uri.split("?");
    const uriSegments = segmentize(uriPathname);
    const isRootUri = uriSegments[0] === "";
    const ranked = rankRoutes(routes);

    for (let i = 0, l = ranked.length; i < l; i++) {
      const route = ranked[i].route;
      let missed = false;

      if (route.default) {
        default_ = {
          route,
          params: {},
          uri
        };
        continue;
      }

      const routeSegments = segmentize(route.path);
      const params = {};
      const max = Math.max(uriSegments.length, routeSegments.length);
      let index = 0;

      for (; index < max; index++) {
        const routeSegment = routeSegments[index];
        const uriSegment = uriSegments[index];

        if (routeSegment !== undefined && isSplat(routeSegment)) {
          // Hit a splat, just grab the rest, and return a match
          // uri:   /files/documents/work
          // route: /files/* or /files/*splatname
          const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

          params[splatName] = uriSegments
            .slice(index)
            .map(decodeURIComponent)
            .join("/");
          break;
        }

        if (uriSegment === undefined) {
          // URI is shorter than the route, no match
          // uri:   /users
          // route: /users/:userId
          missed = true;
          break;
        }

        let dynamicMatch = paramRe.exec(routeSegment);

        if (dynamicMatch && !isRootUri) {
          const value = decodeURIComponent(uriSegment);
          params[dynamicMatch[1]] = value;
        } else if (routeSegment !== uriSegment) {
          // Current segments don't match, not dynamic, not splat, so no match
          // uri:   /users/123/settings
          // route: /users/:id/profile
          missed = true;
          break;
        }
      }

      if (!missed) {
        match = {
          route,
          params,
          uri: "/" + uriSegments.slice(0, index).join("/")
        };
        break;
      }
    }

    return match || default_ || null;
  }

  /**
   * Check if the `path` matches the `uri`.
   * @param {string} path
   * @param {string} uri
   * @return {?object}
   */
  function match(route, uri) {
    return pick([route], uri);
  }

  /**
   * Add the query to the pathname if a query is given
   * @param {string} pathname
   * @param {string} [query]
   * @return {string}
   */
  function addQuery(pathname, query) {
    return pathname + (query ? `?${query}` : "");
  }

  /**
   * Resolve URIs as though every path is a directory, no files. Relative URIs
   * in the browser can feel awkward because not only can you be "in a directory",
   * you can be "at a file", too. For example:
   *
   *  browserSpecResolve('foo', '/bar/') => /bar/foo
   *  browserSpecResolve('foo', '/bar') => /foo
   *
   * But on the command line of a file system, it's not as complicated. You can't
   * `cd` from a file, only directories. This way, links have to know less about
   * their current path. To go deeper you can do this:
   *
   *  <Link to="deeper"/>
   *  // instead of
   *  <Link to=`{${props.uri}/deeper}`/>
   *
   * Just like `cd`, if you want to go deeper from the command line, you do this:
   *
   *  cd deeper
   *  # not
   *  cd $(pwd)/deeper
   *
   * By treating every path as a directory, linking to relative paths should
   * require less contextual information and (fingers crossed) be more intuitive.
   * @param {string} to
   * @param {string} base
   * @return {string}
   */
  function resolve(to, base) {
    // /foo/bar, /baz/qux => /foo/bar
    if (startsWith(to, "/")) {
      return to;
    }

    const [toPathname, toQuery] = to.split("?");
    const [basePathname] = base.split("?");
    const toSegments = segmentize(toPathname);
    const baseSegments = segmentize(basePathname);

    // ?a=b, /users?b=c => /users?a=b
    if (toSegments[0] === "") {
      return addQuery(basePathname, toQuery);
    }

    // profile, /users/789 => /users/789/profile
    if (!startsWith(toSegments[0], ".")) {
      const pathname = baseSegments.concat(toSegments).join("/");

      return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
    }

    // ./       , /users/123 => /users/123
    // ../      , /users/123 => /users
    // ../..    , /users/123 => /
    // ../../one, /a/b/c/d   => /a/b/one
    // .././one , /a/b/c/d   => /a/b/c/one
    const allSegments = baseSegments.concat(toSegments);
    const segments = [];

    allSegments.forEach(segment => {
      if (segment === "..") {
        segments.pop();
      } else if (segment !== ".") {
        segments.push(segment);
      }
    });

    return addQuery("/" + segments.join("/"), toQuery);
  }

  /**
   * Combines the `basepath` and the `path` into one path.
   * @param {string} basepath
   * @param {string} path
   */
  function combinePaths(basepath, path) {
    return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
  }

  /**
   * Decides whether a given `event` should result in a navigation or not.
   * @param {object} event
   */
  function shouldNavigate(event) {
    return (
      !event.defaultPrevented &&
      event.button === 0 &&
      !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    );
  }

  /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.4.0 */

  function create_fragment$3(ctx) {
  	var current;

  	const default_slot_1 = ctx.$$slots.default;
  	const default_slot = create_slot(default_slot_1, ctx, null);

  	return {
  		c: function create() {
  			if (default_slot) default_slot.c();
  		},

  		l: function claim(nodes) {
  			if (default_slot) default_slot.l(nodes);
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (default_slot && default_slot.p && changed.$$scope) {
  				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (default_slot && default_slot.i) default_slot.i(local);
  			current = true;
  		},

  		o: function outro(local) {
  			if (default_slot && default_slot.o) default_slot.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (default_slot) default_slot.d(detaching);
  		}
  	};
  }

  function instance$1($$self, $$props, $$invalidate) {
  	let $base, $location, $routes;

  	

    let { basepath = "/", url = null } = $$props;

    const locationContext = getContext(LOCATION);
    const routerContext = getContext(ROUTER);

    const routes = writable([]); validate_store(routes, 'routes'); subscribe($$self, routes, $$value => { $routes = $$value; $$invalidate('$routes', $routes); });
    const activeRoute = writable(null);
    let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    // If locationContext is not set, this is the topmost Router in the tree.
    // If the `url` prop is given we force the location to it.
    const location =
      locationContext ||
      writable(url ? { pathname: url } : globalHistory.location); validate_store(location, 'location'); subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });

    // If routerContext is set, the routerBase of the parent Router
    // will be the base for this Router's descendants.
    // If routerContext is not set, the path and resolved uri will both
    // have the value of the basepath prop.
    const base = routerContext
      ? routerContext.routerBase
      : writable({
          path: basepath,
          uri: basepath
        }); validate_store(base, 'base'); subscribe($$self, base, $$value => { $base = $$value; $$invalidate('$base', $base); });

    const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
      // If there is no activeRoute, the routerBase will be identical to the base.
      if (activeRoute === null) {
        return base;
      }

      const { path: basepath } = base;
      const { route, uri } = activeRoute;
      // Remove the potential /* or /*splatname from
      // the end of the child Routes relative paths.
      const path = route.default ? basepath : route.path.replace(/\*.*$/, "");

      return { path, uri };
    });

    function registerRoute(route) {
      const { path: basepath } = $base;
      let { path } = route;

      // We store the original path in the _path property so we can reuse
      // it when the basepath changes. The only thing that matters is that
      // the route reference is intact, so mutation is fine.
      route._path = path;
      route.path = combinePaths(basepath, path);

      if (typeof window === "undefined") {
        // In SSR we should set the activeRoute immediately if it is a match.
        // If there are more Routes being registered after a match is found,
        // we just skip them.
        if (hasActiveRoute) {
          return;
        }

        const matchingRoute = match(route, $location.pathname);
        if (matchingRoute) {
          activeRoute.set(matchingRoute);
          $$invalidate('hasActiveRoute', hasActiveRoute = true);
        }
      } else {
        routes.update(rs => {
          rs.push(route);
          return rs;
        });
      }
    }

    function unregisterRoute(route) {
      routes.update(rs => {
        const index = rs.indexOf(route);
        rs.splice(index, 1);
        return rs;
      });
    }

    if (!locationContext) {
      // The topmost Router in the tree is responsible for updating
      // the location store and supplying it through context.
      onMount(() => {
        const unlisten = globalHistory.listen(history => {
          location.set(history.location);
        });

        return unlisten;
      });

      setContext(LOCATION, location);
    }

    setContext(ROUTER, {
      activeRoute,
      base,
      routerBase,
      registerRoute,
      unregisterRoute
    });

  	let { $$slots = {}, $$scope } = $$props;

  	$$self.$set = $$props => {
  		if ('basepath' in $$props) $$invalidate('basepath', basepath = $$props.basepath);
  		if ('url' in $$props) $$invalidate('url', url = $$props.url);
  		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
  	};

  	$$self.$$.update = ($$dirty = { $base: 1, $routes: 1, $location: 1 }) => {
  		if ($$dirty.$base) { {
          const { path: basepath } = $base;
          routes.update(rs => {
            rs.forEach(r => (r.path = combinePaths(basepath, r._path)));
            return rs;
          });
        } }
  		if ($$dirty.$routes || $$dirty.$location) { {
          const bestMatch = pick($routes, $location.pathname);
          activeRoute.set(bestMatch);
        } }
  	};

  	return {
  		basepath,
  		url,
  		routes,
  		location,
  		base,
  		$$slots,
  		$$scope
  	};
  }

  class Router extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$3, safe_not_equal, ["basepath", "url"]);
  	}

  	get basepath() {
  		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set basepath(value) {
  		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get url() {
  		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set url(value) {
  		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.4.0 */

  const get_default_slot_changes = ({ routeParams, $location }) => ({ params: routeParams, location: $location });
  const get_default_slot_context = ({ routeParams, $location }) => ({
  	params: routeParams,
  	location: $location
  });

  // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
  function create_if_block$1(ctx) {
  	var current_block_type_index, if_block, if_block_anchor, current;

  	var if_block_creators = [
  		create_if_block_1$1,
  		create_else_block$1
  	];

  	var if_blocks = [];

  	function select_block_type(ctx) {
  		if (ctx.component !== null) return 0;
  		return 1;
  	}

  	current_block_type_index = select_block_type(ctx);
  	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  	return {
  		c: function create() {
  			if_block.c();
  			if_block_anchor = empty();
  		},

  		m: function mount(target, anchor) {
  			if_blocks[current_block_type_index].m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var previous_block_index = current_block_type_index;
  			current_block_type_index = select_block_type(ctx);
  			if (current_block_type_index === previous_block_index) {
  				if_blocks[current_block_type_index].p(changed, ctx);
  			} else {
  				group_outros();
  				on_outro(() => {
  					if_blocks[previous_block_index].d(1);
  					if_blocks[previous_block_index] = null;
  				});
  				if_block.o(1);
  				check_outros();

  				if_block = if_blocks[current_block_type_index];
  				if (!if_block) {
  					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  					if_block.c();
  				}
  				if_block.i(1);
  				if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (if_block) if_block.i();
  			current = true;
  		},

  		o: function outro(local) {
  			if (if_block) if_block.o();
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if_blocks[current_block_type_index].d(detaching);

  			if (detaching) {
  				detach(if_block_anchor);
  			}
  		}
  	};
  }

  // (43:2) {:else}
  function create_else_block$1(ctx) {
  	var current;

  	const default_slot_1 = ctx.$$slots.default;
  	const default_slot = create_slot(default_slot_1, ctx, get_default_slot_context);

  	return {
  		c: function create() {
  			if (default_slot) default_slot.c();
  		},

  		l: function claim(nodes) {
  			if (default_slot) default_slot.l(nodes);
  		},

  		m: function mount(target, anchor) {
  			if (default_slot) {
  				default_slot.m(target, anchor);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (default_slot && default_slot.p && (changed.$$scope || changed.routeParams || changed.$location)) {
  				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, get_default_slot_changes), get_slot_context(default_slot_1, ctx, get_default_slot_context));
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (default_slot && default_slot.i) default_slot.i(local);
  			current = true;
  		},

  		o: function outro(local) {
  			if (default_slot && default_slot.o) default_slot.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (default_slot) default_slot.d(detaching);
  		}
  	};
  }

  // (41:2) {#if component !== null}
  function create_if_block_1$1(ctx) {
  	var switch_instance_anchor, current;

  	var switch_instance_spread_levels = [
  		{ location: ctx.$location },
  		ctx.routeParams,
  		ctx.routeProps
  	];

  	var switch_value = ctx.component;

  	function switch_props(ctx) {
  		let switch_instance_props = {};
  		for (var i = 0; i < switch_instance_spread_levels.length; i += 1) {
  			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
  		}
  		return {
  			props: switch_instance_props,
  			$$inline: true
  		};
  	}

  	if (switch_value) {
  		var switch_instance = new switch_value(switch_props(ctx));
  	}

  	return {
  		c: function create() {
  			if (switch_instance) switch_instance.$$.fragment.c();
  			switch_instance_anchor = empty();
  		},

  		m: function mount(target, anchor) {
  			if (switch_instance) {
  				mount_component(switch_instance, target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var switch_instance_changes = (changed.$location || changed.routeParams || changed.routeProps) ? get_spread_update(switch_instance_spread_levels, [
  				(changed.$location) && { location: ctx.$location },
  				(changed.routeParams) && ctx.routeParams,
  				(changed.routeProps) && ctx.routeProps
  			]) : {};

  			if (switch_value !== (switch_value = ctx.component)) {
  				if (switch_instance) {
  					group_outros();
  					const old_component = switch_instance;
  					on_outro(() => {
  						old_component.$destroy();
  					});
  					old_component.$$.fragment.o(1);
  					check_outros();
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props(ctx));

  					switch_instance.$$.fragment.c();
  					switch_instance.$$.fragment.i(1);
  					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			}

  			else if (switch_value) {
  				switch_instance.$set(switch_instance_changes);
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (switch_instance) switch_instance.$$.fragment.i(local);

  			current = true;
  		},

  		o: function outro(local) {
  			if (switch_instance) switch_instance.$$.fragment.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(switch_instance_anchor);
  			}

  			if (switch_instance) switch_instance.$destroy(detaching);
  		}
  	};
  }

  function create_fragment$4(ctx) {
  	var if_block_anchor, current;

  	var if_block = (ctx.$activeRoute !== null && ctx.$activeRoute.route === ctx.route) && create_if_block$1(ctx);

  	return {
  		c: function create() {
  			if (if_block) if_block.c();
  			if_block_anchor = empty();
  		},

  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.$activeRoute !== null && ctx.$activeRoute.route === ctx.route) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  					if_block.i(1);
  				} else {
  					if_block = create_if_block$1(ctx);
  					if_block.c();
  					if_block.i(1);
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				group_outros();
  				on_outro(() => {
  					if_block.d(1);
  					if_block = null;
  				});

  				if_block.o(1);
  				check_outros();
  			}
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (if_block) if_block.i();
  			current = true;
  		},

  		o: function outro(local) {
  			if (if_block) if_block.o();
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (if_block) if_block.d(detaching);

  			if (detaching) {
  				detach(if_block_anchor);
  			}
  		}
  	};
  }

  function instance$2($$self, $$props, $$invalidate) {
  	let $activeRoute, $location;

  	

    let { path = "", component = null } = $$props;

    const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER); validate_store(activeRoute, 'activeRoute'); subscribe($$self, activeRoute, $$value => { $activeRoute = $$value; $$invalidate('$activeRoute', $activeRoute); });
    const location = getContext(LOCATION); validate_store(location, 'location'); subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });

    const route = {
      path,
      // If no path prop is given, this Route will act as the default Route
      // that is rendered if no other Route in the Router is a match.
      default: path === ""
    };
    let routeParams = {};
    let routeProps = {};

    registerRoute(route);

    // There is no need to unregister Routes in SSR since it will all be
    // thrown away anyway.
    if (typeof window !== "undefined") {
      onDestroy(() => {
        unregisterRoute(route);
      });
    }

  	let { $$slots = {}, $$scope } = $$props;

  	$$self.$set = $$new_props => {
  		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
  		if ('path' in $$props) $$invalidate('path', path = $$props.path);
  		if ('component' in $$props) $$invalidate('component', component = $$props.component);
  		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
  	};

  	$$self.$$.update = ($$dirty = { $activeRoute: 1, $$props: 1 }) => {
  		if ($$dirty.$activeRoute) { if ($activeRoute && $activeRoute.route === route) {
          $$invalidate('routeParams', routeParams = $activeRoute.params);
        } }
  		{
          const { path, component, ...rest } = $$props;
          $$invalidate('routeProps', routeProps = rest);
        }
  	};

  	return {
  		path,
  		component,
  		activeRoute,
  		location,
  		route,
  		routeParams,
  		routeProps,
  		$activeRoute,
  		$location,
  		$$props: $$props = exclude_internal_props($$props),
  		$$slots,
  		$$scope
  	};
  }

  class Route extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$4, safe_not_equal, ["path", "component"]);
  	}

  	get path() {
  		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set path(value) {
  		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get component() {
  		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set component(value) {
  		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.4.0 */

  const file$3 = "node_modules/svelte-routing/src/Link.svelte";

  function create_fragment$5(ctx) {
  	var a, current, dispose;

  	const default_slot_1 = ctx.$$slots.default;
  	const default_slot = create_slot(default_slot_1, ctx, null);

  	var a_levels = [
  		{ href: ctx.href },
  		{ "aria-current": ctx.ariaCurrent },
  		ctx.props
  	];

  	var a_data = {};
  	for (var i = 0; i < a_levels.length; i += 1) {
  		a_data = assign(a_data, a_levels[i]);
  	}

  	return {
  		c: function create() {
  			a = element("a");

  			if (default_slot) default_slot.c();

  			set_attributes(a, a_data);
  			add_location(a, file$3, 40, 0, 1249);
  			dispose = listen(a, "click", ctx.onClick);
  		},

  		l: function claim(nodes) {
  			if (default_slot) default_slot.l(a_nodes);
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			insert(target, a, anchor);

  			if (default_slot) {
  				default_slot.m(a, null);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (default_slot && default_slot.p && changed.$$scope) {
  				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
  			}

  			set_attributes(a, get_spread_update(a_levels, [
  				(changed.href) && { href: ctx.href },
  				(changed.ariaCurrent) && { "aria-current": ctx.ariaCurrent },
  				(changed.props) && ctx.props
  			]));
  		},

  		i: function intro(local) {
  			if (current) return;
  			if (default_slot && default_slot.i) default_slot.i(local);
  			current = true;
  		},

  		o: function outro(local) {
  			if (default_slot && default_slot.o) default_slot.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(a);
  			}

  			if (default_slot) default_slot.d(detaching);
  			dispose();
  		}
  	};
  }

  function instance$3($$self, $$props, $$invalidate) {
  	let $base, $location;

  	

    let { to = "#", replace = false, state = {}, getProps = () => ({}) } = $$props;

    const { base } = getContext(ROUTER); validate_store(base, 'base'); subscribe($$self, base, $$value => { $base = $$value; $$invalidate('$base', $base); });
    const location = getContext(LOCATION); validate_store(location, 'location'); subscribe($$self, location, $$value => { $location = $$value; $$invalidate('$location', $location); });
    const dispatch = createEventDispatcher();

    let href, isPartiallyCurrent, isCurrent, props;

    function onClick(event) {
      dispatch("click", event);

      if (shouldNavigate(event)) {
        event.preventDefault();
        // Don't push another entry to the history stack when the user
        // clicks on a Link to the page they are currently on.
        const shouldReplace = $location.pathname === href || replace;
        navigate(href, { state, replace: shouldReplace });
      }
    }

  	let { $$slots = {}, $$scope } = $$props;

  	$$self.$set = $$props => {
  		if ('to' in $$props) $$invalidate('to', to = $$props.to);
  		if ('replace' in $$props) $$invalidate('replace', replace = $$props.replace);
  		if ('state' in $$props) $$invalidate('state', state = $$props.state);
  		if ('getProps' in $$props) $$invalidate('getProps', getProps = $$props.getProps);
  		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
  	};

  	let ariaCurrent;

  	$$self.$$.update = ($$dirty = { to: 1, $base: 1, $location: 1, href: 1, isCurrent: 1, getProps: 1, isPartiallyCurrent: 1 }) => {
  		if ($$dirty.to || $$dirty.$base) { $$invalidate('href', href = to === "/" ? $base.uri : resolve(to, $base.uri)); }
  		if ($$dirty.$location || $$dirty.href) { $$invalidate('isPartiallyCurrent', isPartiallyCurrent = startsWith($location.pathname, href)); }
  		if ($$dirty.href || $$dirty.$location) { $$invalidate('isCurrent', isCurrent = href === $location.pathname); }
  		if ($$dirty.isCurrent) { $$invalidate('ariaCurrent', ariaCurrent = isCurrent ? "page" : undefined); }
  		if ($$dirty.getProps || $$dirty.$location || $$dirty.href || $$dirty.isPartiallyCurrent || $$dirty.isCurrent) { $$invalidate('props', props = getProps({
          location: $location,
          href,
          isPartiallyCurrent,
          isCurrent
        })); }
  	};

  	return {
  		to,
  		replace,
  		state,
  		getProps,
  		base,
  		location,
  		href,
  		props,
  		onClick,
  		ariaCurrent,
  		$$slots,
  		$$scope
  	};
  }

  class Link extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$3, create_fragment$5, safe_not_equal, ["to", "replace", "state", "getProps"]);
  	}

  	get to() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set to(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get replace() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set replace(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get state() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set state(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get getProps() {
  		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set getProps(value) {
  		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src/App.svelte generated by Svelte v3.4.0 */

  const file$4 = "src/App.svelte";

  // (25:4) <Link to="/">
  function create_default_slot_4(ctx) {
  	var img;

  	return {
  		c: function create() {
  			img = element("img");
  			img.src = "assets/search.svg";
  			img.alt = "Search";
  			img.className = "svelte-1u8z0s8";
  			add_location(img, file$4, 25, 6, 761);
  		},

  		m: function mount(target, anchor) {
  			insert(target, img, anchor);
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(img);
  			}
  		}
  	};
  }

  // (28:4) <Link to="library">
  function create_default_slot_3(ctx) {
  	var img;

  	return {
  		c: function create() {
  			img = element("img");
  			img.src = "assets/library.svg";
  			img.alt = "library";
  			img.className = "svelte-1u8z0s8";
  			add_location(img, file$4, 28, 6, 848);
  		},

  		m: function mount(target, anchor) {
  			insert(target, img, anchor);
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(img);
  			}
  		}
  	};
  }

  // (31:4) <Link to="settings">
  function create_default_slot_2(ctx) {
  	var img;

  	return {
  		c: function create() {
  			img = element("img");
  			img.src = "assets/settings.svg";
  			img.alt = "settings";
  			img.className = "svelte-1u8z0s8";
  			add_location(img, file$4, 31, 6, 938);
  		},

  		m: function mount(target, anchor) {
  			insert(target, img, anchor);
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(img);
  			}
  		}
  	};
  }

  // (42:4) <Route path="/">
  function create_default_slot_1(ctx) {
  	var current;

  	var search = new Search({ $$inline: true });

  	return {
  		c: function create() {
  			search.$$.fragment.c();
  		},

  		m: function mount(target, anchor) {
  			mount_component(search, target, anchor);
  			current = true;
  		},

  		i: function intro(local) {
  			if (current) return;
  			search.$$.fragment.i(local);

  			current = true;
  		},

  		o: function outro(local) {
  			search.$$.fragment.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			search.$destroy(detaching);
  		}
  	};
  }

  // (23:0) <Router {url}>
  function create_default_slot(ctx) {
  	var div0, t0, t1, t2, div1, t3, t4, current;

  	var link0 = new Link({
  		props: {
  		to: "/",
  		$$slots: { default: [create_default_slot_4] },
  		$$scope: { ctx }
  	},
  		$$inline: true
  	});

  	var link1 = new Link({
  		props: {
  		to: "library",
  		$$slots: { default: [create_default_slot_3] },
  		$$scope: { ctx }
  	},
  		$$inline: true
  	});

  	var link2 = new Link({
  		props: {
  		to: "settings",
  		$$slots: { default: [create_default_slot_2] },
  		$$scope: { ctx }
  	},
  		$$inline: true
  	});

  	var route0 = new Route({
  		props: {
  		path: "library",
  		component: Library
  	},
  		$$inline: true
  	});

  	var route1 = new Route({
  		props: {
  		path: "settings",
  		component: Settings
  	},
  		$$inline: true
  	});

  	var route2 = new Route({
  		props: {
  		path: "/",
  		$$slots: { default: [create_default_slot_1] },
  		$$scope: { ctx }
  	},
  		$$inline: true
  	});

  	return {
  		c: function create() {
  			div0 = element("div");
  			link0.$$.fragment.c();
  			t0 = space();
  			link1.$$.fragment.c();
  			t1 = space();
  			link2.$$.fragment.c();
  			t2 = space();
  			div1 = element("div");
  			route0.$$.fragment.c();
  			t3 = space();
  			route1.$$.fragment.c();
  			t4 = space();
  			route2.$$.fragment.c();
  			div0.className = "navbar svelte-1u8z0s8";
  			add_location(div0, file$4, 23, 2, 716);
  			add_location(div1, file$4, 36, 2, 1012);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div0, anchor);
  			mount_component(link0, div0, null);
  			append(div0, t0);
  			mount_component(link1, div0, null);
  			append(div0, t1);
  			mount_component(link2, div0, null);
  			insert(target, t2, anchor);
  			insert(target, div1, anchor);
  			mount_component(route0, div1, null);
  			append(div1, t3);
  			mount_component(route1, div1, null);
  			append(div1, t4);
  			mount_component(route2, div1, null);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var link0_changes = {};
  			if (changed.$$scope) link0_changes.$$scope = { changed, ctx };
  			link0.$set(link0_changes);

  			var link1_changes = {};
  			if (changed.$$scope) link1_changes.$$scope = { changed, ctx };
  			link1.$set(link1_changes);

  			var link2_changes = {};
  			if (changed.$$scope) link2_changes.$$scope = { changed, ctx };
  			link2.$set(link2_changes);

  			var route0_changes = {};
  			if (changed.Library) route0_changes.component = Library;
  			route0.$set(route0_changes);

  			var route1_changes = {};
  			if (changed.Settings) route1_changes.component = Settings;
  			route1.$set(route1_changes);

  			var route2_changes = {};
  			if (changed.$$scope) route2_changes.$$scope = { changed, ctx };
  			route2.$set(route2_changes);
  		},

  		i: function intro(local) {
  			if (current) return;
  			link0.$$.fragment.i(local);

  			link1.$$.fragment.i(local);

  			link2.$$.fragment.i(local);

  			route0.$$.fragment.i(local);

  			route1.$$.fragment.i(local);

  			route2.$$.fragment.i(local);

  			current = true;
  		},

  		o: function outro(local) {
  			link0.$$.fragment.o(local);
  			link1.$$.fragment.o(local);
  			link2.$$.fragment.o(local);
  			route0.$$.fragment.o(local);
  			route1.$$.fragment.o(local);
  			route2.$$.fragment.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(div0);
  			}

  			link0.$destroy();

  			link1.$destroy();

  			link2.$destroy();

  			if (detaching) {
  				detach(t2);
  				detach(div1);
  			}

  			route0.$destroy();

  			route1.$destroy();

  			route2.$destroy();
  		}
  	};
  }

  function create_fragment$6(ctx) {
  	var main, t, current;

  	var router = new Router({
  		props: {
  		url: ctx.url,
  		$$slots: { default: [create_default_slot] },
  		$$scope: { ctx }
  	},
  		$$inline: true
  	});

  	return {
  		c: function create() {
  			main = element("main");
  			t = space();
  			router.$$.fragment.c();
  			main.className = "overflow-hidden ";
  			add_location(main, file$4, 16, 0, 591);
  		},

  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},

  		m: function mount(target, anchor) {
  			insert(target, main, anchor);
  			insert(target, t, anchor);
  			mount_component(router, target, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var router_changes = {};
  			if (changed.url) router_changes.url = ctx.url;
  			if (changed.$$scope) router_changes.$$scope = { changed, ctx };
  			router.$set(router_changes);
  		},

  		i: function intro(local) {
  			if (current) return;
  			router.$$.fragment.i(local);

  			current = true;
  		},

  		o: function outro(local) {
  			router.$$.fragment.o(local);
  			current = false;
  		},

  		d: function destroy(detaching) {
  			if (detaching) {
  				detach(main);
  				detach(t);
  			}

  			router.$destroy(detaching);
  		}
  	};
  }

  function instance$4($$self, $$props, $$invalidate) {
  	

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }

    let { url = "" } = $$props;

  	$$self.$set = $$props => {
  		if ('url' in $$props) $$invalidate('url', url = $$props.url);
  	};

  	return { url };
  }

  class App extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$4, create_fragment$6, safe_not_equal, ["url"]);
  	}

  	get url() {
  		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set url(value) {
  		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  const app = new App({
    target: document.body
  });

}());
//# sourceMappingURL=main.js.map
