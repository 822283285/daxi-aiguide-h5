//     Zepto.js
//     (c) 2010-2015 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;
(function($, undefined) {
    var prefix = '',
        eventPrefix,
        vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
        testEl = document.createElement('div'),
        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform,
        transitionProperty, transitionDuration, transitionTiming, transitionDelay,
        animationName, animationDuration, animationTiming, animationDelay,
        cssReset = {}

    function dasherize(str) { return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase() }

    function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

    $.each(vendors, function(vendor, event) {
        if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
            prefix = '-' + vendor.toLowerCase() + '-'
            eventPrefix = event
            return false
        }
    })

    transform = prefix + 'transform'
    cssReset[transitionProperty = prefix + 'transition-property'] =
        cssReset[transitionDuration = prefix + 'transition-duration'] =
        cssReset[transitionDelay = prefix + 'transition-delay'] =
        cssReset[transitionTiming = prefix + 'transition-timing-function'] =
        cssReset[animationName = prefix + 'animation-name'] =
        cssReset[animationDuration = prefix + 'animation-duration'] =
        cssReset[animationDelay = prefix + 'animation-delay'] =
        cssReset[animationTiming = prefix + 'animation-timing-function'] = ''

    $.fx = {
        off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
        speeds: { _default: 400, fast: 200, slow: 600 },
        cssPrefix: prefix,
        transitionEnd: normalizeEvent('TransitionEnd'),
        animationEnd: normalizeEvent('AnimationEnd')
    }

    $.fn.animate = function(properties, duration, ease, callback, delay) {
        if ($.isFunction(duration))
            callback = duration, ease = undefined, duration = undefined
        if ($.isFunction(ease))
            callback = ease, ease = undefined
        if ($.isPlainObject(duration))
            ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
        if (duration) duration = (typeof duration == 'number' ? duration :
            ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
        if (delay) delay = parseFloat(delay) / 1000
        return this.anim(properties, duration, ease, callback, delay)
    }

    $.fn.anim = function(properties, duration, ease, callback, delay) {
        var key, cssValues = {},
            cssProperties, transforms = '',
            that = this,
            wrappedCallback, endEvent = $.fx.transitionEnd,
            fired = false

        if (duration === undefined) duration = $.fx.speeds._default / 1000
        if (delay === undefined) delay = 0
        if ($.fx.off) duration = 0

        if (typeof properties == 'string') {
            // keyframe animation
            cssValues[animationName] = properties
            cssValues[animationDuration] = duration + 's'
            cssValues[animationDelay] = delay + 's'
            cssValues[animationTiming] = (ease || 'linear')
            endEvent = $.fx.animationEnd
        } else {
            cssProperties = []
                // CSS transitions
            for (key in properties)
                if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
                else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

            if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
            if (duration > 0 && typeof properties === 'object') {
                cssValues[transitionProperty] = cssProperties.join(', ')
                cssValues[transitionDuration] = duration + 's'
                cssValues[transitionDelay] = delay + 's'
                cssValues[transitionTiming] = (ease || 'linear')
            }
        }

        wrappedCallback = function(event) {
            if (typeof event !== 'undefined') {
                if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
                $(event.target).unbind(endEvent, wrappedCallback)
            } else
                $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

            fired = true
            $(this).css(cssReset)
            callback && callback.call(this)
        }
        if (duration > 0) {
            this.bind(endEvent, wrappedCallback)
                // transitionEnd is not always firing on older Android phones
                // so make sure it gets fired
            setTimeout(function() {
                if (fired) return
                wrappedCallback.call(that)
            }, ((duration + delay) * 1000) + 25)
        }

        // trigger page reflow so new elements can animate
        this.size() && this.get(0).clientLeft

        this.css(cssValues)

        if (duration <= 0) setTimeout(function() {
            that.each(function() { wrappedCallback.call(this) })
        }, 0)

        return this
    }
    $.fn.scrollTo = function(options) {

        var defaults = {
            toT: 0, //滚动目标位置
            durTime: 500, //过渡动画时间
            delay: 30, //定时器时间
            minMoveDistance: 10,
            callback: null //回调函数
        };
        var opts = $.extend(defaults, options),
            timer = null,
            _this = this,
            curTop = _this.scrollTop(), //滚动条当前的位置
            subTop = opts.toT - curTop, //滚动条目标位置和当前位置的差值
            index = 0,
            dur = Math.round(opts.durTime / opts.delay),
            _disDur = Math.round(subTop / opts.minMoveDistance),

            smoothScroll = function(t) {
                index++;
                var per = Math.round(subTop / dur);
                if (index >= dur) {
                    _this.scrollTop(t);
                    window.clearInterval(timer);
                    if (opts.callback && typeof opts.callback == 'function') {
                        opts.callback();
                    }
                    return;
                } else {
                    _this.scrollTop(curTop + index * per);
                }
            };
        dur > _disDur ? dur = _disDur : "";
        timer = window.setInterval(function() {
            smoothScroll(opts.toT);
        }, opts.delay);
        _this.stopScroll = function() {
            window.clearInterval(timer);
        };
        return _this;
    };

    testEl = null;
    $.fn.downHighLight = function(className) {
        className = className || "curr";
        $(this).forEach(function(_this) {
            $(_this).bind(ev_start, function(e) {
                if (cls.indexOf(className) == -1) {
                    cls.push(className);
                }
                $(_this).addClass(className);
            });
            $(_this).bind(ev_end, function(e) {
                $(_this).removeClass(className);
            });
        });
    };
   
    //防止tap事件重复添加cheng.li 20160521
	$.fn._event = function(ev, dom, callback) {
		if(typeof dom=="string"&&dom.indexOf(",")){
			var doms=dom.split(",");
			for(var i=0;i<doms.length;i++){
				this.off(ev, doms[i]);
				this.on(ev, doms[i], callback);
			}
		}else{
			this.off(ev, dom);
			this.on(ev, dom, callback);
		}
    };
    //点击动态改变样式 参数数组 cheng.li 20160603
	$.fn.toggleCls = function(arr) {
		this.attr("toggle", this.attr("toggle") == "0" ? (parseInt(this.attr("toggle")) + 1) : "0");
		for(var i=0;i<arr.length;i++){
			this.removeClass(arr[i]);
		}
		this.addClass(arr[this.attr("toggle")]);
		if(arr.length == this.attr("toggle")) {
			this.attr("toggle", "0");
		}
	}
	window._event = {}
	var events = {};
	_event.getEvent = function(type, flag, data) {
		if(events.hasOwnProperty(type)) {
			//			console.log("has");
			var evt = events[type];
			for(var k in data) {
				evt[k] = data[k];
			}
			return evt;
		} else {
			if(flag) {
				return false;
			} else {
				var evt = document.createEvent('Event');
				evt.initEvent(type, true, true);
				for(var k in data) {
					evt[k] = data[k];
				}
				events[type] = evt;
				return evt;
			}

		}

	};
	_event.dispatchEvent = function(evt) {
		if(evt){
			document.body.dispatchEvent(evt);
		}
	};
	_event.removeEvent = function(type) {
		return delete events[type];
	};
	_event.addEventListener = function(type, call) {
		document.body.addEventListener(type, call, false);
	};
	_event.removeEventListener = function(type, call) {
		document.body.removeEventListener(type, call, false);
		_event.removeEvent(type);
	};
})(Zepto);
(function($) {
    $.extend($.fn, {
        fadeIn: function(ms, opacity) {
            if (typeof(ms) === 'undefined') {
                ms = 250;
            }
            $(this).css({
                display: 'block',
                opacity: 0
            }).animate({
                opacity: opacity || 1
            }, ms);
            return this;
        },
        fadeOut: function(ms, opacity) {
            if (typeof(ms) === 'undefined') {
                ms = 250;
            }
            $(this).css({
                display: 'none',
                opacity: 1
            }).animate({
                opacity: opacity || 0
            }, ms);

            return this;
        },
    });
})(Zepto);
// ;(function($){
//      $.extend($.fn,{
//         AddLongTap:function(callback){
//             var touch = {},
//             touchTimeout, tapTimeout, swipeTimeout,
//             longTapDelay = 500, longTapTimeout,
//             hasTouch="ontouchstart" in window,
//             cls=[],
//             ev_start=hasTouch ? "touchstart" : "mousedown"
//             ev_move=hasTouch ? "touchmove" : "mousemove"
//             ev_end=hasTouch ? "touchend" : "mouseup";
//             function parentIfText(node) {
//                 return 'tagName' in node ? node : node.parentNode
//             }
//             function longTap(e) {
//                 longTapTimeout = null
//                 if (touch.last) {
//                     // var event = $.Event('longTap');
//                     // event.touches = e.touches;
//                     // touch.el.trigger(event);
//                     callback(e);
//                     touch = {}
//                 }
//             }

//             function cancelLongTap() {
//                 if (longTapTimeout) clearTimeout(longTapTimeout)
//                 longTapTimeout = null
//             }

//             function cancelAll() {
//                 if (touchTimeout) clearTimeout(touchTimeout)
//                 if (tapTimeout) clearTimeout(tapTimeout)
//                 if (swipeTimeout) clearTimeout(swipeTimeout)
//                 if (longTapTimeout) clearTimeout(longTapTimeout)
//                 touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
//                 touch = {}
//             }
//             this.bind(ev_start, function(e){
//                 now = Date.now()
//                 delta = now - (touch.last || now)
//                 touch.el = $(parentIfText(hasTouch?e.touches[0].target: e.target))
//                 touchTimeout && clearTimeout(touchTimeout)
//                 touch.x1 = hasTouch?e.touches[0].pageX: e.pageX
//                 touch.y1 = hasTouch?e.touches[0].pageY: e.pageY
//                 if (delta > 0 && delta <= 250) touch.isDoubleTap = true
//                 touch.last = now
//                 longTapTimeout = setTimeout(longTap, longTapDelay,e)
//             }).bind(ev_move, function(e){
//                 cancelLongTap()
//                 touch.x2 = hasTouch?e.touches[0].pageX: e.pageX
//                 touch.y2 = hasTouch?e.touches[0].pageY: e.pageY
//             }).bind(ev_end, function(e){
//                 cancelLongTap();
//             }).bind('touchcancel', cancelAll);
//             // this.bind('scroll', cancelAll);
//         }
//      });

// })(Zepto);
// ;(function($){
//     var touch = {},
//         touchTimeout, tapTimeout, swipeTimeout,
//         longTapDelay = 750, longTapTimeout,
//         hasTouch="ontouchstart" in window,
//         cls=[],
//         ev_start=hasTouch ? "touchstart" : "mousedown"
//     ev_move=hasTouch ? "touchmove" : "mousemove"
//     ev_end=hasTouch ? "touchend" : "mouseup"
//     function parentIfText(node) {
//         return 'tagName' in node ? node : node.parentNode
//     }

//     function swipeDirection(x1, x2, y1, y2) {
//         var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
//         return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
//     }

//     function longTap(e) {
//         longTapTimeout = null
//         if (touch.last) {
//             var event = $.Event('longTap');
//             event.touches = e.touches;
//             // e.type = "longTap";
//             // touch.el.trigger('longTap');
//             touch.el.trigger(event);
//             touch = {}
//         }
//     }

//     function cancelLongTap() {
//         if (longTapTimeout) clearTimeout(longTapTimeout)
//         longTapTimeout = null
//     }

//     function cancelAll() {
//         if (touchTimeout) clearTimeout(touchTimeout)
//         if (tapTimeout) clearTimeout(tapTimeout)
//         if (swipeTimeout) clearTimeout(swipeTimeout)
//         if (longTapTimeout) clearTimeout(longTapTimeout)
//         touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
//         touch = {}
//     }

//     $(document).ready(function(){
//         var now, delta
//         $(document.body).bind(ev_start, function(e){
//             now = Date.now()
//             delta = now - (touch.last || now)
//             touch.el = $(parentIfText(hasTouch?e.touches[0].target: e.target))
//             touchTimeout && clearTimeout(touchTimeout)
//             touch.x1 = hasTouch?e.touches[0].pageX: e.pageX
//             touch.y1 = hasTouch?e.touches[0].pageY: e.pageY
//             if (delta > 0 && delta <= 250) touch.isDoubleTap = true
//             touch.last = now
//             longTapTimeout = setTimeout(longTap, longTapDelay,e)
//         }).bind(ev_move, function(e){
//             cancelLongTap()
//             touch.x2 = hasTouch?e.touches[0].pageX: e.pageX
//             touch.y2 = hasTouch?e.touches[0].pageY: e.pageY
//         }).bind(ev_end, function(e){
//             cancelLongTap()
//             // swipe
//             if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {
//                 touch.last = null;
//                 swipeTimeout = setTimeout(function () {
//                     if (!touch.el) return;
//                     touch.el.trigger('swipe');
//                     touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)));
//                     touch = {};
//                 }, 0)
//             } else if ('last' in touch) {// normal tap
//                 // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
//                 // ('tap' fires before 'scroll')
//                 tapTimeout = setTimeout(function () {
//                     // trigger universal 'tap' with the option to cancelTouch()
//                     // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
//                     var event = $.Event('tap')
//                     event.cancelTouch = cancelAll
//                     if (touch.el) {
//                         touch.el.trigger(event);
//                     }
//                     // trigger double tap immediately
//                     if (touch.isDoubleTap) {
//                         touch.el.trigger('doubleTap')
//                         touch = {}
//                     } else {// trigger single tap after 250ms of inactivity
//                         touchTimeout = setTimeout(function () {
//                             touchTimeout = null
//                             if (!touch.el) {
//                                 return;
//                             }
//                             touch.el.trigger('singleTap');
//                             touch = {};
//                         }, 250)
//                     }
//                 }, 0)
//             }

//         }).bind('touchcancel', cancelAll);
//         $(window).bind('scroll', cancelAll);
//     });
//     //点击高亮插件cheng.li 20150609
//     $.fn.downHighLight=function(className){
//         className=className||"curr";
//         $(this).forEach(function(_this){
//             $(_this).bind(ev_start,function(e){
//                 if(cls.indexOf(className)==-1){
//                     cls.push(className);
//                 }
//                 $(_this).addClass(className);
//             });
//             $(_this).bind(ev_end,function(e){
//                 $(_this).removeClass(className);
//             });
//         });
//     };
//     ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m){
//         $.fn[m] = function(callback){ return this.bind(m, callback) }
//     })
// })(Zepto);
(function($) {
    var touch = {},
        touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
        longTapDelay = 750,
        hasTouch = "ontouchstart" in window,
        hasPointer = "onpointerdown" in window,
        hasMSPointer = "onMSPointerdown" in window,
        gesture;
    function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode
    }

    function swipeDirection(x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    function longTap() {
        longTapTimeout = null
        if (touch.last) {
            touch.el.trigger('longTap')
            touch = {}
        }
    }

    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null;
    }

    function cancelAll() {
        if (touchTimeout) clearTimeout(touchTimeout)
        if (tapTimeout) clearTimeout(tapTimeout)
        if (swipeTimeout) clearTimeout(swipeTimeout)
        if (longTapTimeout) clearTimeout(longTapTimeout)
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
        touch = {}
    }

    function isPrimaryTouch(event) {
        return (event.pointerType == 'touch' || event.pointerType == event.MSPOINTER_TYPE_TOUCH) && event.isPrimary
    }

    function isPointerEventType(e, type) {
        return (e.type == 'pointer' + type || e.type.toLowerCase() == 'mspointer' + type)
    }
    $(document).ready(function() {
        // $("body").height(window.innerHeight);
        // document.body.addEventListener('touchmove', function (event) {
        //     if(event.target.tagName == "CANVAS" || (!event.canScroll && /MicroMessenger/.test(window.navigator.userAgent) && window.navigator.userAgent.indexOf("iPhone")!=-1)){
        //         event.preventDefault();
        //     }
        // }, {passive: false});
        var now, delta, deltaX = 0,
            deltaY = 0,
            firstTouch, _isPointerType
        if ('MSGesture' in window) {
            gesture = new MSGesture()
            gesture.target = document.body
        }

        function startEventFn(e) {
            deltaX = 0;
            deltaY = 0;
            if ((_isPointerType = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)) {} //return firstTouch = _isPointerType ? e : e.touches[0];
            firstTouch = _isPointerType ? e : e.touches[0];
            // touch = {}
            if (e.touches && e.touches.length === 1 && touch.x2) {
                // Clear out touch movement data if we have it sticking around
                // This can occur if touchcancel doesn't fire due to preventDefault, etc.
                touch.x2 = undefined
                touch.y2 = undefined
            }
            now = Date.now()
            delta = now - (touch.last || now);
            touch.el = $(parentIfText(hasTouch?e.touches[0].target: e.target));
            // touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
            touchTimeout && clearTimeout(touchTimeout)
            touch.x1 = firstTouch.pageX
            touch.y1 = firstTouch.pageY
            if (delta > 0 && delta <= 250) touch.isDoubleTap = true
            touch.last = now
            longTapTimeout = setTimeout(longTap, longTapDelay)
                // adds the current touch contact for IE gesture recognition
            if (gesture && _isPointerType) gesture.addPointer(e.pointerId);

        };

        function moveEventFn(e) {
            if (e.cancelable && !e.defaultPrevented) {
                e.preventDefault && e.preventDefault();
                e.stopPropgation && e.stopPropgation();
            }

            if (!touch.x1) { return; }
            if ((_isPointerType = isPointerEventType(e, 'move')) && !isPrimaryTouch(e)) {} // return
            // return firstTouch = _isPointerType ? e : e.touches[0]
            firstTouch = _isPointerType ? e : e.touches[0];
            cancelLongTap();
            if (!firstTouch) { return; }
            touch.x2 = firstTouch.pageX;
            touch.y2 = firstTouch.pageY;
            deltaX += Math.abs(touch.x1 - touch.x2);
            deltaY += Math.abs(touch.y1 - touch.y2);

        };

        function endEventFn(e) {
            if (!touch.el) {
                return;
            }
            if ((_isPointerType = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)) { cancelLongTap(); } // return
            // swipe
            if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 25) || (touch.y2 && Math.abs(touch.y1 - touch.y2) > 25)) {
                swipeTimeout = setTimeout(function() {
                    if (!touch.el) {
                        touch = {}
                        return;
                    }
                    touch.el.trigger('swipe');
                    touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
                    touch = {}
                }, 0)
                cancelLongTap();

            }

            // normal tap
            else if ('last' in touch) {
                var spendTime = Date.now() - touch.last;
                // don't fire tap when delta position changed by more than 30 pixels,
                // for instance when moving to a point and back to origin
                if (deltaX < 25 && deltaY < 25) {
                    // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                    // ('tap' fires before 'scroll')
                    if (!spendTime || spendTime < 900) {
                        // tapTimeout = setTimeout(function() {

                        // trigger universal 'tap' with the option to cancelTouch()
                        // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                        var event = $.Event('tap')
                        event.cancelTouch = cancelAll;
                       
                        // trigger double tap immediately
                        if (touch.isDoubleTap) {
                            if (touch.el) touch.el.trigger('doubleTap')
                            cancelLongTap();
                            touch = {};
                        }
                        // trigger single tap after 250ms of inactivity
                        else {
                            touchTimeout = setTimeout(function() {
                                clearTimeout(touchTimeout);
                                touchTimeout = null;
                                cancelLongTap();
                                if (touch.el) touch.el.trigger('singleTap');
                                 if (touch.el) {
                                    if (e.touches) {
                                        event.touches = e.touches;
                                    };
                                    touch.el.trigger(event);
                                };
                                touch = {};

                            }, 250)
                        }
                        // }, 0)

                    } else {
                        clearTimeout(touchTimeout);
                        clearTimeout(tapTimeout);
                        longTap();

                    }

                } else {
                    touch = {}
                }
            }
            deltaX = deltaY = 0;

        };
        $(document).bind('MSGestureEnd', function(e) {
                var swipeDirectionFromVelocity = e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
                if (swipeDirectionFromVelocity) {
                    touch.el.trigger('swipe')
                    touch.el.trigger('swipe' + swipeDirectionFromVelocity)
                }
            })
            // when the browser window loses focus,
            // for example when a modal dialog is shown,
            // cancel all ongoing events
        if (hasTouch) {
            $('body').on("touchstart", startEventFn).on("touchmove", moveEventFn).on("touchend", endEventFn).on('touchcancel', cancelAll);
        } else if (hasPointer) {
            $('body').on("pointerdown", startEventFn).on("pointermove", moveEventFn).on("pointerup", endEventFn).on('pointercancel', cancelAll);

        } else if (hasMSPointer) {
            $('body').on("MSPointerDown", startEventFn).on("MSPointerMove", moveEventFn).on("MSPointerUp", endEventFn).on('MSPointerCancel', cancelAll);

        }




        // scrolling the window indicates intention of the user
        // to scroll, not tap or swipe, so cancel all ongoing events
        $(window).on('scroll', cancelAll)
    });
    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
        'doubleTap', 'tap', 'singleTap', 'longTap'
    ].forEach(function(eventName) {
        $.fn[eventName] = function(callback) {
            return this.on(eventName, callback)
        }
    })
})(Zepto);
