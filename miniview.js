// requires [underscorejs, stampit]

// Config
_.templateSettings.interpolate = /\<\#=(.+?)\#\>/g;
_.templateSettings.evaluate = /\<\#(.+?)\#\>/g;

/*
 * MiniView: factory, creates a simple javascript View associated with an HTML Element.
 *
 * Using a consice syntax, centralize all actions, methods, events and rendering
 * associated with an HTML Element and it's nested elements.
 *
 * init    - A constructor Function. The context is the MiniView instance. The arguments are
 *           the ones given when instanciating the View.
 * state   - An Object, describing the default state of the view.
 * insert  - An Array of Objects representing the views nested in our MiniView.
 *           :template - [Required] the data-template attribute of the template
 *                       we want to insert, as a String.
 *           :into     - [Required] the HTML element into which the element is inserted,
 *                       as a selector String.
 * events  - An event map as an Object.
 *           The key is the event String, the value is the handler Function.
 * methods - A set of methods in an Object.
 *           The key is the method name as a String, the value is a Function.
 *
 * Examples
 *
 *   MyView = MiniView.extend({
 *     init: function(props) {
 *       this.state.model = props.model;
 *       console.log(this.state); // Data passed onto the subviews on rendering.
 *     },
 *    insert: [
 *      { template: 'answers-for-type', into: '.question-answers' },
 *      // { template: '...', into: '...' }
 *    ],
 *    events: {
 *      'keyup .question-answers, change .question-answers': function(e) {
 *        // Do something, the context is still the MiniView instance
 *      },
 *      'click': function(e) {
 *        // Do something, the context is still the MiniView instance
 *      }
 *    },
 *    state: {
 *      answers: [],
 *      hide: true
 *    },
 *    methods: {
 *      renderQuestions: function() {
 *        _.each(this.state.model.questions, function(question) {
 *          this.render({
 *            template: 'question-card',
 *            into: '.questions-container',
 *            method: 'append',
 *            data: question
 *          });
 *        }, this);
 *      }
 *    }
 *   });
 *
 *   var viewInstance = MyView("#my-view-element", { model: SomeObject });
 *
 *
 * Returns the rendered template's parent element.
 */

window.MiniView = (function($) {
  var MiniView = {};

  MiniView.Version = "0.0.1";

  MiniView.Element = stampit
    .props({
      id: null, // Default element for the view, maybe should be null ?
      el: null
    })
    .init(function(opts) {
      this.el = $(this.id);
      if (_.isNull(this.id) || _.isUndefined(this.id) || this.el.length === 0) {
        throw new Error(this._errors.viewNodeMissing);
      }

      // Defines the selector method for the view
      this.$ = _.wrap($, function(jQuery, selector) {
        return jQuery(selector, this.id);
      }, this);
    })

  MiniView.Template = stampit
    .refs({
      _errors: {
        /*parentAndViewNodeMissing: "MiniView could not find the parent node nor the view element, please be sure to provide an `attachedTo` argument when extending MiniView and to link your MiniView to the DOM by providing a `selector` upon instanciation.",*/
        viewNodeMissing: "MiniView could not find the view element, make sure to link your MiniView to the DOM by providing a `selector` upon instanciation.",
        templateMissing: 'MiniView could not find the template. Please make sure you gave a `template` attribute when you extended MiniView.',
        templateNotFound: 'MiniView could not find given template in the DOM.'
      }
    })
    .props({
      init: function() {}, // Default initializer, does nothing
      state: {},
      template: null,
      _rendered: false,
    })
    .init(function(opts) {
      console.debug('MiniView constructor: calling given init function');
      this.init.call(this, opts.args[0])

      // We don't want the initializer to be accessible in the public interface
      delete(this.init);

      this.refreshView();
      this.attachEvents();
    })
    .methods({
      refreshView: function() {
        _.each(this.insert, function(data) {
          this.render({ template: data.template, into: data.into });
        }, this);
        this._rendered = true;
      },
      destroyView: function() {
        if (this._rendered) {
          this.detachEvents();
          _.each(this.insert, function(data) {
            this.destroy({ template: data.template, into: data.into });
          }, this);
          this._rendered = false;
        }
      },
      /*
       * Public: Renders a template in a given element
       *
       * options - Arguments given as an Object.
       *           :template - [Required] the data-template attribute of the template,
       *                        as a String
       *           :into       - [Required] the HTML element into which the rendering happens,
       *                        as a String
       *           :method   - [Optional] a String giving the strategy to use for insertion.
       *                        Can be 'append', 'prepend', 'html' (default: 'html').
       *           :data     - [Optional] an Object that will be passed to the template
       *                        on rendering (default: this.state).
       *
       *
       * Examples
       *
       *    _.each(this.state.model.questions, function(question) {
       *      this.render({
       *        template: 'question-card',
       *        into: '.questions-container',
       *        method: 'append',
       *        data: question
       *      });
       *
       * Returns the rendered template's parent element.
       */
      render: function(options) {
        if (_.isUndefined(options.template) || _.isNull(options.template)) {
          throw new Error(this._errors.templateMissing);
        }
        if (_.isUndefined(options.into) || _.isNull(options.into)) {
          throw new Error('MiniView could not render ' + options.template + ' in ' + options.into);
        }

        var $template = $("[data-template=" + options.template + "]");

        if ($template.length === 0) {
          throw new Error(this._errors.templateNotFound);
        }

        console.debug('Rendering', options.template, ' in ', options.into);

        var method    = options.method || 'html';
        var template  = _.template($template.html());
        var node      = this.$(options.into);
        var data      = options.data || this.state;

        return node[method](template(data));
      },
      /*
       * Public: Destroys a template rendered in a given element
       *
       * options - Arguments given as an Object.
       *           :template - [Required] the data-template attribute of the template,
       *                        as a String
       *           :into     - [Required] the HTML element into which the element is rendered,
       *                        as a String
       *
       * Returns the destroyed template's parent element.
       */
      destroy: function(options) {
        console.debug('Destroying', options.template);
        return this.$(options.in).empty();
      },
    });

  // Attaches events from the event map
  MiniView.Events = stampit
    .props({
      eventsMap: []
    })
    .init(function(opts) {
      console.debug('Instanciating event map...');
      /*
       * Creates a usable eventMap from the given events property
       * Matches events only and event or space separated selector + event
       */
      var eventStrMatcher = /^([A-Za-z:\-_]+)(?:(?:\s(.+)?)?)$/; // Yay
      _.each(this.events, function(eventFunc, serializedEvent) {
        // Sets the `this` in the handler to the current MiniView instance
        var handler = function(e) { return eventFunc.call(opts.instance, e); };
        var eventsStr = serializedEvent.split(",");

        _.each(eventsStr, function(eventStr) {
          var match = eventStr.trim().match(eventStrMatcher);

          if (_.isNull(match)) {
            throw Error("Could not parse Event: " + eventStr)
          }
          var event = match[1];
          var selector = match[2];

          this.eventsMap.push({
            selector: selector,
            event: event,
            handler: handler,
            attached: false
          });

        }, this);
      }, this);

      // We remove the original `events` key because it's less valuable than the `eventsMap`
      delete(this.events);
    })
    .methods({
      attachEvents: function() {
        console.debug("Attaching events...");
        if (this._rendered) {
          _.each(this.eventsMap, function(event) {
            // If we have no selector we set the event onto the base element
            if (_.isEmpty(event.selector)) {
              console.debug(this.id, " on ", event.event);
              this.el.on(event.event, event.handler);
            } else {
              console.debug(this.id, " > ", event.selector, " on ", event.event);
              this.el.on(event.event, event.selector, event.handler);
            }

            event.attached = true;
          }, this);
        } else {
          console.error("MiniView instance not rendered, could not attach events.")
        }
      },
      detachEvents: function() {
        console.debug("Detaching events...");
        _.each(this.eventsMap, function(event) {
          // If we have no selector we set the event onto the base element
          if (_.isEmpty(event.selector)) {
            console.debug(this.el + " off " + event.event);
            this.el.off(event.event, event.handler);
          } else {
            console.debug(this.el + " > " + event.selector + " off " + event.event);
            this.el.off(event.event, event.selector, event.handler);
          }

          event.attached = false;
        }, this);
      }
    });

  MiniView.Methods = stampit
    .init(function(opts) {
      // Maybe do something
    })
    .methods();

  var Wrapper = {
    // Returns a Stamp function that takes an ID as a parameter
    version: MiniView.Version,
    extend: function(opts) {
      // Also extends the MiniView.Methods with the given ones at runtime
      var stamp = stampit.compose(MiniView.Element, MiniView.Methods.methods(opts.methods), MiniView.Events, MiniView.Template);

      return function(id, args) { return stamp(_.extend({ id: id}, opts), args); };
    }
  };

  return Wrapper;
}(jQuery));
