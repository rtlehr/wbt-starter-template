class Animation {

	constructor(course, pageInfo) {
		this.course = course;

		// ACCESSIBILITY: detect prefers-reduced-motion once
		this.reduceMotion = window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	init() {
		console.log("Animation Initialized");

		// Safety net: cancel animations (and stop begin sounds) when page is hidden/unloaded
		window.addEventListener('pagehide', () => {
			$('.animateMe').each((_, node) => this._cancelAnim($(node), { stopSounds: true }));
		});
	}

	// --- Helpers (A11y + utils) ---------------------------------------------
	_focusableSelector() {
		return [
			'a[href]',
			'area[href]',
			'button:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'iframe',
			'audio[controls]',
			'video[controls]',
			'[contenteditable]',
			'[tabindex]'
		].join(',');
	}

	// Mark/unmark aria-hidden and manage tabindex on the element & descendants
	_setHiddenForA11y($el, hidden) {
		if (hidden) {
			// store original tabindex on self (if any)
			if (!$el.data('_prevTabindex')) {
				const prev = $el.attr('tabindex');
				if (prev != null) $el.data('_prevTabindex', prev);
			}
			$el.attr('aria-hidden', 'true').attr('tabindex', '-1');

			// store/disable descendants
			$el.find(this._focusableSelector()).each(function () {
				const $c = $(this);
				if (!$c.data('_prevTabindex')) {
					const prev = $c.attr('tabindex');
					if (prev != null) $c.data('_prevTabindex', prev);
				}
				$c.attr('tabindex', '-1');
			});
		} else {
			$el.removeAttr('aria-hidden');

			// restore self tabindex if we had one; otherwise remove
			const prev = $el.data('_prevTabindex');
			if (prev != null) {
				$el.attr('tabindex', String(prev));
			} else {
				$el.removeAttr('tabindex');
			}
			$el.removeData('_prevTabindex');

			// restore descendants
			$el.find(this._focusableSelector()).each(function () {
				const $c = $(this);
				const p = $c.data('_prevTabindex');
				if (p != null) {
					$c.attr('tabindex', String(p));
				} else {
					$c.removeAttr('tabindex');
				}
				$c.removeData('_prevTabindex');
			});
		}
	}
	// -------------------------------------------------------------------------

	setUpAnimation() {
		const self = this;

		if (mqPhone.matches) {
			return;
		}

		$(".animateMe").each(function () {
			let eWidth = $(this).width();
			let eHeight = $(this).height();
			let eTop = $(this).offset().top;
			let eLeft = $(this).offset().left;

			let cW = $(this).attr("data-animationPane") || "#courseWindow";

			let wHeight = $(cW).height();
			let wWidth = $(cW).width();
			let wTop = $(cW).offset().top;
			let wLeft = $(cW).offset().left;

			let newTop = 0;
			let newLeft = 0;

			let goToTop = 0;
			let goToLeft = 0;
			let goToOpacity = 1;

			// slideInBottom
			if ($(this).hasClass("slideInBottom")) {
				newTop = (wHeight - (eTop - wTop));
			}
			// slideInRight
			if ($(this).hasClass("slideInRight")) {
				newLeft = (wWidth - (eLeft - wLeft));
			}
			// slideInTop
			if ($(this).hasClass("slideInTop")) {
				newTop = 0 - ((eTop - wTop) + eHeight);
			}
			// slideInLeft
			if ($(this).hasClass("slideInLeft")) {
				newLeft = 0 - ((eLeft - wLeft) + eWidth);
			}

			// slideRight
			if ($(this).hasClass("slideRight")) {
				goToLeft = wWidth - eWidth;
			}
			// slideLeft
			if ($(this).hasClass("slideLeft")) {
				goToLeft = 0 - (wWidth - eWidth);
			}
			// slideBottom
			if ($(this).hasClass("slideBottom")) {
				goToTop = wHeight - eHeight;
			}
			// slideTop
			if ($(this).hasClass("slideTop")) {
				goToTop = 0 - (wHeight - eHeight);
			}

			// slideOutLeft
			if ($(this).hasClass("slideOutLeft")) {
				newLeft = 0;
				goToLeft = 0 - ((eLeft - wLeft) + eWidth);
			}
			// slideOutRight
			if ($(this).hasClass("slideOutRight")) {
				newLeft = 0;
				goToLeft = (wWidth - (eLeft - wLeft));
			}
			// slideOutTop
			if ($(this).hasClass("slideOutTop")) {
				newTop = 0;
				goToTop = 0 - ((eTop - wTop) + eHeight);
			}
			// slideOutBottom
			if ($(this).hasClass("slideOutBottom")) {
				newTop = 0;
				goToTop = (wHeight - (eTop - wTop));
			}

			// fadeIn
			if ($(this).hasClass("fadeIn")) {
				$(this).css("opacity", 0);
			}
			// fadeOut
			if ($(this).hasClass("fadeOut")) {
				goToOpacity = 0;
			}

			if (newTop != 0) {
				$(this).css("top", newTop);
				if (newTop < 0) {
					goToTop = Math.abs(newTop);
				} else {
					goToTop = 0 - newTop;
				}
			}

			if (newLeft != 0) {
				$(this).css("left", newLeft);
				if (newLeft < 0) {
					goToLeft = Math.abs(newLeft);
				} else {
					goToLeft = 0 - newLeft;
				}
			}

			const rawZoom = $(this).data('zoom');
			const hasZoomClass = $(this).hasClass('zoom');
			const scaleTarget = Number.isFinite(rawZoom) ? Number(rawZoom) : null;

			// Use new per-axis attributes (with legacy fallback)
			const anchor = self._readAnchor($(this));
			$(this).css('transform-origin', anchor);

			const cfg = {
				left: goToLeft,
				top: goToTop,
				opacity: goToOpacity,
				duration: $(this).data('duration') ?? 1,
				delay: $(this).data('delay') ?? 0
			};

			if (hasZoomClass || scaleTarget != null) {
				cfg.scale = (scaleTarget != null) ? scaleTarget : 1;
				cfg.anchor = anchor; // store for playAnimation()
			}

			// TYPEWRITER: prep the node (store full text; create visual span)
			if ($(this).hasClass('typewriter')) {
				const full = $(this).text();
				$(this)
					.attr('aria-label', full)
					.attr('aria-live', 'off') // avoid SR spam during typing
					.empty()
					.append('<span class="tw-txt" aria-hidden="true"></span>')
					.attr('data-tw-full', full);
			}

			$(this).attr('data-animation', JSON.stringify(cfg));

			// Always last line
			$(this).css("visibility", "visible");
		});
	}

	playAnimation(target) {

		if (mqPhone.matches) {
			return;
		}

		const $el = (typeof target === 'string') ? $(target).first() : $(target);
		if (!$el || !$el.length) return;

		const cfg = this.parseAnimationJSON($el);

		// Defaults
		const left = Number(cfg.left || 0);
		const top = Number(cfg.top || 0);
		const opacity = (cfg.opacity == null) ? null : Number(cfg.opacity);
		const duration = Number(cfg.duration || 0.6);
		const delay = Number(cfg.delay || 0);
		const easing = cfg.easing || 'linear';
		const isTypewriter = $el.hasClass('typewriter');

		// NEW: Zoom parameters
		const hasZoom = (cfg.scale != null);
		const scaleTarget = hasZoom ? Number(cfg.scale) : 1;
		const transformOrigin = cfg.anchor || this._readAnchor($el); // fallback if needed
		$el.css('transform-origin', transformOrigin);

		// Callbacks & chaining
		const startFnName = $el.attr('data-startFunction');
		const endFnName = $el.attr('data-endFunction');
		const chain = $el.attr('data-chain') || null;
		const startFn = (startFnName && window[startFnName]) || null;
		const endFn = (endFnName && window[endFnName]) || null;

		const beginSound = $el.attr('data-beginSound');
		const endSound = $el.attr('data-endSound');

		// ACCESSIBILITY: if we’re going to show (opacity > 0), make it visible and restore focusability
		if (opacity == null || opacity > 0) {
			$el.css('visibility', 'visible');
			this._setHiddenForA11y($el, false);
		}

		// mark this run as the active animation instance for this element
		const startToken = this._markAnimStart($el);

		// Begin sound (no adapter here—uses your course API)
		if (beginSound != undefined) {
			try { course.playSound(beginSound); } catch (e) {}
		}

		// Respect reduce motion: jump to end state, still honor callbacks/chain
		if (this.reduceMotion) {
			if (typeof startFn === 'function') startFn($el[0]);

			// For typewriter: instantly reveal full text
			if (isTypewriter) {
				const span = $el.find('.tw-txt');
				const full = $el.attr('data-tw-full') || '';
				if (span.length) span.text(full);
				else $el.text(full);
			}

			// immediate final state (no transform timing here)
			const transformFinal = this._composeTransform(left, top, scaleTarget);
			$el.css('transform-origin', transformOrigin);
			$el.css('transform', transformFinal);
			if (opacity != null) $el.css('opacity', String(opacity));

			// A11y when hidden at end
			if (opacity === 0) {
				$el.css('visibility', 'hidden');
				this._setHiddenForA11y($el, true);
			}

			if (typeof endFn === 'function') endFn($el[0]);

			// Only play endSound if still valid
			if (this._shouldStillPlay($el, startToken) && endSound != undefined) {
				try {
					if (beginSound != undefined) course.stopSound(beginSound);
				} catch (e) {}
				try { course.playSound(endSound); } catch (e) {}
			}

			if (chain && this._shouldStillPlay($el, startToken)) this.playAnimation(chain);

			// clear any guards for safety (none set in reduced motion, but keeps state clean)
			this._cancelAnim($el);
			return;
		}

		// ------- TYPEWRITER BRANCH -----------------------------------------
		if (isTypewriter) {
			if (typeof startFn === 'function') startFn($el[0]);

			// Optional opacity tween in parallel (no transform for typewriter)
			if (opacity != null) {
				$el.css({
					transitionProperty: 'opacity',
					transitionDuration: duration + 's',
					transitionTimingFunction: easing,
					transitionDelay: delay + 's',
					willChange: 'opacity'
				});
				// Force reflow then apply target opacity
				void $el[0].offsetWidth;
				$el.css('opacity', String(opacity));
			}

			// Run typing
			this._runTypewriter($el, this._getTypingOptions($el, duration, delay)).then(() => {
				// Cleanup transition styles
				$el.css({
					transitionProperty: '',
					transitionDuration: '',
					transitionTimingFunction: '',
					transitionDelay: '',
					willChange: ''
				});

				if (opacity === 0) {
					$el.css('visibility', 'hidden');
					this._setHiddenForA11y($el, true);
				}

				if (!this._shouldStillPlay($el, startToken)) {
					this._cancelAnim($el);
					return;
				}

				if (typeof endFn === 'function') endFn($el[0]);

				if (endSound != undefined) {
					try {
						if (beginSound != undefined) course.stopSound(beginSound);
					} catch (e) {}
					try { course.playSound(endSound); } catch (e) {}
				}

				if (chain) this.playAnimation(chain);

				this._cancelAnim($el);
			});

			return; // IMPORTANT: skip the transform-based flow below
		}
		// -------------------------------------------------------------------

		// Build transition CSS (non-typewriter path)
		const props = (opacity == null) ? 'transform' : 'transform, opacity';
		$el.css({
			transitionProperty: props,
			transitionDuration: duration + 's',
			transitionTimingFunction: easing,
			transitionDelay: delay + 's',
			willChange: 'transform, opacity'
		});

		// Ensure the requested transform origin is used for scaling
		$el.css('transform-origin', transformOrigin);

		if (typeof startFn === 'function') startFn($el[0]);

		// Force reflow
		void $el[0].offsetWidth;

		// Apply final state (translate + optional scale)
		const transformFinal = this._composeTransform(left, top, scaleTarget);
		$el.css('transform', transformFinal);
		if (opacity != null) $el.css('opacity', String(opacity));

		// Fallback guard if transitionend never fires
		const total = (delay + duration) * 1000 + 50;
		const guard = setTimeout(() => {
			// Only synthesize if still valid
			if (this._shouldStillPlay($el, startToken)) {
				$el.trigger('transitionend');
			}
		}, total);
		this._setGuardTimer($el, guard);

		// End handler (namespaced)
		const onEnd = (ev) => {
			if (ev && ev.originalEvent && !/^(transform|opacity)$/.test(ev.originalEvent.propertyName)) return;

			clearTimeout(guard);
			$el.off('transitionend.anim', onEnd);

			// Cleanup transition styles (keep transform-origin intact)
			$el.css({
				transitionProperty: '',
				transitionDuration: '',
				transitionTimingFunction: '',
				transitionDelay: '',
				willChange: ''
			});

			// A11y when hidden at end
			if (opacity === 0) {
				$el.css('visibility', 'hidden');
				this._setHiddenForA11y($el, true);
			}

			// If this completion is stale (navigated away, element removed, etc.), stop here
			if (!this._shouldStillPlay($el, startToken)) {
				this._cancelAnim($el);
				return;
			}

			if (typeof endFn === 'function') endFn($el[0]);

			if (endSound != undefined) {
				try {
					if (beginSound != undefined) course.stopSound(beginSound);
				} catch (e) {}
				try { course.playSound(endSound); } catch (e) {}
			}

			if (chain) {
				this.playAnimation(chain);
			}

			this._cancelAnim($el);
		};

		$el.one('transitionend.anim', onEnd);
	}

	parseAnimationJSON($el) {
		let raw = $el.attr('data-animation');
		if (!raw) return {};

		raw = raw
			.replace(/&quot;/g, '"')
			.replace(/[“”]/g, '"')
			.replace(/[‘’]/g, "'")
			.trim();

		if (raw.indexOf(';') !== -1) {
			raw = raw.replace(/;\s*(?=")/g, ',');
		}

		try {
			return JSON.parse(raw);
		} catch (e) {
			console.error('Invalid data-animation JSON after normalization:', raw, e);
			return {};
		}
	}

	// Resolve "Foo.bar.baz" to window.Foo.bar.baz if it’s a function
	_resolveFn(path) {
		if (!path) return null;
		let ctx = window;
		for (const part of String(path).split('.')) {
			ctx = (ctx && ctx[part]) || null;
			if (ctx == null) return null;
		}
		return (typeof ctx === 'function') ? ctx : null;
	}

	// === Typewriter helpers ===================================================

	// Run the typewriter effect. Returns a Promise that resolves when typing finishes.
	_runTypewriter($el, opts) {
		// opts: { duration, delay, cps } — cps (chars/sec) optional; overrides duration logic
		return new Promise((resolve) => {
			const span = $el.find('.tw-txt').get(0);
			const full = String($el.attr('data-tw-full') || '');
			if (!span || !full.length) {
				// nothing to type
				if (span) span.textContent = full;
				return resolve();
			}

			// Reduced motion: show full text and exit
			if (this.reduceMotion) {
				span.textContent = full;
				return resolve();
			}

			const delayMs = Math.max(0, (opts.delay ?? 0) * 1000);
			const cps = Number(opts.cps);
			const durationMs = (cps && cps > 0)
				? Math.ceil((full.length / cps) * 1000)
				: Math.max(50, (opts.duration ?? 1) * 1000);

			const stepMs = Math.max(8, Math.floor(durationMs / Math.max(1, full.length)));
			let i = 0;

			const start = () => {
				const tick = () => {
					// reveal next char
					const end = Math.min(full.length, i + 1);
					span.textContent = full.slice(0, end);
					i = end;

					if (i >= full.length) return resolve();
					typingId = setTimeout(tick, stepMs);
				};
				tick();
			};

			let typingId = null;
			setTimeout(start, delayMs);
		});
	}

	// Compute typing options, allowing optional data-cps to override duration
	_getTypingOptions($el, duration, delay) {
		const cps = Number($el.data('cps'));
		return { duration, delay, cps: Number.isFinite(cps) ? cps : null };
	}

	// === Transform helpers ====================================================

	// Compose transform string. IMPORTANT ORDER:
	// We apply scale FIRST so the translate distances are not scaled.
	_composeTransform(leftPx, topPx, scaleVal) {
		const s = Number.isFinite(scaleVal) ? scaleVal : 1;
		const x = Number.isFinite(leftPx) ? leftPx : 0;
		const y = Number.isFinite(topPx) ? topPx : 0;
		// scale then translate (translate applied after scale)
		return `scale(${s}) translate(${x}px, ${y}px)`;
	}

	// Map per-axis anchors to a CSS transform-origin string.
	// Accepts data-horizontalAnchor: left|center|right
	// and data-verticleAnchor / data-verticalAnchor: top|center|bottom
	_readAnchor($el) {
		// Back-compat single attribute (data-anchor) if both per-axis are missing
		const legacy = String($el.data('anchor') ?? '').toLowerCase().trim();

		// Per-axis (preferred)
		let hx = String($el.data('horizontalanchor') ?? '').toLowerCase().trim();
		// Support both "verticle" (as requested) and "vertical" (common spelling)
		let vy = String(
			($el.data('verticleanchor') ?? $el.data('verticalanchor') ?? '')
		).toLowerCase().trim();

		// If neither per-axis provided, try to parse legacy combined anchor
		if (!hx && !vy && legacy) {
			switch (legacy) {
				case 'left-top':
				case 'top-left': return '0% 0%';
				case 'right-top':
				case 'top-right': return '100% 0%';
				case 'left-bottom':
				case 'bottom-left': return '0% 100%';
				case 'right-bottom':
				case 'bottom-right': return '100% 100%';
				case 'center':
				default: return '50% 50%';
			}
		}

		// Normalize per-axis values
		const mapX = { left: '0%', center: '50%', right: '100%' };
		const mapY = { top: '0%', center: '50%', bottom: '100%' };

		const x = mapX[hx] ?? '50%';
		const y = mapY[vy] ?? '50%';

		return `${x} ${y}`;
	}

	// === Animation cancel/guard helpers ======================================

	_markAnimStart($el) {
		const active = ($el.data('_animActive') || 0) + 1;
		$el.data('_animActive', active);
		return active; // token
	}

	_setGuardTimer($el, id) {
		const timers = $el.data('_animGuards') || [];
		timers.push(id);
		$el.data('_animGuards', timers);
	}

	_cancelAnim($el, opts = { stopSounds: false }) {
		const timers = $el.data('_animGuards') || [];
		timers.forEach(clearTimeout);
		$el.removeData('_animGuards');

		// bump token so any late completions are ignored
		const active = ($el.data('_animActive') || 0) + 1;
		$el.data('_animActive', active);

		if (opts.stopSounds && typeof course?.stopSound === 'function') {
			const beginSound = $el.attr('data-beginSound');
			if (beginSound) {
				try { course.stopSound(beginSound); } catch (e) {}
			}
		}
	}

	_shouldStillPlay($el, startToken) {
		// token changed => stale
		if (($el.data('_animActive') || 0) !== startToken) return false;
		// element detached or missing
		const el = $el[0];
		if (!el || !el.isConnected || !document.body.contains(el)) return false;
		// page hidden/unloading (common during navigation)
		if (document.visibilityState === 'hidden') return false;
		return true;
	}
}
