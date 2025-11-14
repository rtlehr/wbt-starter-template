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

		if (mqPhone && mqPhone.matches) {
			return;
		}

		$(".animateMe").each(function () {
			const $el = $(this);

			// Reset transform so we start from a known state
    		$el.css('transform', '');

			// Reset per-element animation index on setup
			$el.data('_animIndex', 0);
			$el.attr('data-currentIndex', '0');

			// Which pane are we using for geometry?
			const cW = $el.attr("data-animationPane") || "#courseWindow";
			const $pane = $(cW);

			const eWidth = $el.width();
			const eHeight = $el.height();
			const eTop = $el.offset().top;
			const eLeft = $el.offset().left;

			const wHeight = $pane.height();
			const wWidth = $pane.width();
			const wTop = $pane.offset().top;
			const wLeft = $pane.offset().left;

			const anchor = self._readAnchor($el);
			$el.css('transform-origin', anchor);

			// Read any existing JSON configs (new format)
			let configs = self.parseAnimationJSONList($el);
			const hasArrayConfig = configs.length > 0;

			// If no JSON supplied, build a single config from legacy classes
			if (!hasArrayConfig) {
				configs = [{}];
			}

			// For legacy, infer style from CSS classes if missing on the first step
			if (!configs[0].style) {
				if ($el.hasClass("slideInBottom")) configs[0].style = "slideInBottom";
				else if ($el.hasClass("slideInRight")) configs[0].style = "slideInRight";
				else if ($el.hasClass("slideInTop")) configs[0].style = "slideInTop";
				else if ($el.hasClass("slideInLeft")) configs[0].style = "slideInLeft";
				else if ($el.hasClass("slideRight")) configs[0].style = "slideRight";
				else if ($el.hasClass("slideLeft")) configs[0].style = "slideLeft";
				else if ($el.hasClass("slideBottom")) configs[0].style = "slideBottom";
				else if ($el.hasClass("slideTop")) configs[0].style = "slideTop";
				else if ($el.hasClass("slideOutLeft")) configs[0].style = "slideOutLeft";
				else if ($el.hasClass("slideOutRight")) configs[0].style = "slideOutRight";
				else if ($el.hasClass("slideOutTop")) configs[0].style = "slideOutTop";
				else if ($el.hasClass("slideOutBottom")) configs[0].style = "slideOutBottom";
				else if ($el.hasClass("fadeIn")) configs[0].style = "fadeIn";
				else if ($el.hasClass("fadeOut")) configs[0].style = "fadeOut";
				else if ($el.hasClass("typewriter")) configs[0].style = "typewriter";
			}

			// TYPEWRITER prep: if any config uses style "typewriter" OR element has the class
			const hasTypewriterStyle = configs.some(c => {
				const styleStr = String(c.style || '').toLowerCase();
				const styleTokens = styleStr.split(/\s+/).filter(Boolean);
				return styleTokens.includes('typewriter');
			});
			if (hasTypewriterStyle || $el.hasClass('typewriter')) {
				const full = $el.text();
				$el
					.attr('aria-label', full)
					.attr('aria-live', 'off')
					.empty()
					.append('<span class="tw-txt" aria-hidden="true"></span>')
					.attr('data-tw-full', full);
			}

			// Normalize every step config
			const normConfigs = configs.map(raw => {
				const cfg = Object.assign({}, raw); // shallow copy
				const styleStr = String(cfg.style || '').toLowerCase();
				const styles = styleStr.split(/\s+/).filter(Boolean);

				let newTop = 0;
				let newLeft = 0;
				let goToTop = 0;
				let goToLeft = 0;
				let goToOpacity = 1;

				// --- slide-in from container edges --------------------------------
				if (styles.includes('slideinbottom')) {
					newTop = (wHeight - (eTop - wTop));
				}
				if (styles.includes('slideinright')) {
					newLeft = (wWidth - (eLeft - wLeft));
				}
				if (styles.includes('slideintop')) {
					newTop = 0 - ((eTop - wTop) + eHeight);
				}
				if (styles.includes('slideinleft')) {
					newLeft = 0 - ((eLeft - wLeft) + eWidth);
				}

				// --- slide within pane --------------------------------------------
				if (styles.includes('slideright')) {
					goToLeft = wWidth - eWidth;
				}
				if (styles.includes('slideleft')) {
					goToLeft = 0 - (wWidth - eWidth);
				}
				if (styles.includes('slidebottom')) {
					goToTop = wHeight - eHeight;
				}
				if (styles.includes('slidetop')) {
					goToTop = 0 - (wHeight - eHeight);
				}

				// --- slide out of pane (legacy precompute; playAnimation overrides) ---
				if (styles.includes('slideoutleft')) {
					newLeft = 0;
					goToLeft = 0 - ((eLeft - wLeft) + eWidth);
				}
				if (styles.includes('slideoutright')) {
					newLeft = 0;
					goToLeft = (wWidth - (eLeft - wLeft));
				}
				if (styles.includes('slideouttop')) {
					newTop = 0;
					goToTop = 0 - ((eTop - wTop) + eHeight);
				}
				if (styles.includes('slideoutbottom')) {
					newTop = 0;
					goToTop = (wHeight - (eTop - wTop));
				}

				// --- fades --------------------------------------------------------
				if (styles.includes('fadein')) {
					$el.css("opacity", 0);
					goToOpacity = 1;
				}
				if (styles.includes('fadeout')) {
					goToOpacity = 0;
				}

				// Position element if needed
				if (newTop !== 0) {
					$el.css("top", newTop);
					if (newTop < 0) {
						goToTop = Math.abs(newTop);
					} else {
						goToTop = 0 - newTop;
					}
				}
				if (newLeft !== 0) {
					$el.css("left", newLeft);
					if (newLeft < 0) {
						goToLeft = Math.abs(newLeft);
					} else {
						goToLeft = 0 - newLeft;
					}
				}

				// Fill in left/top/opacity if not explicitly provided
				if (cfg.left == null) cfg.left = goToLeft;
				if (cfg.top == null) cfg.top = goToTop;
				if (cfg.opacity == null) cfg.opacity = goToOpacity;

				// Duration / delay defaults
				const dataDuration = $el.data('duration');
				const dataDelay = $el.data('delay');
				cfg.duration = (cfg.duration != null)
					? cfg.duration
					: (dataDuration != null ? dataDuration : 1);
				cfg.delay = (cfg.delay != null)
					? cfg.delay
					: (dataDelay != null ? dataDelay : 0);

				// Zoom support (style "zoom", element class "zoom", or cfg.scale/data-zoom)
				const rawZoom = (cfg.scale != null) ? cfg.scale : $el.data('zoom');
				const hasZoom = styles.includes('zoom') || $el.hasClass('zoom') || (rawZoom != null);
				if (hasZoom) {
					cfg.scale = Number.isFinite(Number(rawZoom)) ? Number(rawZoom) : 1;
					cfg.anchor = cfg.anchor || anchor;
				}

				// Anchor default
				if (!cfg.anchor) {
					cfg.anchor = anchor;
				}

				return cfg;
			});

			// Store back normalized JSON (single object or array)
			const toStore = (normConfigs.length === 1) ? normConfigs[0] : normConfigs;
			$el.attr('data-animation', JSON.stringify(toStore));

			// Always last line
			$el.css("visibility", "visible");
		});
	}

	// -------------------------------------------------------------------------
	// Main play method: target (selector or jQuery), optional step index
	// -------------------------------------------------------------------------
	playAnimation(target, index) {

		if (mqPhone && mqPhone.matches) {
			return;
		}

		const $el = (typeof target === 'string') ? $(target).first() : $(target);
		if (!$el || !$el.length) return;

		// Pick the correct step from data-animation
		const cfgList = this.parseAnimationJSONList($el);
		if (!cfgList.length) return;

		// --- Per-element index tracking ------------------------------------
		const len = cfgList.length;

		let stepIndex;
		if (typeof index === 'number' && !Number.isNaN(index)) {
			// Explicit index override (clamped)
			stepIndex = Math.max(0, Math.min(index, len - 1));
		} else {
			// Auto-advance index per element
			let prev = $el.data('_animIndex');
			if (!Number.isInteger(prev) || prev < 0 || prev >= len) {
				prev = 0;
			}
			stepIndex = prev;
		}

		// Compute and store next index for this element only
		let nextIndex = stepIndex;
		if (stepIndex < len - 1) {
			nextIndex = stepIndex + 1;
		}
		$el.data('_animIndex', nextIndex);
		$el.attr('data-currentIndex', String(nextIndex)); // debug / visibility

		const cfg = cfgList[stepIndex];
		const styleStr = String(cfg.style || '').toLowerCase();
		const styles = styleStr.split(/\s+/).filter(Boolean);

		// Defaults (may be overridden for slideOut*)
		let left = Number(cfg.left || 0);
		let top = Number(cfg.top || 0);
		const opacity = (cfg.opacity == null) ? null : Number(cfg.opacity);
		const duration = Number(cfg.duration || 0.6);
		const delay = Number(cfg.delay || 0);
		const easing = cfg.easing || 'linear';

		// Typewriter if element has class OR style includes "typewriter"
		const isTypewriter = $el.hasClass('typewriter') || styles.includes('typewriter');

		// Zoom parameters
		const hasZoom = (cfg.scale != null);
		const scaleTarget = hasZoom ? Number(cfg.scale) : 1;
		const transformOrigin = cfg.anchor || this._readAnchor($el); // fallback if needed
		$el.css('transform-origin', transformOrigin);

		// Callbacks & chaining (JSON step overrides data- attributes)
		const startFnName = cfg.startFunction || $el.attr('data-startFunction');
		const endFnName = cfg.endFunction || $el.attr('data-endFunction');
		const chain = cfg.chain || $el.attr('data-chain') || null;
		const startFn = this._resolveFn(startFnName);
		const endFn = this._resolveFn(endFnName);

		// Sounds (JSON overrides data- attributes)
		const beginSound = cfg.beginSound || $el.attr('data-beginSound');
		const endSound = cfg.endSound || $el.attr('data-endSound');

		// ACCESSIBILITY: if we’re going to show (opacity > 0), make visible & focusable
		if (opacity == null || opacity > 0) {
			$el.css('visibility', 'visible');
			this._setHiddenForA11y($el, false);
		}

		// mark this run as the active animation instance for this element
		const startToken = this._markAnimStart($el);

		// Begin sound
		if (beginSound != undefined && this.course && typeof this.course.playSound === 'function') {
			try { this.course.playSound(beginSound); } catch (e) { }
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
			if (this._shouldStillPlay($el, startToken) &&
				endSound != undefined &&
				this.course &&
				typeof this.course.playSound === 'function') {
				try {
					if (beginSound != undefined &&
						this.course &&
						typeof this.course.stopSound === 'function') {
						this.course.stopSound(beginSound);
					}
				} catch (e) { }
				try { this.course.playSound(endSound); } catch (e) { }
			}

			if (chain && this._shouldStillPlay($el, startToken)) {
				this.playAnimation(chain);
			}

			// clear any guards for safety
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

				if (endSound != undefined &&
					this.course &&
					typeof this.course.playSound === 'function') {
					try {
						if (beginSound != undefined &&
							this.course &&
							typeof this.course.stopSound === 'function') {
							this.course.stopSound(beginSound);
						}
					} catch (e) { }
					try { this.course.playSound(endSound); } catch (e) { }
				}

				if (chain) {
					this.playAnimation(chain);
				}

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

		// ---- slideOut* should be from *current* position straight off-screen ----
		let tx = left;
		let ty = top;

		if (
			styles.includes('slideoutleft') ||
			styles.includes('slideoutright') ||
			styles.includes('slideouttop') ||
			styles.includes('slideoutbottom')
		) {
			const cur = this._getCurrentTranslate($el);

			// Pane geometry for off-screen distance
			const cW = $el.attr("data-animationPane") || "#courseWindow";
			const $pane = $(cW);
			const paneW = $pane.width() || 0;
			const paneH = $pane.height() || 0;

			const eW = $el.outerWidth() || 0;
			const eH = $el.outerHeight() || 0;

			if (styles.includes('slideoutleft')) {
				// move straight left horizontally; keep Y
				tx = cur.x - (paneW + eW);
				ty = cur.y;
			}
			if (styles.includes('slideoutright')) {
				// move straight right horizontally; keep Y
				tx = cur.x + (paneW + eW);
				ty = cur.y;
			}
			if (styles.includes('slideouttop')) {
				// move straight up vertically; keep X
				tx = cur.x;
				ty = cur.y - (paneH + eH);
			}
			if (styles.includes('slideoutbottom')) {
				// move straight down vertically; keep X
				tx = cur.x;
				ty = cur.y + (paneH + eH);
			}
		}

		// Apply final state (translate + optional scale)
		const transformFinal = this._composeTransform(tx, ty, scaleTarget);
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

			if (endSound != undefined &&
				this.course &&
				typeof this.course.playSound === 'function') {
				try {
					if (beginSound != undefined &&
						this.course &&
						typeof this.course.stopSound === 'function') {
						this.course.stopSound(beginSound);
					}
				} catch (e) { }
				try { this.course.playSound(endSound); } catch (e) { }
			}

			if (chain) {
				this.playAnimation(chain);
			}

			this._cancelAnim($el);
		};

		$el.one('transitionend.anim', onEnd);
	}

	// -------------------------------------------------------------------------
	// Parse data-animation as an array (or single object)
	// -------------------------------------------------------------------------
	parseAnimationJSONList($el) {
		let raw = $el.attr('data-animation');
		if (!raw) return [];

		raw = raw
			.replace(/&quot;/g, '"')
			.replace(/[“”]/g, '"')
			.replace(/[‘’]/g, "'")
			.trim();

		// Normalize semicolon-separated JSON objects to commas
		if (raw.indexOf(';') !== -1) {
			raw = raw.replace(/;\s*(?=[{\["])/g, ',');
		}

		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) return parsed;
			if (parsed && typeof parsed === 'object') return [parsed];
			return [];
		} catch (e) {
			console.error('Invalid data-animation JSON after normalization:', raw, e);
			return [];
		}
	}

	// Resolve "Foo.bar.baz" to window.Foo.bar.baz if it’s a function
	_resolveFn(path) {
		if (!path) return null;
		let ctx = window;
		const parts = String(path).split('.');
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
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
		// CSS applies right-to-left, so this means: scale, then translate
		return `translate(${x}px, ${y}px) scale(${s})`;
		}

	// Read current translateX / translateY from computed transform
	_getCurrentTranslate($el) {
		const el = $el[0];
		if (!el) return { x: 0, y: 0 };

		const style = window.getComputedStyle(el);
		const t = style.transform || style.webkitTransform || style.mozTransform;
		if (!t || t === 'none') {
			return { x: 0, y: 0 };
		}

		const match = t.match(/matrix(3d)?\((.+)\)/);
		if (!match) return { x: 0, y: 0 };

		const is3d = !!match[1];
		const vals = match[2].split(',').map(v => parseFloat(v.trim()) || 0);

		if (is3d) {
			// matrix3d: translation in indices 12, 13
			return {
				x: vals[12] || 0,
				y: vals[13] || 0
			};
		} else {
			// matrix: translation in indices 4, 5
			return {
				x: vals[4] || 0,
				y: vals[5] || 0
			};
		}
	}

	// Map per-axis anchors to a CSS transform-origin string.
	// Accepts data-horizontalAnchor: left|center|right
	// and data-verticleAnchor / data-verticalAnchor: top|center|bottom
	_readAnchor($el) {
		// Back-compat single attribute (data-anchor) if both per-axis are missing
		const legacy = String($el.data('anchor') ?? '').toLowerCase().trim();

		// Per-axis (preferred)
		let hx = String($el.data('horizontalanchor') ?? '').toLowerCase().trim();
		// Support both "verticle" and "vertical"
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

		if (opts.stopSounds) {
			const beginSound = $el.attr('data-beginSound');
			if (beginSound &&
				this.course &&
				typeof this.course.stopSound === 'function') {
				try { this.course.stopSound(beginSound); } catch (e) { }
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
