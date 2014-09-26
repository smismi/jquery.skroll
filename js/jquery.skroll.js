/*
 * Price scrollbar plugin - jQuery Plugin
 */
;
(function ($) {


	function Skroll(element, options) {


		this.defaults = {

			direction: "v"

		};


		this.params = $.extend({a:1,b:2}, this.defaults, options);


		this.el = $(element);


		this.el.css("border", "1px solid red");

		this.constructor().autoupdate();
	}

	Skroll.prototype.constructor = function () {



		var barPos,
			scrollerPos0,
			track,
			resizePauseTimer,
			scrollPauseTimer,
			scrollingTimer,
			pause,
			scrollLastFire,
			resizeLastFire,
			oldBarSize,
			pos = ['left', 'top', 'right', 'bottom', 'width', 'height'],
			origin = {
				v: { // Vertical
					x: 'Y', pos: pos[1], oppos: pos[3], crossPos: pos[0], crossOpPos: pos[2], size: pos[5], crossSize: pos[4],
					client: 'clientHeight', crossClient: 'clientWidth', crossScroll: 'scrollWidth', offset: 'offsetHeight', crossOffset: 'offsetWidth', offsetPos: 'offsetTop',
					scroll: 'scrollTop', scrollSize: 'scrollHeight'
				},
				h: { // Horizontal
					x: 'X', pos: pos[0], oppos: pos[2], crossPos: pos[1], crossOpPos: pos[3], size: pos[4], crossSize: pos[5],
					client: 'clientWidth', crossClient: 'clientHeight', crossScroll: 'scrollHeight', offset: 'offsetWidth', crossOffset: 'offsetHeight', offsetPos: 'offsetLeft',
					scroll: 'scrollLeft', scrollSize: 'scrollWidth'
				}
			};

		params = this.params;

		resizeLastFire = scrollLastFire = new Date().getTime();


		this.event = params.event;
		this.events = {};


		// DOM elements
		this.root = this.el[0]; // Always html node, not just selector
		this.scroller = $(params.scroller)[0]; // (params.scroller) ? getNode(params.scroller, this.root) : this.root;
		var _suffix = ""

		if (params.direction == "h")  {
			_suffix = "_h"
		}


		this.bar = document.createElement('div');
		this.bar.className = params.bar || "scroller__bar" + _suffix;
		this.track = document.createElement('div');
		this.track.className = params.track || "scroller__bar-wrapper" + _suffix;

		this.track.appendChild(this.bar);
		this.root.appendChild(this.track);


		track = this.track;


		this.clipper = this.scroller.parentNode;

		// Parameters
		this.direction = params.direction;
		this.origin = origin[this.direction];
		this.barOnCls = params.barOnCls;
		this.scrollingCls = params.scrollingCls;
		this.barTopLimit = 0;
		pause = params.pause * 1000 || 0;

		// Updating height or width of bar
		function setBarSize(size) {
			/* jshint validthis:true */
			var barMinSize = this.barMinSize || 20;

			if (size > 0 && size < barMinSize) {
				size = barMinSize;
			}

			if (this.bar) {
				$(this.bar).css(this.origin.size, parseInt(size, 10) + 'px');
			}
		}

		// Updating top or left bar position
		function posBar(pos) {
			/* jshint validthis:true */
			if (this.bar) {
				$(this.bar).css(this.origin.pos, +pos + 'px');
			}
		}

		// Free path for bar
		function k() {
			/* jshint validthis:true */
			return track[this.origin.client] - this.barTopLimit - this.bar[this.origin.offset];
		}

		// Relative content top position to bar top position
		function relToPos(r) {
			/* jshint validthis:true */
			return r * k.call(this) + this.barTopLimit;
		}

		// Bar position to relative content position
		function posToRel(t) {
			/* jshint validthis:true */
			return (t - this.barTopLimit) / k.call(this);
		}

		// Cursor position in main direction in px // Now with iOs support
		this.cursor = function(e) {
			return e['client' + this.origin.x] || (((e.originalEvent || e).touches || {})[0] || {})['page' + this.origin.x];
		};

		// Text selection pos preventing
		function dontPosSelect() {
			return false;
		}

		this.pos = function(x) { // Absolute scroller position in px
			var ie = 'page' + this.origin.x + 'Offset',
				key = (this.scroller[ie]) ? ie : this.origin.scroll;

			if (x !== undefined) this.scroller[key] = x;

			return this.scroller[key];
		};

		this.rpos = function(r) { // Relative scroller position (0..1)
			var free = this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client],
				x;

			if (r) {
				x = this.pos(r * free);
			} else {
				x = this.pos();
			}

			return x / (free || 1);
		};

		// Switch on the bar by adding user-defined CSS classname to scroller
		this.barOn = function(dispose) {
			if (this.barOnCls) {
				if (dispose || this.scroller[this.origin.client] >= this.scroller[this.origin.scrollSize]) {
					$(this.root).removeClass(this.barOnCls);
				} else {
					$(this.root).addClass(this.barOnCls);
				}
			}
		};

		this._pos0 = function(e) {
			scrollerPos0 = this.cursor(e) - barPos;
		};

		this.drag = function(e) {
			this.scroller[this.origin.scroll] = posToRel.call(this, this.cursor(e) - scrollerPos0) * (this.scroller[this.origin.scrollSize] - this.scroller[this.origin.client]);
		};

		// Text selection preventing on drag
		this.selection = function(enable) {
			this.event(document, 'selectpos selectstart', dontPosSelect, enable ? 'off' : 'on');
		};

		// onResize & DOM modified handler
		this.resize = function() {
			var self = this,
				delay = 0;

			if (new Date().getTime() - resizeLastFire < pause) {
				clearTimeout(resizePauseTimer);
				delay = pause;
			}

			function upd() {
				var delta,
					client;

				self.barOn();

				client = self.scroller[self.origin.crossClient];

				delta = self.scroller[self.origin.crossOffset] - client;

				if (params.freeze && !self.clipper.style[self.origin.crossSize]) { // Sould fire only once
					$(self.clipper).css(self.origin.crossSize, self.clipper[self.origin.crossClient] - delta + 'px');
				}

				$(self.scroller).css(self.origin.crossSize, self.clipper[self.origin.crossClient] + delta + 'px');

				Array.prototype.unshift.call(arguments, 'resize');
				fire.apply(self, arguments);

				resizeLastFire = new Date().getTime();
			}

			if (delay) {
				resizePauseTimer = setTimeout(upd, delay);
			} else {
				upd();
			}




		};

		this.updatePositions = function() {
			var newBarSize,
				self = this;

			if (self.bar) {
				newBarSize = (track[self.origin.client] - self.barTopLimit) * self.scroller[self.origin.client] / self.scroller[self.origin.scrollSize];

				// Positioning bar
				if (parseInt(oldBarSize, 10) != parseInt(newBarSize, 10)) {
					setBarSize.call(self, newBarSize);
					oldBarSize = newBarSize;
				}

				barPos = relToPos.call(self, self.rpos());

				posBar.call(self, barPos);
			}

			Array.prototype.unshift.call( arguments, 'scroll' );
			fire.apply(self, arguments);

			scrollLastFire = new Date().getTime();
		};

		// onScroll handler
		this.scroll = function() {
			var delay = 0,
				self = this;

			if (new Date().getTime() - scrollLastFire < pause) {
				clearTimeout(scrollPauseTimer);
				delay = pause;
			}

			if (new Date().getTime() - scrollLastFire < pause) {
				clearTimeout(scrollPauseTimer);
				delay = pause;
			}

			if (delay) {
				scrollPauseTimer = setTimeout(function() {
					self.updatePositions();
				}, delay);
			} else {
				self.updatePositions();
			}

			if (self.scrollingCls) {
				if (!scrollingTimer) {
					this.$(this.scroller).addClass(this.scrollingCls);
				}
				clearTimeout(scrollingTimer);
				scrollingTimer = setTimeout(function() {
					self.$(self.scroller).removeClass(self.scrollingCls);
					scrollingTimer = undefined;
				}, 300);
			}

		};

		return this;
	};

	Skroll.prototype.update = function (params) {


	};
	Skroll.prototype.dispose = function (params) {




	};
	Skroll.prototype.on = function (eventName, func, arg) {



		var names = eventName.split(' ');

		for (var i = 0 ; i < names.length ; i++) {
			if (names[i] == 'init') {
				func.call(this, arg);
			} else {
				this.events[names[i]] = this.events[names[i]] || [];

				this.events[names[i]].push(function(userArg) {
					func.call(this, userArg || arg);
				});
			}
		}






		return this;
	};
	Skroll.prototype.autoupdate = function () {





		console.log("autoupdate");


		return this;
	};


	function manageEvents(item, eventManager, mode) {

		console.log("manageEvents");

	}


	$.fn.skroll = function (options) {

		return this.each(function () {

			$(this).data('touchControl', new Skroll(this, options));

		});
	};


	$.fn.skroll.Constructor = Skroll;


})(jQuery);