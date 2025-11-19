class Animation {

    constructor(course, pageInfo) {
        this.course = course;
        this.pageInfo = pageInfo;
    }

    /* =========================================
       1. INITIALIZE ALL .animateMe ELEMENTS
    ==========================================*/
    initAnimations() {

        this._setDefaults();
        this.duration = 0; // initialization animations are instant

        // Loop through every element that can be animated
        $(".animateMe").each((i, el) => {

            const $el = $(el);

            // Which container are we using as the animation pane?
            const paneSel = $el.attr("data-animationpane") || "#courseWindow";
            const paneInfo = this._getWindowInfo($(paneSel));

            // Start at step 0
            $el.attr("data-nextstep", 0);

            // Temporarily set this.target so helpers work
            this.target = $el;

            const elInfo = this._getElementInfo();
            const steps = this._getAnimationStepsFromAttr();
            const firstStep = steps[0];

            if (!firstStep) return; // no animation defined, skip

            // Pre-position based on first step type
            if (firstStep.type.includes("slideInLeft")) {
                this.x = paneInfo.w - (elInfo.x - paneInfo.x);
            }

            if (firstStep.type.includes("slideInRight")) {
                this.x = paneInfo.x - (elInfo.x + elInfo.w);
            }

            if (
                firstStep.type.includes("slideOutRight") ||
                firstStep.type.includes("slideOutLeft") ||
                firstStep.type.includes("slideLeft") ||
                firstStep.type.includes("slideRight")
            ) {
                this.x = 0;
            }

            if (
                firstStep.type.includes("slideOutUp") ||
                firstStep.type.includes("slideOutDown") ||
                firstStep.type.includes("slideUp") ||
                firstStep.type.includes("slideDown")
            ) {
                this.y = 0;
            }

            if (firstStep.type.includes("slideInUp")) {
                this.y = paneInfo.h;
            }

            if (firstStep.type.includes("slideInDown")) {
                this.y = paneInfo.y - (elInfo.y + elInfo.h);
            }

            if (firstStep.type.includes("fadeIn")) {
                this.opacity = 0;
            }

            // Save original position and scale in data-origposition as JSON
            const origPos = {
                x: elInfo.x - paneInfo.x,
                y: elInfo.y - paneInfo.y,
                scale: 1
            };
            $el.attr("data-origposition", JSON.stringify(origPos));

            this.animate();
        });
    }

    /* =========================================
       2. PLAY ANIMATION FOR A GIVEN TARGET
    ==========================================*/
    // target: selector, DOM element, or jQuery object
    playAnimation(target, stepIndex = null) {

        this._setDefaults();

        // Normalize to jQuery object
        this.target = target instanceof jQuery ? target : $(target);

        if (!this.target.length) {
            console.warn("Animation target not found:", target);
            return;
        }

        // Read current step from data-nextstep (default to 0)
        if (stepIndex !== null && !isNaN(stepIndex)) {
            this.currStep = stepIndex;
        } else {
            this.currStep = Number(this.target.attr("data-nextstep")) || 0;
        }

        // Load the animation step from JSON and update next step
        this.currAnimation = this._readAnimationStep(this.currStep);

        if (!this.currAnimation) {
            console.warn("No animation step found for step", this.currStep);
            return;
        }

        this._createAnimationFromStep();
    }

    /* =========================================
       3. BUILD ANIMATION VALUES FROM STEP
    ==========================================*/
    _createAnimationFromStep() {

        const orgPos = JSON.parse(this.target.attr("data-origposition"));

        const transOriginAttr = this.target.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        // Use the same pane logic as init: per-element or default
        const paneSel = this.target.attr("data-animationpane") || "#courseWindow";
        const paneInfo = this._getWindowInfo($(paneSel));

        const elInfo = this._getElementInfo();
        const type = this.currAnimation.type || "";

        // --- Defaults each time so nothing "sticks" accidentally ---
        this.x        = 0;
        this.y        = 0;
        this.opacity  = 1;
        this.scale    = orgPos.scale;
        this.duration = this.currAnimation.duration || 1;
        this.delay    = this.currAnimation.delay    || 0;

        // Optional hooks & chaining
        this.sFunction = this.currAnimation.sFunction || null;
        this.eFunction = this.currAnimation.eFunction || null;
        this.chain     = this.currAnimation.chain     || null;

        // Start from current GSAP translate position
        const p = this._getCurrentXY();
        this.x = p.x;
        this.y = p.y;

        // --- POSITION LOGIC ---

        // Scale
        if (type.includes("scale")) {
            this.scale = this.currAnimation.sAmount || 1;

            const newOrigPos = {
                x: orgPos.x,
                y: orgPos.y,
                scale: this.scale
            };
            this.target.attr("data-origposition", JSON.stringify(newOrigPos));
        }

        // Horizontal movement
        if (type.includes("slideInRight") || type.includes("slideInLeft")) {
            this.x = 0;
        }

        if (type.includes("slideOutRight")) {
            this.x = paneInfo.w - orgPos.x;
        }

        if (type.includes("slideOutLeft")) {
            this.x = 0 - (orgPos.x + elInfo.w);
        }

        if (type.includes("slideRight")) {
            const sF = (elInfo.w * this.scale) - elInfo.w;
            this.x = (paneInfo.w - ((elInfo.x - paneInfo.x) + elInfo.w)) - sF;
        }

        if (type.includes("slideLeft")) {
            this.x = 0 - orgPos.x;
        }

        // Vertical movement
        if (type.includes("slideInUp") || type.includes("slideInDown")) {
            this.y = 0;
        }

        if (type.includes("slideOutUp")) {
            this.y = orgPos.y - elInfo.h;
        }

        if (type.includes("slideOutDown")) {
            this.y = paneInfo.h - orgPos.y;
        }

        if (type.includes("slideUp")) {
            this.y = 0;
        }

        if (type.includes("slideDown")) {
            const sF = (elInfo.h * this.scale) - elInfo.h;
            this.y = (paneInfo.h - elInfo.h) - sF;
        }

        // --- OPACITY LOGIC ---
        if (type.includes("fadeOut")) {
            this.opacity = 0;
        }

        if (type.includes("fadeIn")) {
            this.target.css("opacity", 0);
            this.opacity = 1;
        }

        this.animate();
    }

    /* =========================================
       4. RUN GSAP ANIMATION
    ==========================================*/
    animate() {

        gsap.to(this.target, {
            x: this.x,
            y: this.y,
            opacity: this.opacity,
            scale: this.scale,
            transformOrigin: this.transform,
            duration: this.duration,
            delay: this.delay,
            onStart: () => {
                console.log("Animation started");
                this.onStart();
            },
            onComplete: () => {
                console.log("Animation ended");
                this.onComplete();
            }
        });
    }

    onStart() {
        console.log("--- onStart Called");

        if (this.sFunction) {
            this._callHookIfExists(this.sFunction);
        }
    }

    onComplete() {
        console.log("--- onEnd Called");

        if (this.eFunction) {
            this._callHookIfExists(this.eFunction);
        }

        if (this.chain) {
            this.playAnimation(this.chain);
        }
    }

    /* =========================================
       5. HELPERS: ELEMENT & WINDOW INFO
    ==========================================*/
    _getElementInfo() {
        return {
            w: this.target.outerWidth() || 0,
            h: this.target.outerHeight() || 0,
            x: this.target.offset().left,
            y: this.target.offset().top
        };
    }

    _getWindowInfo($pane) {
        return {
            w: $pane.width() || 0,
            h: $pane.height() || 0,
            x: $pane.offset().left,
            y: $pane.offset().top
        };
    }

    /* =========================================
       6. HELPERS: JSON STEPS & STEP INDEX
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
       7. TRANSFORM ORIGIN HELPER
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
        this.x        = 0;
        this.y        = 0;
        this.scale    = 1;
        this.anchor   = "center";
        this.duration = 1;
        this.delay    = 0;
        this.sFunction = null;
        this.eFunction = null;
        this.chain     = null;
        this.opacity   = 1;
        this.transform = this._getTransformOrigin(this.anchor);
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
}
