(function($){

    /**
     * Copyright 2012, Digital Fusion
     * Licensed under the MIT license.
     * http://teamdf.com/jquery-plugins/license/
     *
     * @author Sam Sehnert
     * @desc A small plugin that checks whether elements are within
     *       the user visible viewport of a web browser.
     *       only accounts for vertical position, not horizontal.
     */
    $.fn.visible = function(partial,hidden,direction,container){

        if (this.length < 1)
            return;

        var $t          = this.length > 1 ? this.eq(0) : this,
						isContained = typeof container !== 'undefined' && container !== null,
						$w				  = isContained ? $(container) : $(window),
						wPosition        = isContained ? $w.position() : 0,
            t           = $t.get(0),
            vpWidth     = $w.outerWidth(),
            vpHeight    = $w.outerHeight(),
            direction   = (direction) ? direction : 'both',
            clientSize  = hidden === true ? t.offsetWidth * t.offsetHeight : true;

        if (typeof t.getBoundingClientRect === 'function'){

            // Use this native browser method, if available.
            var rec = t.getBoundingClientRect(),
                tViz = isContained ?
												rec.top - wPosition.top >= 0 && rec.top < vpHeight + wPosition.top :
												rec.top >= 0 && rec.top < vpHeight,
                bViz = isContained ?
												rec.bottom - wPosition.top > 0 && rec.bottom <= vpHeight + wPosition.top :
												rec.bottom > 0 && rec.bottom <= vpHeight,
                lViz = isContained ?
												rec.left - wPosition.left >= 0 && rec.left < vpWidth + wPosition.left :
												rec.left >= 0 && rec.left <  vpWidth,
                rViz = isContained ?
												rec.right - wPosition.left > 0  && rec.right < vpWidth + wPosition.left  :
												rec.right > 0 && rec.right <= vpWidth,
                vVisible   = partial ? tViz || bViz : tViz && bViz,
                hVisible   = partial ? lViz || rViz : lViz && rViz;

            if(direction === 'both')
                return clientSize && vVisible && hVisible;
            else if(direction === 'vertical')
                return clientSize && vVisible;
            else if(direction === 'horizontal')
                return clientSize && hVisible;
        } else {

            var viewTop 				= isContained ? 0 : wPosition,
                viewBottom      = viewTop + vpHeight,
                viewLeft        = $w.scrollLeft(),
                viewRight       = viewLeft + vpWidth,
                position          = $t.position(),
                _top            = position.top,
                _bottom         = _top + $t.height(),
                _left           = position.left,
                _right          = _left + $t.width(),
                compareTop      = partial === true ? _bottom : _top,
                compareBottom   = partial === true ? _top : _bottom,
                compareLeft     = partial === true ? _right : _left,
                compareRight    = partial === true ? _left : _right;

            if(direction === 'both')
                return !!clientSize && ((compareBottom <= viewBottom) && (compareTop >= viewTop)) && ((compareRight <= viewRight) && (compareLeft >= viewLeft));
            else if(direction === 'vertical')
                return !!clientSize && ((compareBottom <= viewBottom) && (compareTop >= viewTop));
            else if(direction === 'horizontal')
                return !!clientSize && ((compareRight <= viewRight) && (compareLeft >= viewLeft));
        }
    };

})(jQuery);

/*
    A simple jQuery modal (http://github.com/kylefox/jquery-modal)
    Version 0.9.2
*/

(function (factory) {
  // Making your jQuery plugin work better with npm tools
  // http://blog.npmjs.org/post/112712169830/making-your-jquery-plugin-work-better-with-npm
  if(typeof module === "object" && typeof module.exports === "object") {
    factory(require("jquery"), window, document);
  }
  else {
    factory(jQuery, window, document);
  }
}(function($, window, document, undefined) {

  var modals = [],
      getCurrent = function() {
        return modals.length ? modals[modals.length - 1] : null;
      },
      selectCurrent = function() {
        var i,
            selected = false;
        for (i=modals.length-1; i>=0; i--) {
          if (modals[i].$blocker) {
            modals[i].$blocker.toggleClass('current',!selected).toggleClass('behind',selected);
            selected = true;
          }
        }
      };

  $.modal = function(el, options) {
    var remove, target;
    this.$body = $('body');
    this.options = $.extend({}, $.modal.defaults, options);
    this.options.doFade = !isNaN(parseInt(this.options.fadeDuration, 10));
    this.$blocker = null;
    if (this.options.closeExisting)
      while ($.modal.isActive())
        $.modal.close(); // Close any open modals.
    modals.push(this);
    if (el.is('a')) {
      target = el.attr('href');
      this.anchor = el;
      //Select element by id from href
      if (/^#/.test(target)) {
        this.$elm = $(target);
        if (this.$elm.length !== 1) return null;
        this.$body.append(this.$elm);
        this.open();
      //AJAX
      } else {
        this.$elm = $('<div>');
        this.$body.append(this.$elm);
        remove = function(event, modal) { modal.elm.remove(); };
        this.showSpinner();
        el.trigger($.modal.AJAX_SEND);
        $.get(target).done(function(html) {
          if (!$.modal.isActive()) return;
          el.trigger($.modal.AJAX_SUCCESS);
          var current = getCurrent();
          current.$elm.empty().append(html).on($.modal.CLOSE, remove);
          current.hideSpinner();
          current.open();
          el.trigger($.modal.AJAX_COMPLETE);
        }).fail(function() {
          el.trigger($.modal.AJAX_FAIL);
          var current = getCurrent();
          current.hideSpinner();
          modals.pop(); // remove expected modal from the list
          el.trigger($.modal.AJAX_COMPLETE);
        });
      }
    } else {
      this.$elm = el;
      this.anchor = el;
      this.$body.append(this.$elm);
      this.open();
    }
  };

  $.modal.prototype = {
    constructor: $.modal,

    open: function() {
      var m = this;
      this.block();
      this.anchor.blur();
      if(this.options.doFade) {
        setTimeout(function() {
          m.show();
        }, this.options.fadeDuration * this.options.fadeDelay);
      } else {
        this.show();
      }
      $(document).off('keydown.modal').on('keydown.modal', function(event) {
        var current = getCurrent();
        if (event.which === 27 && current.options.escapeClose) current.close();
      });
      if (this.options.clickClose)
        this.$blocker.click(function(e) {
          if (e.target === this)
            $.modal.close();
        });
    },

    close: function() {
      modals.pop();
      this.unblock();
      this.hide();
      if (!$.modal.isActive())
        $(document).off('keydown.modal');
    },

    block: function() {
      this.$elm.trigger($.modal.BEFORE_BLOCK, [this._ctx()]);
      this.$body.css('overflow','hidden');
      this.$blocker = $('<div class="' + this.options.blockerClass + ' blocker current"></div>').appendTo(this.$body);
      selectCurrent();
      if(this.options.doFade) {
        this.$blocker.css('opacity',0).animate({opacity: 1}, this.options.fadeDuration);
      }
      this.$elm.trigger($.modal.BLOCK, [this._ctx()]);
    },

    unblock: function(now) {
      if (!now && this.options.doFade)
        this.$blocker.fadeOut(this.options.fadeDuration, this.unblock.bind(this,true));
      else {
        this.$blocker.children().appendTo(this.$body);
        this.$blocker.remove();
        this.$blocker = null;
        selectCurrent();
        if (!$.modal.isActive())
          this.$body.css('overflow','');
      }
    },

    show: function() {
      this.$elm.trigger($.modal.BEFORE_OPEN, [this._ctx()]);
      if (this.options.showClose) {
        this.closeButton = $('<a href="#close-modal" rel="modal:close" class="close-modal ' + this.options.closeClass + '">' + this.options.closeText + '</a>');
        this.$elm.append(this.closeButton);
      }
      this.$elm.addClass(this.options.modalClass).appendTo(this.$blocker);
      if(this.options.doFade) {
        this.$elm.css({opacity: 0, display: 'inline-block'}).animate({opacity: 1}, this.options.fadeDuration);
      } else {
        this.$elm.css('display', 'inline-block');
      }
      this.$elm.trigger($.modal.OPEN, [this._ctx()]);
    },

    hide: function() {
      this.$elm.trigger($.modal.BEFORE_CLOSE, [this._ctx()]);
      if (this.closeButton) this.closeButton.remove();
      var _this = this;
      if(this.options.doFade) {
        this.$elm.fadeOut(this.options.fadeDuration, function () {
          _this.$elm.trigger($.modal.AFTER_CLOSE, [_this._ctx()]);
        });
      } else {
        this.$elm.hide(0, function () {
          _this.$elm.trigger($.modal.AFTER_CLOSE, [_this._ctx()]);
        });
      }
      this.$elm.trigger($.modal.CLOSE, [this._ctx()]);
    },

    showSpinner: function() {
      if (!this.options.showSpinner) return;
      this.spinner = this.spinner || $('<div class="' + this.options.modalClass + '-spinner"></div>')
        .append(this.options.spinnerHtml);
      this.$body.append(this.spinner);
      this.spinner.show();
    },

    hideSpinner: function() {
      if (this.spinner) this.spinner.remove();
    },

    //Return context for custom events
    _ctx: function() {
      return { elm: this.$elm, $elm: this.$elm, $blocker: this.$blocker, options: this.options, $anchor: this.anchor };
    }
  };

  $.modal.close = function(event) {
    if (!$.modal.isActive()) return;
    if (event) event.preventDefault();
    var current = getCurrent();
    current.close();
    return current.$elm;
  };

  // Returns if there currently is an active modal
  $.modal.isActive = function () {
    return modals.length > 0;
  };

  $.modal.getCurrent = getCurrent;

  $.modal.defaults = {
    closeExisting: true,
    escapeClose: true,
    clickClose: true,
    closeText: 'Close',
    closeClass: '',
    modalClass: "modal",
    blockerClass: "jquery-modal",
    spinnerHtml: '<div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div>',
    showSpinner: true,
    showClose: true,
    fadeDuration: null,   // Number of milliseconds the fade animation takes.
    fadeDelay: 1.0        // Point during the overlay's fade-in that the modal begins to fade in (.5 = 50%, 1.5 = 150%, etc.)
  };

  // Event constants
  $.modal.BEFORE_BLOCK = 'modal:before-block';
  $.modal.BLOCK = 'modal:block';
  $.modal.BEFORE_OPEN = 'modal:before-open';
  $.modal.OPEN = 'modal:open';
  $.modal.BEFORE_CLOSE = 'modal:before-close';
  $.modal.CLOSE = 'modal:close';
  $.modal.AFTER_CLOSE = 'modal:after-close';
  $.modal.AJAX_SEND = 'modal:ajax:send';
  $.modal.AJAX_SUCCESS = 'modal:ajax:success';
  $.modal.AJAX_FAIL = 'modal:ajax:fail';
  $.modal.AJAX_COMPLETE = 'modal:ajax:complete';

  $.fn.modal = function(options){
    if (this.length === 1) {
      new $.modal(this, options);
    }
    return this;
  };

  // Automatically bind links with rel="modal:close" to, well, close the modal.
  $(document).on('click.modal', 'a[rel~="modal:close"]', $.modal.close);
  $(document).on('click.modal', 'a[rel~="modal:open"]', function(event) {
    event.preventDefault();
    $(this).modal();
  });
}));

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.LazyLoad = factory());
}(this, (function () { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  var runningOnBrowser = typeof window !== "undefined";
  var isBot = runningOnBrowser && !("onscroll" in window) || typeof navigator !== "undefined" && /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent);
  var supportsIntersectionObserver = runningOnBrowser && "IntersectionObserver" in window;
  var supportsClassList = runningOnBrowser && "classList" in document.createElement("p");
  var isHiDpi = runningOnBrowser && window.devicePixelRatio > 1;

  var defaultSettings = {
    elements_selector: ".lazy",
    container: isBot || runningOnBrowser ? document : null,
    threshold: 300,
    thresholds: null,
    data_src: "src",
    data_srcset: "srcset",
    data_sizes: "sizes",
    data_bg: "bg",
    data_bg_hidpi: "bg-hidpi",
    data_bg_multi: "bg-multi",
    data_bg_multi_hidpi: "bg-multi-hidpi",
    data_bg_set: "bg-set",
    data_poster: "poster",
    class_applied: "applied",
    class_loading: "loading",
    class_loaded: "loaded",
    class_error: "error",
    class_entered: "entered",
    class_exited: "exited",
    unobserve_completed: true,
    unobserve_entered: false,
    cancel_on_exit: true,
    callback_enter: null,
    callback_exit: null,
    callback_applied: null,
    callback_loading: null,
    callback_loaded: null,
    callback_error: null,
    callback_finish: null,
    callback_cancel: null,
    use_native: false,
    restore_on_error: false
  };
  var getExtendedSettings = function getExtendedSettings(customSettings) {
    return _extends({}, defaultSettings, customSettings);
  };

  /* Creates instance and notifies it through the window element */
  var createInstance = function createInstance(classObj, options) {
    var event;
    var eventString = "LazyLoad::Initialized";
    var instance = new classObj(options);

    try {
      // Works in modern browsers
      event = new CustomEvent(eventString, {
        detail: {
          instance: instance
        }
      });
    } catch (err) {
      // Works in Internet Explorer (all versions)
      event = document.createEvent("CustomEvent");
      event.initCustomEvent(eventString, false, false, {
        instance: instance
      });
    }

    window.dispatchEvent(event);
  };
  /* Auto initialization of one or more instances of LazyLoad, depending on the
      options passed in (plain object or an array) */


  var autoInitialize = function autoInitialize(classObj, options) {
    if (!options) {
      return;
    }

    if (!options.length) {
      // Plain object
      createInstance(classObj, options);
    } else {
      // Array of objects
      for (var i = 0, optionsItem; optionsItem = options[i]; i += 1) {
        createInstance(classObj, optionsItem);
      }
    }
  };

  var SRC = "src";
  var SRCSET = "srcset";
  var SIZES = "sizes";
  var POSTER = "poster";
  var ORIGINALS = "llOriginalAttrs";
  var DATA = "data";

  var statusLoading = "loading";
  var statusLoaded = "loaded";
  var statusApplied = "applied";
  var statusEntered = "entered";
  var statusError = "error";
  var statusNative = "native";

  var dataPrefix = "data-";
  var statusDataName = "ll-status";
  var getData = function getData(element, attribute) {
    return element.getAttribute(dataPrefix + attribute);
  };
  var setData = function setData(element, attribute, value) {
    var attrName = dataPrefix + attribute;

    if (value === null) {
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, value);
  };
  var getStatus = function getStatus(element) {
    return getData(element, statusDataName);
  };
  var setStatus = function setStatus(element, status) {
    return setData(element, statusDataName, status);
  };
  var resetStatus = function resetStatus(element) {
    return setStatus(element, null);
  };
  var hasEmptyStatus = function hasEmptyStatus(element) {
    return getStatus(element) === null;
  };
  var hasStatusLoading = function hasStatusLoading(element) {
    return getStatus(element) === statusLoading;
  };
  var hasStatusError = function hasStatusError(element) {
    return getStatus(element) === statusError;
  };
  var hasStatusNative = function hasStatusNative(element) {
    return getStatus(element) === statusNative;
  };
  var statusesAfterLoading = [statusLoading, statusLoaded, statusApplied, statusError];
  var hadStartedLoading = function hadStartedLoading(element) {
    return statusesAfterLoading.indexOf(getStatus(element)) >= 0;
  };

  var safeCallback = function safeCallback(callback, arg1, arg2, arg3) {
    if (!callback || typeof callback !== 'function') {
      return;
    }

    if (arg3 !== undefined) {
      callback(arg1, arg2, arg3);
      return;
    }

    if (arg2 !== undefined) {
      callback(arg1, arg2);
      return;
    }

    callback(arg1);
  };

  var addClass = function addClass(element, className) {
    if (supportsClassList) {
      element.classList.add(className);
      return;
    }

    element.className += (element.className ? " " : "") + className;
  };
  var removeClass = function removeClass(element, className) {
    if (supportsClassList) {
      element.classList.remove(className);
      return;
    }

    element.className = element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");
  };

  var addTempImage = function addTempImage(element) {
    element.llTempImage = document.createElement("IMG");
  };
  var deleteTempImage = function deleteTempImage(element) {
    delete element.llTempImage;
  };
  var getTempImage = function getTempImage(element) {
    return element.llTempImage;
  };

  var unobserve = function unobserve(element, instance) {
    if (!instance) return;
    var observer = instance._observer;
    if (!observer) return;
    observer.unobserve(element);
  };
  var resetObserver = function resetObserver(observer) {
    observer.disconnect();
  };
  var unobserveEntered = function unobserveEntered(element, settings, instance) {
    if (settings.unobserve_entered) unobserve(element, instance);
  };

  var updateLoadingCount = function updateLoadingCount(instance, delta) {
    if (!instance) return;
    instance.loadingCount += delta;
  };
  var decreaseToLoadCount = function decreaseToLoadCount(instance) {
    if (!instance) return;
    instance.toLoadCount -= 1;
  };
  var setToLoadCount = function setToLoadCount(instance, value) {
    if (!instance) return;
    instance.toLoadCount = value;
  };
  var isSomethingLoading = function isSomethingLoading(instance) {
    return instance.loadingCount > 0;
  };
  var haveElementsToLoad = function haveElementsToLoad(instance) {
    return instance.toLoadCount > 0;
  };

  var getSourceTags = function getSourceTags(parentTag) {
    var sourceTags = [];

    for (var i = 0, childTag; childTag = parentTag.children[i]; i += 1) {
      if (childTag.tagName === "SOURCE") {
        sourceTags.push(childTag);
      }
    }

    return sourceTags;
  };

  var forEachPictureSource = function forEachPictureSource(element, fn) {
    var parent = element.parentNode;

    if (!parent || parent.tagName !== "PICTURE") {
      return;
    }

    var sourceTags = getSourceTags(parent);
    sourceTags.forEach(fn);
  };
  var forEachVideoSource = function forEachVideoSource(element, fn) {
    var sourceTags = getSourceTags(element);
    sourceTags.forEach(fn);
  };

  var attrsSrc = [SRC];
  var attrsSrcPoster = [SRC, POSTER];
  var attrsSrcSrcsetSizes = [SRC, SRCSET, SIZES];
  var attrsData = [DATA];
  var hasOriginalAttrs = function hasOriginalAttrs(element) {
    return !!element[ORIGINALS];
  };
  var getOriginalAttrs = function getOriginalAttrs(element) {
    return element[ORIGINALS];
  };
  var deleteOriginalAttrs = function deleteOriginalAttrs(element) {
    return delete element[ORIGINALS];
  }; // ## SAVE ##

  var setOriginalsObject = function setOriginalsObject(element, attributes) {
    if (hasOriginalAttrs(element)) {
      return;
    }

    var originals = {};
    attributes.forEach(function (attribute) {
      originals[attribute] = element.getAttribute(attribute);
    });
    element[ORIGINALS] = originals;
  };
  var saveOriginalBackgroundStyle = function saveOriginalBackgroundStyle(element) {
    if (hasOriginalAttrs(element)) {
      return;
    }

    element[ORIGINALS] = {
      backgroundImage: element.style.backgroundImage
    };
  }; // ## RESTORE ##

  var setOrResetAttribute = function setOrResetAttribute(element, attrName, value) {
    if (!value) {
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, value);
  };

  var restoreOriginalAttrs = function restoreOriginalAttrs(element, attributes) {
    if (!hasOriginalAttrs(element)) {
      return;
    }

    var originals = getOriginalAttrs(element);
    attributes.forEach(function (attribute) {
      setOrResetAttribute(element, attribute, originals[attribute]);
    });
  };
  var restoreOriginalBgImage = function restoreOriginalBgImage(element) {
    if (!hasOriginalAttrs(element)) {
      return;
    }

    var originals = getOriginalAttrs(element);
    element.style.backgroundImage = originals.backgroundImage;
  };

  var manageApplied = function manageApplied(element, settings, instance) {
    addClass(element, settings.class_applied);
    setStatus(element, statusApplied); // Instance is not provided when loading is called from static class

    if (!instance) return;

    if (settings.unobserve_completed) {
      // Unobserve now because we can't do it on load
      unobserve(element, settings);
    }

    safeCallback(settings.callback_applied, element, instance);
  };
  var manageLoading = function manageLoading(element, settings, instance) {
    addClass(element, settings.class_loading);
    setStatus(element, statusLoading); // Instance is not provided when loading is called from static class

    if (!instance) return;
    updateLoadingCount(instance, +1);
    safeCallback(settings.callback_loading, element, instance);
  };
  var setAttributeIfValue = function setAttributeIfValue(element, attrName, value) {
    if (!value) {
      return;
    }

    element.setAttribute(attrName, value);
  };
  var setImageAttributes = function setImageAttributes(element, settings) {
    setAttributeIfValue(element, SIZES, getData(element, settings.data_sizes));
    setAttributeIfValue(element, SRCSET, getData(element, settings.data_srcset));
    setAttributeIfValue(element, SRC, getData(element, settings.data_src));
  };
  var setSourcesImg = function setSourcesImg(imgEl, settings) {
    forEachPictureSource(imgEl, function (sourceTag) {
      setOriginalsObject(sourceTag, attrsSrcSrcsetSizes);
      setImageAttributes(sourceTag, settings);
    });
    setOriginalsObject(imgEl, attrsSrcSrcsetSizes);
    setImageAttributes(imgEl, settings);
  };
  var setSourcesIframe = function setSourcesIframe(iframe, settings) {
    setOriginalsObject(iframe, attrsSrc);
    setAttributeIfValue(iframe, SRC, getData(iframe, settings.data_src));
  };
  var setSourcesVideo = function setSourcesVideo(videoEl, settings) {
    forEachVideoSource(videoEl, function (sourceEl) {
      setOriginalsObject(sourceEl, attrsSrc);
      setAttributeIfValue(sourceEl, SRC, getData(sourceEl, settings.data_src));
    });
    setOriginalsObject(videoEl, attrsSrcPoster);
    setAttributeIfValue(videoEl, POSTER, getData(videoEl, settings.data_poster));
    setAttributeIfValue(videoEl, SRC, getData(videoEl, settings.data_src));
    videoEl.load();
  };
  var setSourcesObject = function setSourcesObject(object, settings) {
    setOriginalsObject(object, attrsData);
    setAttributeIfValue(object, DATA, getData(object, settings.data_src));
  };
  var setBackground = function setBackground(element, settings, instance) {
    var bg1xValue = getData(element, settings.data_bg);
    var bgHiDpiValue = getData(element, settings.data_bg_hidpi);
    var bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;
    if (!bgDataValue) return;
    element.style.backgroundImage = "url(\"".concat(bgDataValue, "\")");
    getTempImage(element).setAttribute(SRC, bgDataValue);
    manageLoading(element, settings, instance);
  }; // NOTE: THE TEMP IMAGE TRICK CANNOT BE DONE WITH data-multi-bg
  // BECAUSE INSIDE ITS VALUES MUST BE WRAPPED WITH URL() AND ONE OF THEM
  // COULD BE A GRADIENT BACKGROUND IMAGE

  var setMultiBackground = function setMultiBackground(element, settings, instance) {
    var bg1xValue = getData(element, settings.data_bg_multi);
    var bgHiDpiValue = getData(element, settings.data_bg_multi_hidpi);
    var bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;

    if (!bgDataValue) {
      return;
    }

    element.style.backgroundImage = bgDataValue;
    manageApplied(element, settings, instance);
  };
  var setImgsetBackground = function setImgsetBackground(element, settings, instance) {
    var bgImgSetDataValue = getData(element, settings.data_bg_set);

    if (!bgImgSetDataValue) {
      return;
    }

    var imgSetValues = bgImgSetDataValue.split("|");
    var bgImageValues = imgSetValues.map(function (value) {
      return "image-set(".concat(value, ")");
    });
    element.style.backgroundImage = bgImageValues.join(); // Temporary fix for Chromeium with the -webkit- prefix

    if (element.style.backgroundImage === "") {
      bgImageValues = imgSetValues.map(function (value) {
        return "-webkit-image-set(".concat(value, ")");
      });
      element.style.backgroundImage = bgImageValues.join();
    }

    manageApplied(element, settings, instance);
  };
  var setSourcesFunctions = {
    IMG: setSourcesImg,
    IFRAME: setSourcesIframe,
    VIDEO: setSourcesVideo,
    OBJECT: setSourcesObject
  };
  var setSourcesNative = function setSourcesNative(element, settings) {
    var setSourcesFunction = setSourcesFunctions[element.tagName];

    if (!setSourcesFunction) {
      return;
    }

    setSourcesFunction(element, settings);
  };
  var setSources = function setSources(element, settings, instance) {
    var setSourcesFunction = setSourcesFunctions[element.tagName];

    if (!setSourcesFunction) {
      return;
    }

    setSourcesFunction(element, settings);
    manageLoading(element, settings, instance);
  };

  var elementsWithLoadEvent = ["IMG", "IFRAME", "VIDEO", "OBJECT"];
  var hasLoadEvent = function hasLoadEvent(element) {
    return elementsWithLoadEvent.indexOf(element.tagName) > -1;
  };
  var checkFinish = function checkFinish(settings, instance) {
    if (instance && !isSomethingLoading(instance) && !haveElementsToLoad(instance)) {
      safeCallback(settings.callback_finish, instance);
    }
  };
  var addEventListener = function addEventListener(element, eventName, handler) {
    element.addEventListener(eventName, handler);
    element.llEvLisnrs[eventName] = handler;
  };
  var removeEventListener = function removeEventListener(element, eventName, handler) {
    element.removeEventListener(eventName, handler);
  };
  var hasEventListeners = function hasEventListeners(element) {
    return !!element.llEvLisnrs;
  };
  var addEventListeners = function addEventListeners(element, loadHandler, errorHandler) {
    if (!hasEventListeners(element)) element.llEvLisnrs = {};
    var loadEventName = element.tagName === "VIDEO" ? "loadeddata" : "load";
    addEventListener(element, loadEventName, loadHandler);
    addEventListener(element, "error", errorHandler);
  };
  var removeEventListeners = function removeEventListeners(element) {
    if (!hasEventListeners(element)) {
      return;
    }

    var eventListeners = element.llEvLisnrs;

    for (var eventName in eventListeners) {
      var handler = eventListeners[eventName];
      removeEventListener(element, eventName, handler);
    }

    delete element.llEvLisnrs;
  };
  var doneHandler = function doneHandler(element, settings, instance) {
    deleteTempImage(element);
    updateLoadingCount(instance, -1);
    decreaseToLoadCount(instance);
    removeClass(element, settings.class_loading);

    if (settings.unobserve_completed) {
      unobserve(element, instance);
    }
  };
  var loadHandler = function loadHandler(event, element, settings, instance) {
    var goingNative = hasStatusNative(element);
    doneHandler(element, settings, instance);
    addClass(element, settings.class_loaded);
    setStatus(element, statusLoaded);
    safeCallback(settings.callback_loaded, element, instance);
    if (!goingNative) checkFinish(settings, instance);
  };
  var errorHandler = function errorHandler(event, element, settings, instance) {
    var goingNative = hasStatusNative(element);
    doneHandler(element, settings, instance);
    addClass(element, settings.class_error);
    setStatus(element, statusError);
    safeCallback(settings.callback_error, element, instance);
    if (settings.restore_on_error) restoreOriginalAttrs(element, attrsSrcSrcsetSizes);
    if (!goingNative) checkFinish(settings, instance);
  };
  var addOneShotEventListeners = function addOneShotEventListeners(element, settings, instance) {
    var elementToListenTo = getTempImage(element) || element;

    if (hasEventListeners(elementToListenTo)) {
      // This happens when loading is retried twice
      return;
    }

    var _loadHandler = function _loadHandler(event) {
      loadHandler(event, element, settings, instance);
      removeEventListeners(elementToListenTo);
    };

    var _errorHandler = function _errorHandler(event) {
      errorHandler(event, element, settings, instance);
      removeEventListeners(elementToListenTo);
    };

    addEventListeners(elementToListenTo, _loadHandler, _errorHandler);
  };

  var loadBackground = function loadBackground(element, settings, instance) {
    addTempImage(element);
    addOneShotEventListeners(element, settings, instance);
    saveOriginalBackgroundStyle(element);
    setBackground(element, settings, instance);
    setMultiBackground(element, settings, instance);
    setImgsetBackground(element, settings, instance);
  };

  var loadRegular = function loadRegular(element, settings, instance) {
    addOneShotEventListeners(element, settings, instance);
    setSources(element, settings, instance);
  };

  var load = function load(element, settings, instance) {
    if (hasLoadEvent(element)) {
      loadRegular(element, settings, instance);
    } else {
      loadBackground(element, settings, instance);
    }
  };
  var loadNative = function loadNative(element, settings, instance) {
    element.setAttribute("loading", "lazy");
    addOneShotEventListeners(element, settings, instance);
    setSourcesNative(element, settings);
    setStatus(element, statusNative);
  };

  var removeImageAttributes = function removeImageAttributes(element) {
    element.removeAttribute(SRC);
    element.removeAttribute(SRCSET);
    element.removeAttribute(SIZES);
  };

  var resetSourcesImg = function resetSourcesImg(element) {
    forEachPictureSource(element, function (sourceTag) {
      removeImageAttributes(sourceTag);
    });
    removeImageAttributes(element);
  };

  var restoreImg = function restoreImg(imgEl) {
    forEachPictureSource(imgEl, function (sourceEl) {
      restoreOriginalAttrs(sourceEl, attrsSrcSrcsetSizes);
    });
    restoreOriginalAttrs(imgEl, attrsSrcSrcsetSizes);
  };
  var restoreVideo = function restoreVideo(videoEl) {
    forEachVideoSource(videoEl, function (sourceEl) {
      restoreOriginalAttrs(sourceEl, attrsSrc);
    });
    restoreOriginalAttrs(videoEl, attrsSrcPoster);
    videoEl.load();
  };
  var restoreIframe = function restoreIframe(iframeEl) {
    restoreOriginalAttrs(iframeEl, attrsSrc);
  };
  var restoreObject = function restoreObject(objectEl) {
    restoreOriginalAttrs(objectEl, attrsData);
  };
  var restoreFunctions = {
    IMG: restoreImg,
    IFRAME: restoreIframe,
    VIDEO: restoreVideo,
    OBJECT: restoreObject
  };

  var restoreAttributes = function restoreAttributes(element) {
    var restoreFunction = restoreFunctions[element.tagName];

    if (!restoreFunction) {
      restoreOriginalBgImage(element);
      return;
    }

    restoreFunction(element);
  };

  var resetClasses = function resetClasses(element, settings) {
    if (hasEmptyStatus(element) || hasStatusNative(element)) {
      return;
    }

    removeClass(element, settings.class_entered);
    removeClass(element, settings.class_exited);
    removeClass(element, settings.class_applied);
    removeClass(element, settings.class_loading);
    removeClass(element, settings.class_loaded);
    removeClass(element, settings.class_error);
  };

  var restore = function restore(element, settings) {
    restoreAttributes(element);
    resetClasses(element, settings);
    resetStatus(element);
    deleteOriginalAttrs(element);
  };

  var cancelLoading = function cancelLoading(element, entry, settings, instance) {
    if (!settings.cancel_on_exit) return;
    if (!hasStatusLoading(element)) return;
    if (element.tagName !== "IMG") return; //Works only on images

    removeEventListeners(element);
    resetSourcesImg(element);
    restoreImg(element);
    removeClass(element, settings.class_loading);
    updateLoadingCount(instance, -1);
    resetStatus(element);
    safeCallback(settings.callback_cancel, element, entry, instance);
  };

  var onEnter = function onEnter(element, entry, settings, instance) {
    var dontLoad = hadStartedLoading(element);
    /* Save status
    before setting it, to prevent loading it again. Fixes #526. */

    setStatus(element, statusEntered);
    addClass(element, settings.class_entered);
    removeClass(element, settings.class_exited);
    unobserveEntered(element, settings, instance);
    safeCallback(settings.callback_enter, element, entry, instance);
    if (dontLoad) return;
    load(element, settings, instance);
  };
  var onExit = function onExit(element, entry, settings, instance) {
    if (hasEmptyStatus(element)) return; //Ignore the first pass, at landing

    addClass(element, settings.class_exited);
    cancelLoading(element, entry, settings, instance);
    safeCallback(settings.callback_exit, element, entry, instance);
  };

  var tagsWithNativeLazy = ["IMG", "IFRAME", "VIDEO"];
  var shouldUseNative = function shouldUseNative(settings) {
    return settings.use_native && "loading" in HTMLImageElement.prototype;
  };
  var loadAllNative = function loadAllNative(elements, settings, instance) {
    elements.forEach(function (element) {
      if (tagsWithNativeLazy.indexOf(element.tagName) === -1) {
        return;
      }

      loadNative(element, settings, instance);
    });
    setToLoadCount(instance, 0);
  };

  var isIntersecting = function isIntersecting(entry) {
    return entry.isIntersecting || entry.intersectionRatio > 0;
  };

  var getObserverSettings = function getObserverSettings(settings) {
    return {
      root: settings.container === document ? null : settings.container,
      rootMargin: settings.thresholds || settings.threshold + "px"
    };
  };

  var intersectionHandler = function intersectionHandler(entries, settings, instance) {
    entries.forEach(function (entry) {
      return isIntersecting(entry) ? onEnter(entry.target, entry, settings, instance) : onExit(entry.target, entry, settings, instance);
    });
  };

  var observeElements = function observeElements(observer, elements) {
    elements.forEach(function (element) {
      observer.observe(element);
    });
  };
  var updateObserver = function updateObserver(observer, elementsToObserve) {
    resetObserver(observer);
    observeElements(observer, elementsToObserve);
  };
  var setObserver = function setObserver(settings, instance) {
    if (!supportsIntersectionObserver || shouldUseNative(settings)) {
      return;
    }

    instance._observer = new IntersectionObserver(function (entries) {
      intersectionHandler(entries, settings, instance);
    }, getObserverSettings(settings));
  };

  var toArray = function toArray(nodeSet) {
    return Array.prototype.slice.call(nodeSet);
  };
  var queryElements = function queryElements(settings) {
    return settings.container.querySelectorAll(settings.elements_selector);
  };
  var excludeManagedElements = function excludeManagedElements(elements) {
    return toArray(elements).filter(hasEmptyStatus);
  };
  var hasError = function hasError(element) {
    return hasStatusError(element);
  };
  var filterErrorElements = function filterErrorElements(elements) {
    return toArray(elements).filter(hasError);
  };
  var getElementsToLoad = function getElementsToLoad(elements, settings) {
    return excludeManagedElements(elements || queryElements(settings));
  };

  var retryLazyLoad = function retryLazyLoad(settings, instance) {
    var errorElements = filterErrorElements(queryElements(settings));
    errorElements.forEach(function (element) {
      removeClass(element, settings.class_error);
      resetStatus(element);
    });
    instance.update();
  };
  var setOnlineCheck = function setOnlineCheck(settings, instance) {
    if (!runningOnBrowser) {
      return;
    }

    instance._onlineHandler = function () {
      retryLazyLoad(settings, instance);
    };

    window.addEventListener("online", instance._onlineHandler);
  };
  var resetOnlineCheck = function resetOnlineCheck(instance) {
    if (!runningOnBrowser) {
      return;
    }

    window.removeEventListener("online", instance._onlineHandler);
  };

  var LazyLoad = function LazyLoad(customSettings, elements) {
    var settings = getExtendedSettings(customSettings);
    this._settings = settings;
    this.loadingCount = 0;
    setObserver(settings, this);
    setOnlineCheck(settings, this);
    this.update(elements);
  };

  LazyLoad.prototype = {
    update: function update(givenNodeset) {
      var settings = this._settings;
      var elementsToLoad = getElementsToLoad(givenNodeset, settings);
      setToLoadCount(this, elementsToLoad.length);

      if (isBot || !supportsIntersectionObserver) {
        this.loadAll(elementsToLoad);
        return;
      }

      if (shouldUseNative(settings)) {
        loadAllNative(elementsToLoad, settings, this);
        return;
      }

      updateObserver(this._observer, elementsToLoad);
    },
    destroy: function destroy() {
      // Observer
      if (this._observer) {
        this._observer.disconnect();
      } // Clean handlers


      resetOnlineCheck(this); // Clean custom attributes on elements

      queryElements(this._settings).forEach(function (element) {
        deleteOriginalAttrs(element);
      }); // Delete all internal props

      delete this._observer;
      delete this._settings;
      delete this._onlineHandler;
      delete this.loadingCount;
      delete this.toLoadCount;
    },
    loadAll: function loadAll(elements) {
      var _this = this;

      var settings = this._settings;
      var elementsToLoad = getElementsToLoad(elements, settings);
      elementsToLoad.forEach(function (element) {
        unobserve(element, _this);
        load(element, settings, _this);
      });
    },
    restoreAll: function restoreAll() {
      var settings = this._settings;
      queryElements(settings).forEach(function (element) {
        restore(element, settings);
      });
    }
  };

  LazyLoad.load = function (element, customSettings) {
    var settings = getExtendedSettings(customSettings);
    load(element, settings);
  };

  LazyLoad.resetStatus = function (element) {
    resetStatus(element);
  }; // Automatic instances creation if required (useful for async script loading)


  if (runningOnBrowser) {
    autoInitialize(LazyLoad, window.lazyLoadOptions);
  }

  return LazyLoad;

})));

"use strict";

/**
 * Common JS functions
 */

/**
 * Remove element from array
 * @param arr
 * @returns {*}
 */
function removeA(arr) {
  var what,
    a = arguments,
    L = a.length,
    ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}

/**
 * Set browser cookie
 * @param name
 * @param value
 * @param options {*}
 */
function setCookie(name, value, options) {
  options = Object.assign({
    // add other defaults here if necessary
    path: '/'
  }, options || {});
  if (options.expires && options.expires.toUTCString) {
    options.expires = options.expires.toUTCString();
  }
  var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
  for (var optionKey in options) {
    updatedCookie += "; " + optionKey;
    var optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }
  document.cookie = updatedCookie;
}

/**
 * Delete browser cookie by name
 * @param name
 */
function deleteCookie(name) {
  setCookie(name, "", {
    'max-age': -1
  });
}

/**
 * Get browser cookie by name
 * @param name
 * @returns {*}
 */
function getCookie(name) {
  var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

/**
 * Validate email
 * @param email
 * @returns {boolean}
 */
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/**
 * Confirmation dialog box
 */
function confirmationDialog() {
  var txt;
  var r = confirm("You are sure?");
  if (r == true) {
    return true;
  } else {
    return false;
  }
}

/**
 * urlHasVars
 * @return {boolean}
 */
function urlHasVars() {
  return location.search != "";
}

/**
 * removeHash
 */
function removeHash() {
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

/**
 * Delay type input.
 * @param callback
 * @param ms
 * @returns {Function}
 */
function delay(callback, ms) {
  var timer = 0;
  return function () {
    var context = this,
      args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(context, args);
    }, ms || 0);
  };
}
function getBrowserInfo() {
  var ua = navigator.userAgent,
    tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return {
      name: 'IE',
      version: tem[1] || ''
    };
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR|Edge\/(\d+)/);
    if (tem != null) {
      return {
        name: 'Opera',
        version: tem[1]
      };
    }
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) {
    M.splice(1, 1, tem[1]);
  }
  return {
    name: M[0],
    version: M[1]
  };
}
function throttle(func, wait) {
  var waiting = false;
  return function () {
    var _arguments = arguments,
      _this = this;
    if (waiting) {
      return;
    }
    waiting = true;
    setTimeout(function () {
      func.apply(_this, _arguments);
      waiting = false;
    }, wait);
  };
}
window.gridBreakPoints = getBreakpoints();

/**
 * @return {{xl: number, md: number, sm: number, xs: number, hd: number, lg: number, xxl: number}}
 */
function getBreakpoints() {
  return {
    xs: 0,
    sm: 576,
    md: 910,
    lg: 992,
    xl: 1200,
    xxl: 1600,
    fullhd: 1920
  };
}

/**
 * isElementExists
 * @param element
 * @returns {boolean}
 */
function isElementExists(element) {
  return typeof document.querySelector(element) != 'undefined' && document.querySelector(element) != null;
}

/**
 * jQuery common
 */
(function ($) {
  new LazyLoad({
    elements_selector: '.lazy'
  });
  $.fn.overflowing = function (options, callback) {
    var self = this;
    var overflowed = [];
    var hasCallback = callback && typeof callback === 'function' ? true : false;
    var status = false;
    this.options = options || window;
    this.each(function () {
      if ($.isWindow(this)) return false;
      var $this = $(this);
      elPosition = $this.position();
      elWidth = $this.width();
      elHeight = $this.height();
      var parents = $this.parentsUntil(self.options);
      var $parentsTo = $(self.options);
      parents.push($parentsTo);
      for (var i = 0; i < parents.length; i++) {
        var $parent = $(parents[i]);
        if ($.isWindow($parent[0])) break;
        var absPosition = !!~['absolute', 'fixed'].indexOf($parent.css('position'));
        var parentPosition = $parent.position();
        var parentWidth = $parent.width();
        var parentHeight = $parent.height();
        var parentToBottom = absPosition ? parentHeight : parentHeight + parentPosition.top;
        var parentToRight = absPosition ? parentWidth : parentWidth + parentPosition.left;
        if (elPosition.top < 0 || elPosition.left < 0 || elPosition.top > parentToBottom || elPosition.left > parentToRight || elPosition.top + elHeight > parentToBottom || elPosition.left + elWidth > parentToRight) {
          status = true;
          $(parents[i]).addClass('overflowed');
          overflowed.push(parents[i]);
          if (hasCallback) callback(parents[i]);
        }
      }
      if ($this.parents(self.options).hasClass('overflowed')) $this.addClass('overflowing');
    });
    if (!hasCallback) return overflowed.length > 1 ? overflowed : status;
  };
})(jQuery);
"use strict";

(function ($) {
  /**
   * cookieBarEl
   * @type {string}
   */
  var cookieBarEl = '.cookie';

  /**
   * cookieName
   * @type {string}
   */
  var cookieName = '_cookie_popup';

  /**
   * buttonEl
   * @type {string}
   */
  var buttonEl = '.cookie__button';

  /**
   * Animation duration
   * @type {number}
   */
  var duration = 300;

  /**
   * undefined, 1 - mouse click, mobile device tap
   * 13 - keyboard enter code
   * 32 - keyboard space code
   * @type {*[]}
   */
  var keyCodesAvailable = [undefined, 1, 13, 32];
  $(window).on("load", delay(function () {
    cookieBarShow();
  }, duration * 10));
  $(document).on("click tap", buttonEl, function (event) {
    event.preventDefault();
    if (keyCodesAvailable.indexOf(event.keyCode) === -1) {
      return false;
    }
    cookieBarHide();
  });

  /**
   * cookieBarShow
   * @return boolean
   */
  function cookieBarShow() {
    if (!getCookie(cookieName)) {
      $(cookieBarEl).show().animate({
        opacity: 1
      }, duration, "linear");
      return false;
    }
    cookieBarRemove();
    return false;
  }

  /**
   * cookieBarHide
   * @return void
   */
  function cookieBarHide() {
    setCookie(cookieName, 1, 3);
    $(cookieBarEl).animate({
      opacity: 0
    }, duration, "linear", function () {
      cookieBarRemove();
    });
  }

  /**
   * cookieBarRemove
   * @return void
   */
  function cookieBarRemove() {
    $(cookieBarEl).remove();
  }
})(jQuery);
"use strict";

(function ($) {
  $(document).ready(function () {
    $('body').on('keydown', '.daterangepicker td.available', function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      var dataTitle = $(this).data('title');
      var row = +dataTitle.substr(1, 1);
      var column = +dataTitle.substr(3, 1);
      var newRow = row;
      var newColumn = column;
      var isSingle = $('.booking-widget__daterange').length < 1;
      var navigateTo = '';
      var isLeft = $(this).closest('.drp-calendar').hasClass('left');
      switch (keyCode) {
        case 13:
          // enter
          $(this).trigger('mousedown.daterangepicker');
          setTimeout(function () {
            if (isSingle) {
              e.preventDefault();
              setTimeout(function () {
                $('.booking-widget__option--daterange').closest('.booking-widget__element').next().find('.c-custom-select__selected').focus();
              }, 100);
              return;
            }
            $('.daterangepicker th.available:not(.off), .daterangepicker td.available:not(.off)').attr('tabindex', 0);
            if ($('.daterangepicker td.available.start-date').length && !$('.daterangepicker td.available.end-date').length) {
              $('.daterangepicker td.active').focus();
            } else {
              $('.daterangepicker .applyBtn').focus();
            }
          }, 100);
          break;
        case 37:
          // left
          if (column > 0) {
            newColumn = column - 1;
          } else {
            if (row > 0) {
              newRow = row - 1;
              newColumn = 6;
            } else {
              if (isLeft || isSingle) {
                newRow = -1;
                newColumn = -1;
                navigateTo = 'prev';
              } else {
                navigateTo = 'prevMonth';
                newRow = 5;
                newColumn = 6;
              }
            }
          }
          break;
        case 38:
          // up
          if (row > 0) {
            newRow = row - 1;
          } else {
            if (isLeft || isSingle) {
              navigateTo = 'prev';
            } else {
              navigateTo = 'next';
            }
          }
          break;
        case 39:
          // right
          if (column < 6) {
            newColumn = column + 1;
          } else {
            if (row < 5) {
              newColumn = 0;
              newRow = row + 1;
            } else {
              if (isLeft) {
                navigateTo = 'nextMonth';
                newColumn = 0;
                newRow = 0;
              } else {
                navigateTo = 'cancel';
              }
            }
          }
          break;
        case 40:
          // down
          if (row < 5) {
            newRow = row + 1;
          } else {
            if (isLeft) {
              navigateTo = 'nextMonth';
              newRow = 0;
            } else {
              navigateTo = 'cancel';
            }
          }
          break;
        default:
          return;
        // exit this handler for other keys
      }
      e.preventDefault(); // prevent the default action (scroll / move caret)
      switch (navigateTo) {
        case '':
          $(this).closest('tbody').find('[data-title=r' + newRow + 'c' + newColumn + ']').focus();
          break;
        case 'prev':
          $('.daterangepicker .prev').focus();
          break;
        case 'next':
          $('.daterangepicker .next').focus();
          break;
        case 'nextMonth':
          $(this).closest('.daterangepicker').find('.drp-calendar.right').find('[data-title=r' + newRow + 'c' + newColumn + ']').focus();
          break;
        case 'prevMonth':
          $(this).closest('.daterangepicker').find('.drp-calendar.left').find('[data-title=r' + newRow + 'c' + newColumn + ']').focus();
          break;
        case 'cancel':
          $('.daterangepicker .cancelBtn').focus();
          break;
        default:
          return;
        // exit this handler for other keys
      }
    });
    $('body').on('keydown', '.daterangepicker .applyBtn', function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      if (keyCode === 13) {
        e.preventDefault();
        setTimeout(function () {
          $(e.target).trigger('click.daterangepicker');
          $('.booking-widget__option--daterange').closest('.booking-widget__element').next().find('.c-custom-select__selected').focus();
        }, 100);
      }
      if (keyCode === 9) {
        e.preventDefault();
        setTimeout(function () {
          $('.daterangepicker .cancelBtn').focus();
        }, 100);
      }
    });
    $('body').on('keydown', '.daterangepicker .cancelBtn', function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      if (keyCode === 13 || keyCode === 9) {
        e.preventDefault();
        setTimeout(function () {
          $(e.target).trigger('click.daterangepicker');
          $('.booking-widget__option--daterange').closest('.booking-widget__element').next().find('.c-custom-select__selected').focus();
        }, 100);
      }
    });
    $('body').on('keydown', '.daterangepicker .prev', function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      if (keyCode === 13) {
        $(this).trigger('click.daterangepicker');
      }
      if (keyCode === 9) {
        if (e.shiftKey) {
          e.preventDefault();
          setTimeout(function () {
            $('.booking-widget__option--daterange').closest('.booking-widget__element').prev().find('.c-custom-select__selected').focus();
            $('.daterangepicker .cancelBtn').trigger('cancel.daterangepicker');
          }, 100);
        }
      }
    });
    $('body').on('keydown', '.daterangepicker .next', function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      if (keyCode === 13) {
        $(this).trigger('click.daterangepicker');
      }
    });
  });
})(jQuery);
"use strict";

(function ($) {
  var focusedTriggerId = null;
  $(document).ready(function () {
    // Prevent unexpected submission of form
    $(document).on('keydown', '.form__input', function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
      }
    });
    formInput();
    formInputNumber();
    formCheckBox();
    formRadio();
    formDatepicker();
    formUpload();
    formSelect();
    formRepeatableFields();
  });
  document.addEventListener('wpcf7submit', function (event) {
    if (event.detail.status === 'mail_sent') {
      $('.form__label').removeClass('form__label--focus');
    }
  }, false);
  document.addEventListener('wpcf7beforesubmit', function (event) {
    var $message = $('.wpcf7-response-output', $(event.target));
    if ($message.length) {
      $message.removeClass('wpcf7-custom-givex-failed wpcf7-custom-givex-ok');
    }
  }, false);
  document.addEventListener('wpcf7mailsent', function (event) {
    if ('redirect_link' in event.detail.apiResponse) {
      $('.wpcf7-response-output', $(event.target)).attr('hidden', true);
      window.location.href = event.detail.apiResponse['redirect_link'];
      return;
    }
  }, false);
  document.addEventListener('wpcf7invalid', function (event) {
    $('.form__input--radio-wrapper').each(function () {
      var $this = $(this);
      $this.find('.wpcf7-not-valid-tip').appendTo($this.parent());
    });
  }, false);

  /**
   * formInputFocusIn
   * @param event
   */
  function formInputFocusIn(event) {
    var $closest = $(event.target).closest('.form__col');
    var $label = $closest.find('.form__label');
    $label.addClass('form__label--focus');
    var $newsletterLabel = $closest.find('.newsletter__label');
    $newsletterLabel.addClass('newsletter__label--focus');
  }

  /**
   * formInputFocusOut
   * @param event
   */
  function formInputFocusOut(event) {
    if ($(event.target).val() !== '') {
      return true;
    }
    var $closest = $(event.target).closest('.form__col');
    var $label = $closest.find('.form__label');
    $label.removeClass('form__label--focus');
    var $newsletterLabel = $closest.find('.newsletter__label');
    $newsletterLabel.removeClass('newsletter__label--focus');
  }

  /**
   * formInput
   * @return void
   */
  function formInput() {
    var $field = $('.form__input');
    $field.on('click tap keyup', function (event) {
      formInputFocusIn(event);
    });
    $field.on('blur', function (event) {
      formInputFocusOut(event);
    });
  }

  /**
   * formUpload
   * @return void
   */
  function formUpload() {
    var $field = $('input[type=file]');
    var $button = $field.closest('.form__col').find('.wpcf7-form-control-wrap');
    var $container = $('.form__upload-wrapper');
    var $noFile = '<span class="form__upload-info form__upload-info--default"><span class="form__upload-name">No file chosen</span></span>';
    $container.append($noFile);
    $button.addClass('form__upload-button c-button c-button--primary c-button--animated').attr('tabindex', '0').append('Choose file').on('click tap keyup', function (event) {
      if (event.keyCode === undefined) {
        $(event.target).find('input[type=file]').click();
      }
      if (event.keyCode === 13) {
        $(event.target).find('input[type=file]').click();
      }
    }).bind('change', function (event) {
      var $currentField = $(event.target);
      var $currentContainer = $currentField.closest('.form__col');
      var uploadName = $currentField[0].files[0].name;
      $currentContainer.find('.form__upload-info--default, .form__upload-info').remove();
      $currentContainer.append('<span class="form__upload-info"><span class="form__upload-name">' + uploadName + '</span><span class="form__upload-remove" tabindex="0">Remove</span></span>');
      $('.form__upload-remove').on('click tap keyup', function (event) {
        event.preventDefault();
        if (event.keyCode === undefined) {
          $currentField.val('');
          $('.form__upload-info').remove();
          $currentContainer.append($noFile);
        }
        if (event.keyCode === 13) {
          $currentField.val('');
          $('.form__upload-info').remove();
          $currentContainer.append($noFile);
        }
      });
    });
  }

  /**
   * formInputNumber
   * @return boolean
   */
  function formInputNumber() {
    var availableKeyCodes = [8, 9, 37, 38, 39, 40, 46];
    $(document).on('keydown', '.form__input--number', function (event) {
      if (roomsRegexInput(event.key) === false && availableKeyCodes.indexOf(event.keyCode) === -1) {
        return false;
      }
    });
  }

  /**
   * formCheckBox
   * @return void
   */
  function formCheckBox() {
    var $label = $('.form__input--checkbox .wpcf7-list-item-label');
    $label.attr('tabindex', 0).closest('.form__col').find('.wpcf7-form-control-wrap').addClass('form__input--checkbox-wrapper');
    $label.on('click tap keyup', function (event) {
      if (event.keyCode === undefined) {
        formCheckboxTrigger(event);
      } else if (event.keyCode === 13) {
        formCheckboxTrigger(event);
      }
      return false;
    });
  }

  /**
   * formCheckboxTrigger
   * @param event
   * @return void
   */
  function formCheckboxTrigger(event) {
    var currChkbx = $(event.target).prev('input[type="checkbox"]');
    currChkbx.click();
  }

  /**
   * formRadio
   * @return void
   */
  function formRadio() {
    var $label = $('.form__input--radio .wpcf7-list-item-label');
    $label.attr('tabindex', 0).closest('.form__col').find('.wpcf7-form-control-wrap').addClass('form__input--radio-wrapper');
    $label.on('click tap keyup', function (event) {
      if (event.keyCode === undefined) {
        formRadioTrigger(event);
      }
      if (event.keyCode === 13) {
        formRadioTrigger(event);
      }
    });
  }

  /**
   * formRadioTrigger
   * @param event
   * @return void
   */
  function formRadioTrigger(event) {
    var currRadio = $(event.target).prev('input[type="radio"]');
    currRadio.prop('checked', 'checked');
  }
  function formSelect() {
    var $select = $('.form__input--select');
    var $wrapper = $select.closest('.form__col');
    $wrapper.find('.wpcf7-form-control-wrap').addClass('form__input--select-appearance');
  }
  function formDatepicker() {
    var $field = $('.form__input--date');
    $(document).on('click tap keyup', '.form__input--date', function (event) {
      if (event.keyCode === undefined) {
        formDatepickerTrigger(event);
      }
      if (event.keyCode === 13) {
        formDatepickerTrigger(event);
      }
    });
  }

  /**
   * formDatepicker
   * @param event
   * @returns {boolean}
   */
  function formDatepickerTrigger(event) {
    focusedTriggerId = $(event.target).attr('id');
    $(event.target).datepicker(datepickerSettings(event));
    $(event.target).datepicker('show');
    return false;
  }

  /**
   * Datepicker settings
   * @returns {*}
   */
  function datepickerSettings(event) {
    var defaultSettings = datepickerDefaultSettings(event);
    return $.extend(defaultSettings, {
      minDate: 0
    });
  }

  /**
   * Datepicker defaults
   * @returns {{onChangeMonthYear: onChangeMonthYear, dateFormat: string, beforeShow: beforeShow, onSelect: onSelect}}
   */
  function datepickerDefaultSettings(event) {
    return {
      dateFormat: 'dd/mm/yy',
      onSelect: function onSelect(date, datepicker) {
        // let datepickerValue = datepicker.currentMonth+'/'+datepicker.currentDay+'/'+datepicker.currentYear;
        $('#' + datepicker.id).datepicker('hide').datepicker('destroy').focus();
      },
      onChangeMonthYear: function onChangeMonthYear(month, year, datepicker) {
        moveTabIndexToDatepickerCells(datepicker);
      },
      beforeShow: function beforeShow(elem, datepicker) {
        moveTabIndexToDatepickerCells(datepicker);
      }
    };
  }

  /**
   * Move focus into calendar
   * @param datepicker
   */
  function moveTabIndexToDatepickerCells(datepicker) {
    setTimeout(function () {
      var $prevMonth = $('.ui-datepicker-prev:not(".ui-state-disabled")'),
        $nextMonth = $('.ui-datepicker-next:not(".ui-state-disabled")'),
        $activeCells = $('.ui-datepicker td:not(".ui-state-disabled")');
      $prevMonth.attr('tabindex', 1);
      $activeCells.each(function (idx, el) {
        $(this).attr('tabindex', idx + 2);
      });
      $nextMonth.attr('tabindex', $activeCells.length + 3);
      $activeCells.keyup(function (event) {
        var code = event.keyCode ? event.keyCode : event.which;
        if (code === 13) {
          $(this).find('a').click();
        }
      });
      $prevMonth.add($nextMonth).keypress(function (event) {
        var code = event.keyCode ? event.keyCode : event.which;
        if (code === 13) {
          $(this).click();
        }
      });
      $activeCells.first().focus();
    }, 0);
  }

  /**
   * formRepeatableFields
   * @return void
   */
  function formRepeatableFields() {
    $('body').on('wpcf7-field-groups/change', '.wpcf7-field-groups', function (event) {
      var fieldGroupClass = '.wpcf7-field-group';
      var fieldGroupRemClass = '.wpcf7-field-group-remove';
      var formControlWrapClass = '.wpcf7-form-control-wrap';
      var $groups_inside = $(event.target).find(fieldGroupClass);
      $groups_inside.each(function (index) {
        $(this).find(fieldGroupRemClass).toggle(index > 0);
        var i = index + 1;
        $(this).find('[name]').each(function () {
          var $$ = $(this),
            name = $$.attr('name'),
            $fc_wrap = $$.closest(formControlWrapClass),
            is_array = name.indexOf('[]') > -1,
            raw_name = name.replace('[]', ''),
            new_name = raw_name.replace(/__[0-9]*/, '') + '__' + i,
            new_id = new_name;
          if ($fc_wrap.length && !$fc_wrap.hasClass(new_name)) {
            $fc_wrap.removeClass(raw_name).addClass(new_name);
            var $closest = $fc_wrap.closest('form__col');
            $closest.find('label').attr('for', new_name);
          }
          new_name += is_array ? '[]' : '';
          $$.attr('name', new_name);
          $$.attr('id', new_id);
          $$.closest('.form__col').find('.form__label').attr('for', new_name);
        });
      });
      $(this).find('.wpcf7-field-group-count').val($groups_inside.length);
    });
    $(document).on('click', '#add-day', function (event) {
      event.preventDefault();
      var $groups = $('.wpcf7-field-groups');
      var $new_group = $groups.data('group-model').clone(true);
      dailyTotalsReadOnly($new_group, roomTypesCount);
      $groups.append($new_group);
      $groups.trigger('wpcf7-field-groups/change');
      return false;
    });
    $(document).on('mouseleave', '#add-day', function (event) {
      $(event.target).blur().off('mouseleave');
    });
    $(document).on('click tap keyup', '.wpcf7-field-groups .form__input', function (event) {
      formInputFocusIn(event);
    });
    $(document).on('blur', '.wpcf7-field-groups .form__input', function (event) {
      formInputFocusOut(event);
    });

    /**
     * Count types of room.
     * Example: Single, Double, Suite
     */
    var roomTypesCount = 3;

    /**
     * Row totals
     * @type {*|HTMLElement}
     */
    var $rowTotals = $('.form__row--totals');

    /**
     * Initial room row
     * @type {*|HTMLElement}
     */
    var $initialRoomRow = $('.form__row--repeater');

    /**
     * Daily total calculation
     * Sum values rooms by type in he row
     */
    $(document).on('change', '.form__row--repeater .form__input--text', function (event) {
      /**
       * Rooms in day
       * @type {Array}
       */
      var roomsInDay = [];

      /**
       * Rooms in type
       * @type {Array}
       */
      var roomsInType = [];

      /**
       * Total daily
       */
      var totalDaily = 0;

      /**
       * Room row object
       * @type {Element}
       */
      var $roomRow = $(this).closest('.form__row--repeater');

      /**
       * All rooms objects
       * @type {*|HTMLElement}
       */
      var $allRoomsRows = $('.form__row--repeater');
      $roomRow.find('.form__input--text').each(function (i) {
        if (i === roomTypesCount) {
          return false;
        }
        roomsInDay.push(parseInt($(this).val()) || 0);
      });
      totalDaily = roomsInDay.reduce(function (sum, current) {
        return sum + current;
      }, 0);
      $roomRow.find('.form__input--text').each(function (i) {
        if (i === roomTypesCount) {
          $(this).val(totalDaily).closest('.form__col').find('.form__label').addClass('form__label--focus');
        }
      });
      $allRoomsRows.each(function (i) {
        var $row = $(this);
        $row.find('.form__input--text').each(function (j) {
          roomsInType[j] = (roomsInType[j] || 0) + (parseInt($(this).val()) || 0);
        });
      });
      $rowTotals.find('.form__input--text').each(function (i) {
        $(this).val(roomsInType[i]);
      });
      $rowTotals.find('.form__input--hidden').each(function (i) {
        $(this).val(roomsInType[i]);
      });
    });
    dailyTotalsReadOnly($initialRoomRow, roomTypesCount);
    roomsTotalsReadOnly($rowTotals);
  }

  /**
   * dailyTotalsReadOnly
   * @param row
   * @param countTypesOfRooms
   * @return void
   */
  function dailyTotalsReadOnly(row, countTypesOfRooms) {
    row.find('.form__input--text').each(function (i) {
      if (i === countTypesOfRooms) {
        $(this).attr('disabled', 'disabled');
      }
    });
  }

  /**
   * roomsTotalsReadOnly
   * @param row
   * @return void
   */
  function roomsTotalsReadOnly(row) {
    row.find('.form__input--text').each(function (i) {
      $(this).attr('disabled', 'disabled');
    });
  }

  /**
   * Rooms regex input
   * @param str
   * @returns {boolean}
   */
  function roomsRegexInput(str) {
    var regex = /[0-9]|\./;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  }
})(jQuery);
"use strict";

(function ($) {
  /**
   * language switcher container
   * @type {string}
   */
  var containerEl = '.c-language-switcher';

  /**
   * language switcher button
   * @type {string}
   */
  var buttonEl = '.c-language-switcher__button';

  /**
   * language switcher current item
   * @type {string}
   */
  var curLangEl = '.c-language-switcher__current';

  /**
   * language switcher list
   * @type {string}
   */
  var langListEl = '.c-language-switcher__list';

  /**
   * language switcher last item link
   * @type {string}
   */
  var langListLastEl = '.c-language-switcher__item:last-child a';

  /**
   * class open
   * @type {string}
   */
  var openClass = 'open';

  /**
   * undefined, 1 - mouse click, mobile device tap
   * 13 - keyboard enter code
   * 32 - keyboard space code
   * @type {*[]}
   */
  var keyCodesAvailable = [undefined, 1, 13, 32];
  $(document).on('click tap', buttonEl, function (event) {
    console.log(event.keyCode);
    if (keyCodesAvailable.indexOf(event.keyCode) === -1) {
      return false;
    }
    languageSwitcherToggle();
  });
  $(document).on('click tap', function (event) {
    if (!$(containerEl).is(event.target) && $(containerEl).has(event.target).length === 0 && $(curLangEl).hasClass(openClass)) {
      languageSwitcherClose();
    }
  });
  $(document).on('keydown', langListLastEl, function (event) {
    if (event.keyCode !== 9) {
      return false;
    }
    setTimeout(function () {
      $(buttonEl).focus();
    }, 0);
  });

  /**
   * Language switcher toggle
   * @returns {boolean}
   */
  function languageSwitcherToggle() {
    $(curLangEl).toggleClass(openClass);
    if ($(curLangEl).hasClass(openClass)) {
      languageSwitcherOpen();
    } else {
      languageSwitcherClose();
    }
    return false;
  }

  /**
   * Language switcher open
   */
  function languageSwitcherOpen() {
    $(langListEl).stop().slideDown();
  }

  /**
   * Language switcher close
   */
  function languageSwitcherClose() {
    $(langListEl).stop().slideUp();
  }
})(jQuery);
"use strict";

(function ($) {
  var _this = this;
  /**
   * hamburger button class
   * @type {string}
   */
  var hamburger = '.c-hamburger';

  /**
   * hamburger items
   * @type {string}
   */
  var hamburgerItems = '.c-hamburger__item';

  /**
   * Any link element of primary nav
   * @type {string}
   */
  var navigationLinks = '.page-header a, .c-hamburger';

  /**
   * page header
   * @type {string}
   */
  var header = '.page-header';

  /**
   * page header expanded
   * @type {string}
   */
  var headerExpanded = '.page-header-expanded';

  /**
   * header booking link element
   * @type {string}
   */
  var headerBookEl = '.page-header__reserve-btn';

  /**
   * undefined, 1 - mouse click, mobile device tap
   * 13 - keyboard enter code
   * 32 - keyboard space code
   * @type {*[]}
   */
  var keyCodesAvailable = [undefined, 1, 13, 32];

  /**
   * Mobile nav
   * @type {string}
   */
  var mobileNav = '.page-header-expanded__mobile';

  /**
   * Hero el
   * @type {*|jQuery|HTMLElement}
   */
  var hero = $('.hero');

  /**
   * Hero logo
   * @type {*|jQuery|HTMLElement}
   */
  var heroLogo = $('.hero__logo');

  /**
   * Sticky Menu
   * @type {*|jQuery|HTMLElement}
   */
  var stickyMenu = $('.js-sticky-menu');

  /**
   * Sticky menu keeper
   * @type {*|jQuery|HTMLElement}
   */
  var stickyMenuPlug = $('.hero__sticky--plug');

  /**
   * Scroll top start position for hiding menu/button
   * @type {*|number}
   */
  var scrollHideStart = hero.length ? hero.offset().top : Math.max($(document).height(), $(window).height());

  /**
   * Scroll end start position for reveal menu/button
   * @type {*|number}
   */
  var scrollHideEnd = stickyMenu.length ? stickyMenuPlug.offset().top : hero.length ? hero.height() + scrollHideStart + 100 : Math.max($(document).height(), $(window).height());

  /**
   * Book button
   * @type {*|jQuery|HTMLElement}
   */
  var bookButton = $('.js-book-button');

  /**
   * Page hero logo
   * @type {*|jQuery|HTMLElement}
   */
  var pageHeroLogo = $('.page-header__logo');

  /**
   * Previous scroll holder var
   * @type {number}
   */
  var previousScroll = 0;
  $(document).on('click tap', hamburger, function (event) {
    if (keyCodesAvailable.indexOf(event.keyCode) === -1) {
      return false;
    }
    menuToggle(event.target);
  });
  $(window).on('resize', function () {
    $(hamburger).removeClass('open');
    $(hamburgerItems).removeClass('open');
    navClose();
  });
  $(window).on('load', function () {
    if (isScrollHero()) {
      pageHeroLogo.addClass('d-none');
      if (!stickyMenu.length) {
        $('.page-header__logo img').attr('src', pageHeroLogo.attr('data-logo'));
      }
    } else {
      pageHeroLogo.removeClass('d-none');
    }
  });
  $(window).on('scroll', throttle(function () {
    var scroll = $(_this).scrollTop();
    if (scroll < scrollHideStart || scroll > scrollHideEnd) {
      if (scroll > 0) {
        bookButton.addClass('active');
      }
    } else {
      $(header).addClass('hidden');
      $('body').removeClass('header-scroll-show');
      if (stickyMenu.length) {
        stickyMenu.removeClass('scroll');
      }
    }

    //only top-of-start related logic
    if (scroll < scrollHideStart) {
      if (isScrollHero()) {
        pageHeroLogo.addClass('d-none');
      }
      $(header).removeClass('hidden');
      $('body').addClass('header-scroll-show');
    }

    //only initial scrollTop = 0 logic
    if (scroll === 0) {
      bookButton.removeClass('active');
      $('body').removeClass('header-scroll-show');
    }

    //only bottom-of-end related logic
    if (scroll > scrollHideEnd) {
      pageHeroLogo.removeClass('d-none');
      if ($(window).width() > gridBreakPoints.md) {
        if (scroll < previousScroll || stickyMenu.length) {
          $(header).removeClass('hidden');
          $('body').addClass('header-scroll-show');
        } else if (scroll > previousScroll) {
          $(header).addClass('hidden');
          $('body').removeClass('header-scroll-show');
        }
        $(hamburger).removeClass('open');
        $(hamburgerItems).removeClass('open');
        navClose();
      } else {
        $(header).removeClass('hidden');
        $('body').addClass('header-scroll-show');
      }
      if (stickyMenu.length) {
        stickyMenu.addClass('scroll');
      }
    }
    previousScroll = scroll;
  }, 50));

  /**
   * toggle hamburger button and open/close main nav
   */
  function menuToggle() {
    $(hamburger).toggleClass('open');
    $(hamburgerItems).toggleClass('open');
    if ($(hamburger).hasClass('open')) {
      navOpen();
    } else {
      navClose();
    }
  }
  function navOpen() {
    $(header).addClass('open');
    $(headerExpanded).slideDown(300, function () {
      $(mobileNav).addClass('open');
    });
    $(headerBookEl).addClass('active');
    $('body').addClass('page-header-active');
    $('body a, body button, body input').prop('tabindex', -1);
    $(navigationLinks).attr('tabindex', 0);
    // if ($(window).width() < gridBreakPoints.xl) {
    //     pageHeroLogo.removeClass('d-none');
    // }

    if ($(window).width() < gridBreakPoints.md) {
      $('html,body').addClass('lock-scroll');
    }
  }
  function navClose() {
    $(header).removeClass('open');
    $(mobileNav).removeClass('open');
    $(headerExpanded).slideUp(300);
    $(headerBookEl).removeClass('active');
    $('body').removeClass('page-header-active');
    $('body a, body button, body input').removeAttr('tabindex');
    $(navigationLinks).removeAttr('tabindex');

    // if ($(window).width() < gridBreakPoints.xl && $(window).scrollTop() === 0 && isScrollHero()) {
    //     pageHeroLogo.addClass('d-none');
    // }

    if ($(window).width() < gridBreakPoints.md) {
      $('html,body').removeClass('lock-scroll');
    }
  }
  function isScrollHero() {
    return hero.length && hero.hasClass('hero--scrollType');
  }
})(jQuery, gridBreakPoints);
"use strict";

(function ($) {
  /**
   * RFP main selector
   * @type {string}
   */
  var rfp = '.js-rfp';

  /**
   * Active class
   * @type {string}
   */
  var rfpActiveClass = 'visible';

  /**
   * Button which fires click on submit
   * @type {string}
   */
  var rfpSubmitEl = '.js-rfp-submit';

  /**
   * Custom form submit button
   * @type {string}
   */
  var rfpButtonEl = '.js-rfp-button';

  /**
   * rfp hash
   *
   * @type {string}
   */
  var rfpHash = '#rfp';

  /**
   * open RFP for by clicking this button
   * @type {string}
   */
  var rfpButtonOpenEl = 'a[href="#rfp"]';

  /**
   * rfp close button
   * @type {string}
   */
  var rfpButtonCloseEl = '.js-close-rfp';

  /**
   * Open rfp popup
   */
  function rfpOpen() {
    $('body').addClass('overflow-hidden');
    $(rfp).addClass(rfpActiveClass);
    $(rfp).css('visibility', 'visible');
  }

  /**
   * Close popup
   */
  function rfpClose() {
    $(rfp).removeClass(rfpActiveClass);
    $(rfp).css('visibility', 'hidden');
    $('body').removeClass('overflow-hidden');
    window.location.hash = '';
  }
  $(window).on('load', function () {
    if (rfpHash === window.location.hash) {
      rfpOpen();
    }
  });

  /**
   * Catch a hash and open rfp
   */
  $(document).on('click', rfpButtonOpenEl, function (event) {
    var href = $(event.target).prop('href');
    if (!href) {
      href = $(event.target).closest('a').prop('href');
    }
    if (!href) {
      return false;
    }
    var url = new URL(href);
    if (url.hash.length && url.hash === rfpHash) {
      rfpOpen();
    }
  });

  /**
   * Close button handler
   */
  $(document).on('click tap', rfpButtonCloseEl, function () {
    rfpClose();
  });

  /**
   * Submit form by click on our beautiful button
   */
  $(document).on('click', rfpButtonEl, function (e) {
    $(rfpSubmitEl).click();
  });
})(jQuery);
"use strict";

(function ($) {
  /**
   * sidebar
   * @type {string}
   */
  var sidebarEl = '.sidebar';

  /**
   * sidebar wrapper
   * @type {string}
   */
  var wrapperEl = '.sidebar__wrapper';

  /**
   * sidebar title
   * @type {string}
   */
  var sidebarTitleEl = '.sidebar__title';

  /**
   * sidebar menu outer
   * @type {string}
   */
  var menuOuterEl = '.sidebar__menu-outer';

  /**
   * sidebar menu
   * @type {string}
   */
  var menuEl = '.sidebar__menu';

  /**
   * sidebar menu items
   * @type {string}
   */
  var itemEl = '.sidebar__item';

  /**
   * sidebar menu current item
   * @type {string}
   */
  var currentItemEl = '.sidebar__current-item';

  /**
   * Sidebar link
   * @type {string}
   */
  var sidebarLinkEl = '.sidebar__link';

  /**
   * Current item title
   * @type {string}
   */
  var sidebarCurrentItemInner = '.sidebar__current-item-inner';

  /**
   * foxed class
   * @type {string}
   */
  var stickyClass = 'fixed';

  /**
   * collapsed class
   * @type {string}
   */
  var collapsedClass = 'collapsed';

  /**
   * open class
   * @type {string}
   */
  var openClass = 'open';

  /**
   * collapsed elements
   * @type {*[]}
   */
  var collapsedEl = ['.sidebar__menu-outer', '.sidebar__menu', '.sidebar__current-item', '.sidebar__item'];

  /**
   * property's header invert modifier
   * @type {string}
   */
  var invertStyle = 'invert';

  /**
   * Offset from top which fires fixed position
   * @type {number}
   */
  var mobileSidebarOffset = 84;

  /**
   * Breakpoint for mobile sidebar
   * @type {number}
   */
  var breakpoint = gridBreakPoints.xl;

  /**
   * property's header's elements to invert colors
   * @type {*[]}
   */
  var invertEl = ['.sidebar', '.sidebar__link', '.sidebar__title', '.c-language-switcher__current--header'];

  /**
   * hero section element
   * @type {string}
   */
  var heroSectionEl = '.hero';

  /**
   * Sticky sidebar mobile
   */
  $(window).bind("scroll", function () {
    if (!isElementExists(sidebarEl)) return false;
    var scrollTop = getWindowScrollTop();
    elementRemoveClass(wrapperEl, stickyClass);
    elementRemoveClass(sidebarEl, stickyClass);
    if (scrollTop > 0 && scrollTop >= getElementOffset(sidebarEl) - mobileSidebarOffset) {
      elementAddClass(wrapperEl, stickyClass);
      elementAddClass(sidebarEl, stickyClass);
    }
  });

  /**
   * sidebar invert colors desktop
   */
  $(window).bind("scroll", function () {
    if (!isElementExists(heroSectionEl)) return false;
    if (!isElementExists(sidebarEl)) return false;
    var scrollTop = getWindowScrollTop();
    if (scrollTop > 0 && scrollTop > getElementHeight(heroSectionEl)) {
      if (!$(sidebarEl).hasClass(invertStyle)) {
        invertEl.forEach(function (item) {
          elementAddClass(item, invertStyle);
        });
      }
    } else {
      if ($(sidebarEl).hasClass(invertStyle)) {
        invertEl.forEach(function (item) {
          elementRemoveClass(item, invertStyle);
        });
      }
    }
  });

  /**
   * Invert sidebar's colors if hero section doesn't exists
   */
  $(window).on("load", function () {
    if (!isElementExists(heroSectionEl)) {
      invertEl.forEach(function (item) {
        elementAddClass(item, invertStyle);
      });
    }
  });

  /**
   * Collapse sidebar
   */
  $(window).on("load resize", function () {
    if (!isElementExists(sidebarEl)) return false;
    if (!isElementExists(wrapperEl)) return false;
    var scrollTop = getWindowScrollTop();
    elementRemoveClass(wrapperEl, stickyClass);
    elementRemoveClass(sidebarEl, stickyClass);
    if (scrollTop > 0 && scrollTop >= getElementOffset(sidebarEl)) {
      elementAddClass(wrapperEl, stickyClass);
      elementAddClass(sidebarEl, stickyClass);
    }
    if (getWindowWidth() < breakpoint) {
      collapsedEl.forEach(function (item) {
        elementAddClass(item, collapsedClass);
        elementHide(menuOuterEl);
        elementRemoveClass(currentItemEl, openClass);
      });
    } else {
      collapsedEl.forEach(function (item) {
        elementRemoveClass(item, collapsedClass);
        elementShow(menuOuterEl);
      });
    }
  });

  /**
   * Toggle sidebar menu on mobile
   */
  $(document).on("click tap", currentItemEl, function (event) {
    if (!isElementExists(wrapperEl)) return false;
    elementToggleClass(currentItemEl, openClass);
    if ($(currentItemEl).hasClass(openClass)) {
      menuOpen();
    } else {
      menuClose();
    }
  });
  $(document).on("click tap", sidebarLinkEl, function (event) {
    updateCurrentItemTitle($(this).text());
    menuClose();
  });
  $(window).on('activate.bs.scrollspy', function (event, object) {
    var $title = $("[href='" + object.relatedTarget + "']");
    if ($title) {
      updateCurrentItemTitle($title.first().text());
    }
  });

  /**
   * menuOpen
   * @return void
   */
  function menuOpen() {
    $(menuOuterEl).slideDown();
  }

  /**
   * menuClose
   * @return void
   */
  function menuClose() {
    $(menuOuterEl).slideUp();
  }

  /**
   * getWindowScrollTop
   * @returns {jQuery}
   */
  function getWindowScrollTop() {
    return $(window).scrollTop();
  }

  /**
   * getElementOffset
   * @param element
   * @returns {jQuery}
   */
  function getElementOffset(element) {
    return $(element).offset().top;
  }

  /**
   * elementAddClass
   * @param element
   * @param cssClass
   */
  function elementAddClass(element, cssClass) {
    $(element).addClass(cssClass);
  }

  /**
   * elementRemoveClass
   * @param element
   * @param cssClass
   */
  function elementRemoveClass(element, cssClass) {
    $(element).removeClass(cssClass);
  }

  /**
   * elementShow
   * @param element
   */
  function elementShow(element) {
    $(element).show();
  }

  /**
   * elementHide
   * @param element
   */
  function elementHide(element) {
    $(element).hide();
  }

  /**
   * elementToggleClass
   * @param element
   * @param cssClass
   */
  function elementToggleClass(element, cssClass) {
    $(element).toggleClass(cssClass);
  }

  /**
   * getElementHeight
   * @param element
   * @returns {jQuery}
   */
  function getElementHeight(element) {
    return $(element).height();
  }

  /**
   * Return window width
   * @returns {number}
   */
  function getWindowWidth() {
    return $(window).width();
  }

  /**
   * Update active on
   */
  function updateCurrentItemTitle(title) {
    $(sidebarCurrentItemInner).text(title);
  }
})(jQuery, gridBreakPoints);
"use strict";

(function ($) {
  $(window).bind('hashchange load', function (event) {
    catchHash();
  });
  $(document).on('click', '.nav__submenu-link[href*=\\#]', function (event) {
    // Exit if booking page
    if (isBookingPage()) {
      event.preventDefault();
      return;
    }
    var requestedLinkPath = getLocation($(this).attr('href')).pathname;
    var pathName = window.location.pathname;
    var hash = this.hash;
    if (requestedLinkPath.replace(/^\/|\/$/g, '') === pathName.replace(/^\/|\/$/g, '')) {
      event.preventDefault();
      history.pushState("", document.title, window.location.pathname + hash);
      smoothScroll(hash);
    }
  });
  function catchHash() {
    var hash = location.hash;

    // Exit if booking page
    if (isBookingPage()) {
      return false;
    }
    if (!$(hash).length) {
      return false;
    }
    if (hash) {
      smoothScroll(hash);
    }
  }
  function smoothScroll(hash) {
    var headerDesktop = 50,
      //header height changes after scrolling window, difficult to get dynamic value
      headerMobile = 60,
      height = $(window).width() > 992 ? headerDesktop : headerMobile,
      adminBar = $('#wpadminbar'),
      duration = 700;
    if (adminBar.length) {
      height += adminBar.height();
    }
    $('html,body').animate({
      scrollTop: $(hash).offset().top - height
    }, duration);
    setTimeout(function () {
      $(document).trigger('afterSmoothScroll', [hash]);
    }, duration);
  }
  function getLocation(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
  }
  function isBookingPage() {
    return typeof BOOKING_SETTINGS !== 'undefined';
  }
})(jQuery);
"use strict";

var animatedContent = function animatedContent() {
  (function ($) {
    var $appeared = $('.c-appeared');
    var timeOut = 50;
    $appeared.each(function () {
      var $this = $(this);
      if ($this.visible(true) && !$this.hasClass('c-appeared--done')) {
        $this.addClass('c-appeared--done');
      }
    });
  })(jQuery);
};
(function ($) {
  $(document).ready(function () {
    if ($('.c-appeared')[0]) {
      return animatedContent();
    }
  });
  $(window).on('scroll', function () {
    if ($('.c-appeared')[0]) {
      return animatedContent();
    }
  });
})(jQuery);
"use strict";

/**
 * @file
 * Attaches behaviors for the Contextual module.
 */

(function ($) {
  /**
   * Attaches outline behavior for regions associated with contextual links.
   */
  $(document).ready(function () {
    $('div.contextual-links-wrapper').each(function () {
      var $wrapper = $(this);
      var $region = $wrapper.closest('.contextual-links-region');
      var $links = $wrapper.find('ul.contextual-links');
      var $trigger = $('<a class="contextual-links-trigger" href="#" />').text('Configure').click(function () {
        $links.stop(true, true).slideToggle(100);
        $wrapper.toggleClass('contextual-links-active');
        return false;
      });
      // Attach hover behavior to trigger and ul.contextual-links.
      $trigger.add($links).hover(function () {
        $region.addClass('contextual-links-region-active');
      }, function () {
        $region.removeClass('contextual-links-region-active');
      });
      // Hide the contextual links when user clicks a link or rolls out of the .contextual-links-region.
      $region.bind('mouseleave click', function () {
        $(this).find('.contextual-links-active').removeClass('contextual-links-active').find('ul.contextual-links').hide();
      });
      $region.hover(function () {
        $trigger.addClass('contextual-links-trigger-active');
      }, function () {
        $trigger.removeClass('contextual-links-trigger-active');
      });
      // Prepend the trigger.
      $wrapper.prepend($trigger);
    });
  });
})(jQuery);
"use strict";

(function ($) {
  var customSelect, i, selectedElement, div, optionDiv, optionItem;
  /*look for any elements with the class "c-custom-select":*/
  customSelect = document.getElementsByClassName("c-custom-select");
  for (i = 0; i < customSelect.length; i++) {
    selectedElement = customSelect[i].getElementsByTagName("select")[0];
    /*for each element, create a new DIV that will act as the selected item:*/
    div = document.createElement("DIV");
    div.setAttribute("id", selectedElement.getAttribute("id") + '-' + i);
    div.setAttribute("class", "c-custom-select__selected");
    div.setAttribute("role", "listbox");
    div.setAttribute("aria-expanded", "false");
    div.setAttribute("aria-label", selectedElement.getAttribute("title"));
    div.innerHTML = selectedElement.options[selectedElement.selectedIndex].innerHTML;
    div.tabIndex = 0;
    customSelect[i].appendChild(div);
    /*for each element, create a new DIV that will contain the option list:*/
    optionDiv = document.createElement("DIV");
    optionDiv.setAttribute("class", "c-custom-select__items c-custom-select__items--hide");
    optionDiv.setAttribute("aria-labelledby", selectedElement.getAttribute("id") + '-' + i);
    for (var j = 0; j < selectedElement.length; j++) {
      /*for each option in the original select element,
      create a new DIV that will act as an option item:*/
      optionItem = document.createElement("DIV");
      optionItem.setAttribute("class", "c-custom-select__option");
      optionItem.setAttribute("role", "option");
      optionItem.tabIndex = 0;
      optionItem.innerHTML = selectedElement.options[j].innerHTML;
      if (selectedElement.options[j].disabled) {
        optionItem.style.pointerEvents = 'none';
        optionItem.classList.add('disabled');
      }
      if (selectedElement.options[j].selected) {
        optionItem.classList.add("c-custom-select__items--selected");
        optionItem.setAttribute("aria-selected", "true");
      }
      optionItem.addEventListener("click", selectOption);
      optionItem.addEventListener("keydown", function (e) {
        var keyCode = e.keyCode ? e.keyCode : e.which;
        if (keyCode === 13) {
          e.target.click();
        }
        if (keyCode === 38) {
          // up
          e.preventDefault();
          var currentElement = $(document.activeElement).index();
          if (currentElement > 0) {
            $(document.activeElement).parent().children().eq(currentElement - 1).focus();
          }
        }
        if (keyCode === 40) {
          // down
          e.preventDefault();
          var currentElement = $(document.activeElement).index();
          var length = $(document.activeElement).parent().children().length;
          if (currentElement < length - 1) {
            $(document.activeElement).parent().children().eq(currentElement + 1).focus();
          }
        }
      });
      optionDiv.appendChild(optionItem);
    }
    customSelect[i].appendChild(optionDiv);
    div.addEventListener("click", toggleCustomSelect);
    div.addEventListener("keydown", function (e) {
      var keyCode = e.keyCode ? e.keyCode : e.which;
      if (keyCode === 13) {
        e.target.click();
      }
    });
  }
  function toggleCustomSelect(e) {
    e.stopPropagation();
    closeAllSelect(this);
    this.nextSibling.classList.toggle("c-custom-select__items--hide");
    this.setAttribute("aria-expanded", this.nextSibling.classList.contains("c-custom-select__items--hide") ? "false" : "true");
  }
  function selectOption(e) {
    /*when an item is clicked, update the original select box,
    and the selected item:*/
    var y, i, k, select, h;
    select = this.parentNode.parentNode.getElementsByTagName("select")[0];
    h = this.parentNode.previousSibling;
    for (i = 0; i < select.length; i++) {
      if (select.options[i].innerHTML == this.innerHTML) {
        select.selectedIndex = i;
        h.innerHTML = this.innerHTML;
        y = this.parentNode.querySelectorAll(".c-custom-select__items--selected");
        for (k = 0; k < y.length; k++) {
          y[k].classList.remove("c-custom-select__items--selected");
          y[k].setAttribute("aria-selected", "false");
        }
        this.classList.add("c-custom-select__items--selected");
        this.setAttribute("aria-selected", "true");
        break;
      }
    }
    h.click();
  }
  function closeAllSelect(element) {
    /*a function that will close all select boxes in the document,
    except the current select box:*/
    var x,
      y,
      i,
      arrNo = [];
    x = document.getElementsByClassName("c-custom-select__items");
    y = document.getElementsByClassName("c-custom-select__selected");
    if (y[0]) {
      y[0].setAttribute("aria-expanded", "false");
    }
    for (i = 0; i < y.length; i++) {
      if (element == y[i]) {
        arrNo.push(i);
      }
    }
    for (i = 0; i < x.length; i++) {
      if (arrNo.indexOf(i)) {
        x[i].classList.add("c-custom-select__items--hide");
      }
    }
  }

  /*if the user clicks anywhere outside the select box,
  then close all select boxes:*/
  document.addEventListener("click", closeAllSelect);
  document.addEventListener("scroll", closeAllSelect);
})(jQuery);
"use strict";

(function ($) {
  $(window).on('load resize', function () {
    var loadDelay = 0;
    if (getBrowserInfo() === 'msie') {
      loadDelay = 1000;
    }
    setTimeout(function () {
      showButton();
    }, loadDelay);
  });
  $(document).on('click', '.c-expander__button-label', function (event) {
    toggleExpander(event);
  });
  $(document).on('keydown', '.c-expander__button-label', function (event) {
    var code = event.keyCode ? event.keyCode : event.which;
    if (code !== 13) {
      return true;
    }
    toggleExpander(event);
  });
  function showButton() {
    var $expander = $('.c-expander');
    var $button = $expander.find('.c-expander__button');
    if (isOffer()) {
      $button.show();
    }
    $expander.each(function () {
      var curExpander = $(this);
      var curTile = curExpander.closest('.tile-big');
      var curShadow = curExpander.find('.c-expander__shadow');
      var curButton = curExpander.find('.c-expander__button');
      var curExcerpt = curExpander.find('.c-expander__excerpt');
      var curExcerptInner = curExpander.find('.c-expander__excerpt-inner');
      var curExcerptHeight = curExcerpt.height();
      var curExcerptInnerHeight = curExcerptInner.height();
      if (curTile.find('.tile-big__more').length) {
        curTile.find('.tile-big__content-wrapper').addClass('wrap');
        return;
      }

      // $('.tile-big__content-wrapper').removeClass('wrap');

      if (curExcerptInnerHeight > curExcerptHeight) {
        curButton.show();
        curShadow.show();
      }
    });
  }
  function toggleExpander(event) {
    var curContentBoxContainer = $(event.target).closest('.content-box');
    var curExpanderContainer = $(event.target).closest('.c-expander');
    var curContainer = curContentBoxContainer.length ? curContentBoxContainer : curExpanderContainer;
    var curExpander = $(event.target).closest('.c-expander');
    var curShadow = curExpander.find('.c-expander__shadow');
    var curExcerpt = curExpander.find('.c-expander__excerpt');
    var curDetails = curContainer.find('.content-box-details');
    var curButtonLabel = curContainer.find('.c-expander__button-label');
    curShadow.toggleClass('expanded');
    curExcerpt.toggleClass('expanded');
    curButtonLabel.toggleClass('expanded');
    if (curDetails.length) {
      curDetails.toggleClass('content-box-details__expanded').find('.c-expander__button-label.expanded').focus();
      curButtonLabel.toggleClass('expanded d-none');
    }
  }
  function isOffer() {
    return !!$('.content-box--offer').length;
  }
})(jQuery);
"use strict";

/**
 * See ./blocks/nav.js
 */
(function ($) {
  $(document).ready(function () {});
})(jQuery);
"use strict";

(function ($) {
  $(document).ready(function ($) {
    var keydownClass = 'c-keyDown';
    // Using mousedown instead of mouseover, so that previously focused elements don't lose focus ring on mouse move
    $('body').on('mousedown', function (e) {
      $('body').removeClass(keydownClass);
    });
    //keydown listener
    $('body').on('keydown', function (e) {
      var keyCode = e.keyCode || e.which;
      if (keyCode == 9) {
        $('body').addClass(keydownClass);
      }
    });
  });
})(jQuery);
"use strict";

(function ($) {
  $(document).ready(function ($) {
    initPopup();
    $('.c-popup').on($.modal.BEFORE_OPEN, function (event, modal) {
      $('header, main, footer').attr('aria-hidden', 'true');
    }).on($.modal.OPEN, function (event, modal) {
      modal.$elm.find('.c-popup__close').focus();
    }).on($.modal.BEFORE_CLOSE, function (event, modal) {
      $('header, main, footer').removeAttr('aria-hidden');
    }).on($.modal.AFTER_CLOSE, function (event, modal) {
      modal.$anchor.focus();
    });
    $('body').on('keydown', '.c-popup', focusElements).on("keyup", ":not(.c-popup)", moveFocusToClose);
  });
  function initPopup() {
    $('a.open-modal').click(function (event) {
      $(this).modal({
        fadeDuration: 250,
        showSpinner: false,
        blockerClass: 'c-popup--blocker',
        modalClass: 'c-popup',
        closeClass: 'c-popup__close',
        showClose: false
      });
      return false;
    });
  }
  function focusElements(event) {
    var $this = $(this),
      $modal = $.modal.getCurrent();
    if (event.keyCode === 27 && $modal) {
      // esc
      $modal.$elm.find('.c-popup__close').trigger('click');
    }
    if (event.keyCode === 9) {
      // tab
      // jQuery formatted selector to search for focusable items
      var focusableElementsString = "a[href], area[href], input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), object, embed, *[tabindex], *[contenteditable]";

      // get list of all children elements in given object
      var children = $this.find('*');

      // get list of focusable items
      var focusableItems = children.filter(focusableElementsString).filter(':visible');

      // get currently focused item
      var focusedItem = $(document.activeElement);

      // get the number of focusable items
      var numberOfFocusableItems = focusableItems.length;
      var focusedItemIndex = focusableItems.index(focusedItem);
      if (!event.shiftKey && focusedItemIndex === numberOfFocusableItems - 1) {
        focusableItems.get(0).focus();
        event.preventDefault();
      }
      if (event.shiftKey && focusedItemIndex === 0) {
        focusableItems.get(numberOfFocusableItems - 1).focus();
        event.preventDefault();
      }
    }
  }
  function moveFocusToClose(event) {
    var $modal = $.modal.getCurrent(),
      focusedItem = $(document.activeElement),
      inModal = !!focusedItem.parents('.c-popup').length;
    if ($modal && event.keyCode === 9 && inModal === false) {
      // tab
      $modal.$elm.find('.c-popup__close').focus();
    }
  }
})(jQuery);
"use strict";

var preloaderEl = document.querySelector('.c-preloader');
function preloaderDone() {
  preloaderEl.style.opacity = 0;
  document.dispatchEvent(new CustomEvent('preloader:done', {
    bubbles: true
  }));
}
if (preloaderEl) {
  preloaderEl.addEventListener('transitionend', function () {
    preloaderEl.remove();
  }, {
    once: true
  });
  window.addEventListener('load', function () {
    preloaderDone();
  });
  setTimeout(function () {
    if (preloaderEl) {
      preloaderDone();
    }
  }, 7000);
}
"use strict";

(function ($) {
  $(window).on('load resize', function () {
    truncate();
  });
  function truncate() {
    var $truncate = $('.c-truncate');
    $truncate.removeClass('c-truncate--shadow').each(function () {
      var curTruncate = $(this),
        curTruncateInner = $(this).find('.c-truncate__inner');
      if (curTruncateInner.width() > curTruncate.width()) {
        curTruncate.addClass('c-truncate--shadow');
      }
    });
  }
})(jQuery);