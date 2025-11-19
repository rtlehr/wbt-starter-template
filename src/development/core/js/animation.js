class Animation {

    constructor(course, pageInfo) {
        // Store references passed into the class (not used much yet)
        this.course = course;
        this.pageInfo = pageInfo;
    }

    /* =========================================
       1. INITIALIZE ALL .animateMe ELEMENTS
       This runs ONCE when the page loads.
       It prepares each element for animations later.
    ==========================================*/
    initAnimations() {

        this._setDefaults();
        this.duration = 0; // Run setup instantly with no animation

        // Go through every element that has class "animateMe"
        $(".animateMe").each((i, el) => {

            const $el = $(el);

            // The container the element will animate inside
            const paneSel = $el.attr("data-animationpane") || "#courseWindow";
            const paneInfo = this._getWindowInfo($(paneSel));

            // This element will start at animation step 0
            $el.attr("data-nextstep", 0);

            // Make this element the active target for helper methods
            this.target = $el;

            const elInfo   = this._getElementInfo();
            const steps    = this._getAnimationStepsFromAttr();
            const firstStep = steps[0];

            // If no animation steps are defined, skip it
            if (!firstStep) return;

            // Save original position (relative to pane) and scale
            const origPos = {
                x: elInfo.x - paneInfo.x,
                y: elInfo.y - paneInfo.y,
                scale: 1
            };
            $el.attr("data-origposition", JSON.stringify(origPos));

            // Normalize: let GSAP control position from now on

            // 1) Clear any manual top/left offsets so CSS doesn't fight GSAP
            $el.css({ left: 0, top: 0 });

            // 2) Set GSAP x/y to match the original visual position
            //    Respect the element's transform origin if provided
            const transOriginAttr = $el.attr("data-transformorigin") || "center";
            this.transform = this._getTransformOrigin(transOriginAttr);

            gsap.set($el, {
                x: origPos.x,
                y: origPos.y,
                scale: 1,
                opacity: 1,
                transformOrigin: this.transform
            });
        });
    }

    /* =========================================
       2. PLAY ANIMATION FOR A GIVEN TARGET ELEMENT
       This is called when you want something to animate.
    ==========================================*/
    playAnimation(target, stepIndex = null) {

        this._setDefaults();

        // Make sure the target is a jQuery object
        this.target = target instanceof jQuery ? target : $(target);

        if (!this.target.length) {
            console.warn("Animation target not found:", target);
            return;
        }

        // Determine which step to play next
        if (stepIndex !== null && !isNaN(stepIndex)) {
            this.currStep = stepIndex;
        } else {
            this.currStep = Number(this.target.attr("data-nextstep")) || 0;
        }

        // Load the animation step from the element's JSON list
        this.currAnimation = this._readAnimationStep(this.currStep);

        if (!this.currAnimation) {
            console.warn("No animation step found:", this.currStep);
            return;
        }

        // Build the animation settings and run it
        this._createAnimationFromStep();
    }

    /* =========================================
       3. BUILD ANIMATION VALUES FOR THE CURRENT STEP
       This sets up X, Y, opacity, scale, etc.
    ==========================================*/
    _createAnimationFromStep() {

        const orgPos = JSON.parse(this.target.attr("data-origposition"));

        // Where the element should scale from (center, top-left, etc.)
        const transOriginAttr = this.target.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        // Figure out which container this element animates inside
        const paneSel = this.target.attr("data-animationpane") || "#courseWindow";
        const paneInfo = this._getWindowInfo($(paneSel));

        const elInfo = this._getElementInfo();
        const type   = this.currAnimation.type || "";

        // Reset basic animation settings so nothing carries over
        this.x        = 0;
        this.y        = 0;
        this.opacity  = 1;
        this.scale    = orgPos.scale;
        this.duration = this.currAnimation.duration || 1;
        this.delay    = this.currAnimation.delay    || 0;

        // User-defined functions and chaining (optional)
        this.sFunction = this.currAnimation.sFunction || null;
        this.eFunction = this.currAnimation.eFunction || null;
        this.chain     = this.currAnimation.chain     || null;

        // How much of the movement to apply (1 = full, 0.5 = half)
        this.moveFactor = this.currAnimation.moveFactor || 1;

        // GSAP easing to use
        this.ease = this.currAnimation.ease || "power1.out";

        // Start from wherever GSAP last placed the element
        const p = this._getCurrentXY();
        this.x = p.x;
        this.y = p.y;

        /* -----------------------------
           MOVEMENT TYPE LOGIC
           Each "slide" or "fade" effect
           adjusts X/Y or opacity differently.
        ------------------------------*/

        // 1) Scale
        if (type.includes("scale")) {
            this.scale = this.currAnimation.sAmount || 1;

            // Save new scale as the "home" scale for future animations
            const newOrigPos = {
                x: orgPos.x,
                y: orgPos.y,
                scale: this.scale
            };
            this.target.attr("data-origposition", JSON.stringify(newOrigPos));
        }

        // Short names for readability
        const homeX = orgPos.x; // "home" GSAP x
        const homeY = orgPos.y; // "home" GSAP y
        const elemW = elInfo.w;
        const elemH = elInfo.h;

        // Get transform-origin as fractions (0..1)
        const { ox, oy } = this._getOriginFractions();

        // Scaled size
        const scaledW = elemW * this.scale;
        const scaledH = elemH * this.scale;

        // Extra size added by scaling
        const extraW = scaledW - elemW;
        const extraH = scaledH - elemH;

        // Visual home left/top with current scale + origin
        // The origin sits inside the element, so scaling shifts the edges.
        const homeLeft = homeX - extraW * ox;
        const homeTop  = homeY - extraH * oy;

        // ------------------------
        // 2) "Slide in" back to home
        // ------------------------
        if (type.includes("slideInRight") || type.includes("slideInLeft")) {
            this.x = homeX;  // back to home origin
        }

        if (type.includes("slideInUp") || type.includes("slideInDown")) {
            this.y = homeY;  // back to home origin
        }

        // ------------------------
        // 3) "Slide out" completely off-pane
        // ------------------------

        // Off to the right (right edge just past pane right)
        if (type.includes("slideOutRight")) {
            const targetLeft = paneInfo.w;     // left just at pane right edge
            const delta = targetLeft - homeLeft;
            this.x = homeX + delta;
        }

        // Off to the left (left edge fully off-screen)
        if (type.includes("slideOutLeft")) {
            const targetLeft = -scaledW;       // fully off the left side
            const delta = targetLeft - homeLeft;
            this.x = homeX + delta;
        }

        // Off the top
        if (type.includes("slideOutUp")) {
            const targetTop = -scaledH;
            const delta = targetTop - homeTop;
            this.y = homeY + delta;
        }

        // Off the bottom
        if (type.includes("slideOutDown")) {
            const targetTop = paneInfo.h;
            const delta = targetTop - homeTop;
            this.y = homeY + delta;
        }

        // ------------------------
        // 4) Partial slides using moveFactor (0..1)
        //     - Slide *towards* pane edges but stay inside
        // ------------------------

        // Slide right: move from home towards far-right inside pane
        if (type.includes("slideRight")) {
            const maxLeft   = paneInfo.w - scaledW;    // rightmost left where fully visible
            const remaining = maxLeft - homeLeft;      // how far from home to max
            this.x = homeX + remaining * this.moveFactor;
        }

        // Slide left: move from home towards left edge (0)
        if (type.includes("slideLeft")) {
            const minLeft   = 0;
            const remaining = homeLeft - minLeft;
            this.x = homeX - remaining * this.moveFactor;
        }

        // Slide down: home towards bottom inside pane
        if (type.includes("slideDown")) {
            const maxTop    = paneInfo.h - scaledH;
            const remaining = maxTop - homeTop;
            this.y = homeY + remaining * this.moveFactor;
        }

        // Slide up: home towards top (0)
        if (type.includes("slideUp")) {
            const minTop    = 0;
            const remaining = homeTop - minTop;
            this.y = homeY - remaining * this.moveFactor;
        }

        // Fading
        if (type.includes("fadeOut")) {
            this.opacity = 0;
        }

        if (type.includes("fadeIn")) {
            this.target.css("opacity", 0);
            this.opacity = 1;
        }

        // Now run the GSAP animation
        this.animate();
    }

    /* =========================================
       4. RUN GSAP ANIMATION
       This actually moves/scales/fades the element.
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
            ease: this.ease,
            onStart: () => {
                this.onStart();  // Run start hooks
            },
            onComplete: () => {
                this.onComplete(); // Run end hooks
            }
        });
    }

    onStart() {
        // If developer wants a custom function to run here, call it
        if (this.sFunction) {
            this._callHookIfExists(this.sFunction);
        }
    }

    onComplete() {

        // Run custom "after animation" logic if provided
        if (this.eFunction) {
            this._callHookIfExists(this.eFunction);
        }

        // Automatically run the next animation if "chain" is set
        if (this.chain) {
            this.playAnimation(this.chain);
        }
    }

    /* Simple pause/resume helpers */
    pauseAll() {
        gsap.globalTimeline.pause();
    }

    resumeAll() {
        gsap.globalTimeline.resume();
    }

    /* Reset element back to the original saved location */
    resetToOrigin(target) {

        this.target = target instanceof jQuery ? target : $(target);
        if (!this.target.length) return;

        const orgPosStr = this.target.attr("data-origposition");
        if (!orgPosStr) return;

        const orgPos = JSON.parse(orgPosStr);

        this._setDefaults();

        this.x       = orgPos.x;
        this.y       = orgPos.y;
        this.scale   = orgPos.scale;
        this.opacity = 1;

        // Respect the element's transform origin here as well
        const transOriginAttr = this.target.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        // Instantly set the element back to its original values
        gsap.set(this.target, {
            x: this.x,
            y: this.y,
            scale: this.scale,
            opacity: this.opacity,
            transformOrigin: this.transform
        });
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
            w: $pane.width()  || 0,
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

        // Update the element so next time it runs stepIndex+1
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

        // Loop back to 0 after the last animation step
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

    /* Reset default values before building each animation */
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
        this.moveFactor = 1;
    }

    /* Get current GSAP x/y transform values */
    _getCurrentXY() {
        const el = this.target && this.target[0];
        if (!el) return { x: 0, y: 0 };

        return {
            x: gsap.getProperty(el, "x") || 0,
            y: gsap.getProperty(el, "y") || 0
        };
    }

    /* Try to call a named function on window[] safely */
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

    /* Convert transformOrigin ("50% 50%") into fractions (0..1, 0..1) */
    _getOriginFractions() {
        // this.transform is like "50% 50%" or "0% 0%"
        const t = (this.transform || "50% 50%").split(" ");

        const parse = (val, fallback) => {
            if (!val) return fallback;

            // Handle percentages like "50%"
            if (val.indexOf("%") !== -1) {
                const n = parseFloat(val);
                return isNaN(n) ? fallback : n / 100;
            }

            // Fallback keywords (should not occur because we map them already)
            const v = val.toLowerCase();
            if (v === "left" || v === "top") return 0;
            if (v === "center") return 0.5;
            if (v === "right" || v === "bottom") return 1;

            const n = parseFloat(val);
            return isNaN(n) ? fallback : n / 100;
        };

        const ox = parse(t[0], 0.5); // horizontal origin (0..1)
        const oy = parse(t[1], 0.5); // vertical origin (0..1)

        return { ox, oy };
    }
}
