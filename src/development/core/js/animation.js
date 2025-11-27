class Animation {

    constructor(course) {
        this.course = course || null;

        // Use shared motion prefs
        this.reduceMotion = MotionPrefs.isReduced();

        // Keep in sync if the user changes OS setting
        $(document).on('motion:change', (e, isReduced) => {
        this.reduceMotion = !!isReduced;
        });
    }

    /* =========================================
       1. INITIALIZE ALL .animateMe ELEMENTS
       (run once on page load)
    ==========================================*/
    initAnimations() {

        this._setDefaults();
        this.duration = 0; // setup is instant (no tween)

        $(".animateMe").each((i, el) => {

            const $el = $(el);

            // Which pane does this element animate inside?
            const paneSel  = $el.attr("data-animationpane") || "#courseWindow";
            const $pane    = $(paneSel);
            const paneInfo = this._getWindowInfo($pane);

            // Start at animation step 0
            $el.attr("data-nextstep", 0);

            // Use this element as the current target so helpers work
            this.target = $el;

            const elInfo    = this._getElementInfo();
            const steps     = this._getAnimationStepsFromAttr();
            const firstStep = steps[0];

            // If no animation steps are defined, skip this element
            if (!firstStep) return;

            const firstType = firstStep.type || "";

            // 1) Save original "home" position (relative to inner pane area)
            const origPos = {
                x: elInfo.x - paneInfo.x,
                y: elInfo.y - paneInfo.y,
                scale: 1
                // rotation: 0  // if you ever want to store rotation too
            };
            $el.attr("data-origposition", JSON.stringify(origPos));

            // 2) Decide where the element should START
            //    (off-screen for slideIn types, home for others)
            let startX = origPos.x;
            let startY = origPos.y;

            // slideInRight: start fully left of pane border
            if (firstType.includes("slideInRight")) {
                startX = -paneInfo.padLeft - elInfo.w;
            }

            // slideInLeft: start fully right of pane border
            if (firstType.includes("slideInLeft")) {
                startX = paneInfo.w + paneInfo.padRight;
            }

            // slideInUp: start fully below pane border
            if (firstType.includes("slideInUp")) {
                startY = paneInfo.h + paneInfo.padBottom;
            }

            // slideInDown: start fully above pane border
            if (firstType.includes("slideInDown")) {
                startY = -paneInfo.padTop - elInfo.h;
            }

            // 3) Clear any manual CSS offsets so GSAP fully controls x/y
            $el.css({ left: 0, top: 0 });

            // Transform origin (for scale/rotate)
            const transOriginAttr = $el.attr("data-transformorigin") || "center";
            this.transform = this._getTransformOrigin(transOriginAttr);

            const startsHidden = firstType.includes("fadeIn");

            gsap.set($el, {
                x: startX,
                y: startY,
                scale: 1,
                rotation: 0,
                opacity: startsHidden ? 0 : 1,
                transformOrigin: this.transform
            });

            // 5) OPTIONAL: wire data-playbutton to trigger animation
            const playSel = $el.attr("data-playbutton");
            if (playSel && !$el.data("playBound")) {
                $(playSel).on("click", () => {
                    this.playAnimation($el);
                });
                $el.data("playBound", true);
            }

            // A11y: if we start fully hidden, mark as aria-hidden
            A11yUtils.setHidden($el, startsHidden);

            // Make sure element is visible in layout
            $el.css("visibility", "visible");

        });

        if (!this._pagehideBound) {
            this._pagehideBound = true;
            window.addEventListener('pagehide', () => {
            if (window.gsap) {
                gsap.killTweensOf('.animateMe');
            }
            });
        }
        
    }

    /* =========================================
       2. PLAY ANIMATION FOR A TARGET ELEMENT
    ==========================================*/
    playAnimation(target, stepIndex = null) {

        this._setDefaults();

        // Normalize to jQuery
        this.target = target instanceof jQuery ? target : $(target);

        if (!this.target.length) {
            console.warn("Animation target not found:", target);
            return;
        }

        // Which step to play?
        if (stepIndex !== null && !isNaN(stepIndex)) {
            this.currStep = stepIndex;
        } else {
            this.currStep = Number(this.target.attr("data-nextstep")) || 0;
        }

        // Load step from JSON, and auto-advance nextstep
        this.currAnimation = this._readAnimationStep(this.currStep);

        if (!this.currAnimation) {
            console.warn("No animation step found for step", this.currStep);
            return;
        }

        // Build GSAP values and run the animation
        this._createAnimationFromStep();
    }

    /* =========================================
       3. BUILD ANIMATION VALUES FOR CURRENT STEP
    ==========================================*/
    _createAnimationFromStep() {

        const orgPosStr = this.target.attr("data-origposition");
        if (!orgPosStr) {
            console.warn("No data-origposition found on target", this.target);
            return;
        }

        const orgPos = JSON.parse(orgPosStr);

        // Transform origin
        const transOriginAttr = this.target.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        // Pane info (includes padding)
        const paneSel  = this.target.attr("data-animationpane") || "#courseWindow";
        const paneInfo = this._getWindowInfo($(paneSel));

        const elInfo = this._getElementInfo();
        const type   = this.currAnimation.type || "";

        // Reset core animation values
        this.x         = 0;
        this.y         = 0;
        this.opacity   = 1;
        this.scale     = orgPos.scale;
        this.rotation  = 0;
        this.duration  = this.currAnimation.duration || 1;
        this.delay     = this.currAnimation.delay    || 0;

        // Hooks and chaining
        this.sFunction = this.currAnimation.sFunction || null;
        this.eFunction = this.currAnimation.eFunction || null;
        this.chain     = this.currAnimation.chain     || null;

        // Movement and easing
        this.moveFactor = this.currAnimation.moveFactor || 1;
        this.ease       = this.currAnimation.ease || "power1.out";

        // Start from current GSAP position
        const curPos = this._getCurrentXY();
        this.x = curPos.x;
        this.y = curPos.y;

        // Also get current rotation (for relative rotate)
        const el = this.target[0];
        const curRotation = gsap.getProperty(el, "rotation") || 0;

        // ----- SCALE -----
        if (type.includes("scale")) {
            this.scale = this.currAnimation.sAmount || 1;

            // Save new scale as home scale
            const newOrigPos = {
                x: orgPos.x,
                y: orgPos.y,
                scale: this.scale
            };
            this.target.attr("data-origposition", JSON.stringify(newOrigPos));
        }

        // ----- ROTATE -----
        if (type.includes("rotate")) {
            const rAmount = Number(this.currAnimation.rAmount) || 0;
            // Relative rotation from current
            this.rotation = curRotation + rAmount;
        } else {
            // Keep whatever rotation is currently applied if we're not rotating
            this.rotation = curRotation;
        }

        // Common values for slide/scale math
        const homeX = orgPos.x;
        const homeY = orgPos.y;
        const elemW = elInfo.w;
        const elemH = elInfo.h;

        const { ox, oy } = this._getOriginFractions();
        const scaledW = elemW * this.scale;
        const scaledH = elemH * this.scale;
        const extraW  = scaledW - elemW;
        const extraH  = scaledH - elemH;

        // Visual top-left at home, considering transform origin and scale
        const homeLeft = homeX - extraW * ox;
        const homeTop  = homeY - extraH * oy;

        // --------------------------------------
        // GOTO: Move toward another element's position
        // --------------------------------------
        if (type.includes("goto")) {

            // Must be defined per step in JSON
            const gotoSel = this.currAnimation.gotoTarget;

            if (gotoSel) {
                const $goto = $(gotoSel);

                if ($goto.length) {
                    const paneSelForGoto  = this.target.attr("data-animationpane") || "#courseWindow";
                    const paneInfoForGoto = this._getWindowInfo($(paneSelForGoto));

                    const gotoOffset = $goto.offset() || { left: 0, top: 0 };

                    const gotoX = gotoOffset.left - paneInfoForGoto.x;
                    const gotoY = gotoOffset.top  - paneInfoForGoto.y;

                    const current = this._getCurrentXY();
                    const factor  = this.moveFactor;

                    // Interpolate between current and target
                    this.x = current.x + (gotoX - current.x) * factor;
                    this.y = current.y + (gotoY - current.y) * factor;
                } else {
                    console.warn("Goto target not found:", gotoSel);
                }
            } else {
                console.warn("gotoTarget not defined in animation step for", this.target);
            }

            // fade/scale/rotate can still apply to "goto"
        }

        // --------------------------------------
        // SLIDE IN / OUT / PARTIAL (if not goto)
        // --------------------------------------
        if (!type.includes("goto")) {

            // Slide back to home for slideIn
            if (type.includes("slideInRight") || type.includes("slideInLeft")) {
                this.x = homeX;
            }

            if (type.includes("slideInUp") || type.includes("slideInDown")) {
                this.y = homeY;
            }

            // Slide OUT fully beyond pane border
            if (type.includes("slideOutRight")) {
                const targetLeft = paneInfo.w + paneInfo.padRight;
                const delta = targetLeft - homeLeft;
                this.x = homeX + delta;
            }

            if (type.includes("slideOutLeft")) {
                const targetLeft = -paneInfo.padLeft - scaledW;
                const delta = targetLeft - homeLeft;
                this.x = homeX + delta;
            }

            if (type.includes("slideOutUp")) {
                const targetTop = -paneInfo.padTop - scaledH;
                const delta = targetTop - homeTop;
                this.y = homeY + delta;
            }

            if (type.includes("slideOutDown")) {
                const targetTop = paneInfo.h + paneInfo.padBottom;
                const delta = targetTop - homeTop;
                this.y = homeY + delta;
            }

            // Partial slides inside pane using moveFactor
            if (type.includes("slideRight")) {
                const maxLeft   = paneInfo.w - scaledW;
                const remaining = maxLeft - homeLeft;
                this.x = homeX + remaining * this.moveFactor;
            }

            if (type.includes("slideLeft")) {
                const minLeft   = 0;
                const remaining = homeLeft - minLeft;
                this.x = homeX - remaining * this.moveFactor;
            }

            if (type.includes("slideDown")) {
                const maxTop    = paneInfo.h - scaledH;
                const remaining = maxTop - homeTop;
                this.y = homeY + remaining * this.moveFactor;
            }

            if (type.includes("slideUp")) {
                const minTop    = 0;
                const remaining = homeTop - minTop;
                this.y = homeY - remaining * this.moveFactor;
            }
        }

        // ----- FADING -----
        if (type.includes("fadeOut")) {
            this.opacity = 0;
        }

        if (type.includes("fadeIn")) {
            this.target.css("opacity", 0);
            this.opacity = 1;
        }

        // Finally, run the GSAP tween
        this.animate();
    }

    /* =========================================
       4. RUN GSAP ANIMATION
    ==========================================*/
    animate() {

        const $target = this.target instanceof jQuery ? this.target : $(this.target);

        // If user prefers reduced motion, jump straight to final state
        if (this.reduceMotion) {

            // A11y: if final opacity is 0, hide; else show
            const isHidden = (this.opacity <= 0);
            A11yUtils.setHidden($target, isHidden);

            // START hook
            this.onStart();

            // Instantly set final transform & opacity
            gsap.set(this.target, {
            x: this.x,
            y: this.y,
            opacity: this.opacity,
            scale: this.scale,
            rotation: this.rotation,
            transformOrigin: this.transform
            });

            // COMPLETE hook
            this.onComplete();

            return; // IMPORTANT: skip the animated tween below
        }

        // Normal animated path
        gsap.to(this.target, {
            x: this.x,
            y: this.y,
            opacity: this.opacity,
            scale: this.scale,
            rotation: this.rotation,
            transformOrigin: this.transform,
            duration: this.duration,
            delay: this.delay,
            ease: this.ease,
            onStart: () => {
            this.onStart();
            },
            onComplete: () => {
            const isHidden = (this.opacity <= 0);
            A11yUtils.setHidden($target, isHidden);
            this.onComplete();
            }
        });
        }


    onStart() {
        if (this.sFunction) {
            this._callHookIfExists(this.sFunction);
        }
    }

    onComplete() {
        if (this.eFunction) {
            this._callHookIfExists(this.eFunction);
        }

        // Auto-chain to another element if requested
        if (this.chain) {
            this.playAnimation(this.chain);
        }
    }

    /* Simple global controls */
    pauseAll() {
        gsap.globalTimeline.pause();
    }

    resumeAll() {
        gsap.globalTimeline.resume();
    }

    /* Reset element back to original saved position/scale/rotation */
    resetToOrigin(target) {

        this.target = target instanceof jQuery ? target : $(target);
        if (!this.target.length) return;

        const orgPosStr = this.target.attr("data-origposition");
        if (!orgPosStr) return;

        const orgPos = JSON.parse(orgPosStr);

        this._setDefaults();

        this.x        = orgPos.x;
        this.y        = orgPos.y;
        this.scale    = orgPos.scale;
        this.opacity  = 1;
        this.rotation = 0;

        const transOriginAttr = this.target.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        gsap.set(this.target, {
            x: this.x,
            y: this.y,
            scale: this.scale,
            opacity: this.opacity,
            rotation: this.rotation,
            transformOrigin: this.transform
        });
    }

    /* =========================================
       5. HELPERS: ELEMENT & WINDOW INFO
    ==========================================*/
    _getElementInfo() {
        return {
            w: this.target.outerWidth()  || 0,
            h: this.target.outerHeight() || 0,
            x: this.target.offset().left,
            y: this.target.offset().top
        };
    }

    _getWindowInfo($pane) {
        const off = $pane.offset() || { left: 0, top: 0 };

        const padLeft   = parseFloat($pane.css("padding-left"))   || 0;
        const padTop    = parseFloat($pane.css("padding-top"))    || 0;
        const padRight  = parseFloat($pane.css("padding-right"))  || 0;
        const padBottom = parseFloat($pane.css("padding-bottom")) || 0;

        const innerW = ($pane.innerWidth()  || 0) - padLeft - padRight;
        const innerH = ($pane.innerHeight() || 0) - padTop  - padBottom;

        return {
            x: off.left + padLeft,
            y: off.top  + padTop,
            w: innerW,
            h: innerH,
            padLeft,
            padRight,
            padTop,
            padBottom
        };
    }

    /* =========================================
       6. JSON STEPS & STEP INDEX
    ==========================================*/
    _readAnimationStep(stepIndex) {

        const steps = this._getAnimationStepsFromAttr();

        if (!Array.isArray(steps) || steps.length === 0) {
            return null;
        }

        this._setNextStep(stepIndex, steps.length);

        return steps[stepIndex] || null;
    }

    _getAnimationStepsFromAttr() {

        const json = this.target.attr("data-animation");
        if (!json) return [];

        try {
            return JSON.parse(json);
        } catch (e) {
            console.warn("Invalid animation JSON:", e, json);
            return [];
        }
    }

    _setNextStep(currentStep, totalSteps) {

        let next = currentStep + 1;
        if (next >= totalSteps) {
            next = 0;
        }

        this.target.attr("data-nextstep", next);
    }

    /* =========================================
       7. TRANSFORM ORIGIN & LOW-LEVEL HELPERS
    ==========================================*/
    _getTransformOrigin(anchor) {

        if (!anchor) return "50% 50%";

        const map = {
            "top-left":      "0% 0%",
            "top-center":    "50% 0%",
            "top":           "50% 0%",
            "top-right":     "100% 0%",
            "center-left":   "0% 50%",
            "left":          "0% 50%",
            "center-right":  "100% 50%",
            "right":         "100% 50%",
            "bottom-left":   "0% 100%",
            "bottom-center": "50% 100%",
            "bottom":        "50% 100%",
            "bottom-right":  "100% 100%",
            "center":        "50% 50%"
        };

        const key = anchor.toLowerCase();
        return map[key] || "50% 50%";
    }

    _setDefaults() {
        this.x         = 0;
        this.y         = 0;
        this.scale     = 1;
        this.anchor    = "center";
        this.duration  = 1;
        this.delay     = 0;
        this.sFunction = null;
        this.eFunction = null;
        this.chain     = null;
        this.opacity   = 1;
        this.transform = this._getTransformOrigin(this.anchor);
        this.moveFactor = 1;
        this.ease       = "power1.out";
        this.rotation   = 0;
    }

    _getCurrentXY() {
        const el = this.target && this.target[0];
        if (!el) return { x: 0, y: 0 };

        return {
            x: gsap.getProperty(el, "x") || 0,
            y: gsap.getProperty(el, "y") || 0
        };
    }

    _callHookIfExists(fnName) {
        const fn = (typeof window !== 'undefined') ? window[fnName] : undefined;
        if (typeof fn === 'function') {
            try {
                fn();
            } catch (e) {
                console.error('Error in ' + fnName + '()', e);
            }
        }
    }

    _getOriginFractions() {
        // this.transform is like "50% 50%" or "0% 0%"
        const t = (this.transform || "50% 50%").split(" ");

        const parse = (val, fallback) => {
            if (!val) return fallback;

            if (val.indexOf("%") !== -1) {
                const n = parseFloat(val);
                return isNaN(n) ? fallback : n / 100;
            }

            const v = val.toLowerCase();
            if (v === "left" || v === "top")    return 0;
            if (v === "center")                 return 0.5;
            if (v === "right" || v === "bottom")return 1;

            const n = parseFloat(val);
            return isNaN(n) ? fallback : n / 100;
        };

        const ox = parse(t[0], 0.5);
        const oy = parse(t[1], 0.5);

        return { ox, oy };
    }
}
