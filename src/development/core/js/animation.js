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
    this.duration = 0; // setup is instant

    // Go through every element that has class "animateMe"
    $(".animateMe").each((i, el) => {

        const $el = $(el);

        // The container the element will animate inside
        const paneSel  = $el.attr("data-animationpane") || "#courseWindow";
        const $pane    = $(paneSel);
        const paneInfo = this._getWindowInfo($pane);

        // This element will start at animation step 0
        $el.attr("data-nextstep", 0);

        // Make this element the active target for helper methods
        this.target = $el;

        const elInfo    = this._getElementInfo();  // current rendered position
        const steps     = this._getAnimationStepsFromAttr();
        const firstStep = steps[0];

        // If no animation steps are defined, skip it
        if (!firstStep) return;

        const firstType = firstStep.type || "";

        // 1) Save original "home" position (relative to inner pane area)
        //    This is where the element should be when it's "at rest".
        const origPos = {
            x: elInfo.x - paneInfo.x,
            y: elInfo.y - paneInfo.y,
            scale: 1
        };
        $el.attr("data-origposition", JSON.stringify(origPos));

        // 2) Decide where the element should START
        //    (off-screen for slideIn types, or at home for everything else)
        let startX = origPos.x;
        let startY = origPos.y;

        // We are in a coordinate system where:
        //   inner-left  = 0
        //   inner-right = paneInfo.w
        //   border-left = -paneInfo.padLeft
        //   border-right= paneInfo.w + paneInfo.padRight
        //   inner-top   = 0
        //   inner-bottom= paneInfo.h
        //   border-top  = -paneInfo.padTop
        //   border-bot  = paneInfo.h + paneInfo.padBottom

        // slideInRight:
        //   Start completely to the LEFT of the pane border,
        //   so the element is not visible at all.
        if (firstType.includes("slideInRight")) {
            // right edge <= border-left
            // x + elInfo.w <= -padLeft  =>  x <= -padLeft - elInfo.w
            startX = -paneInfo.padLeft - elInfo.w;
        }

        // slideInLeft:
        //   Start completely to the RIGHT of the pane border.
        if (firstType.includes("slideInLeft")) {
            // left edge >= border-right
            // x >= paneInfo.w + padRight
            startX = paneInfo.w + paneInfo.padRight;
        }

        // slideInUp:
        //   Start completely BELOW the pane border.
        if (firstType.includes("slideInUp")) {
            // top >= border-bottom
            // y >= paneInfo.h + padBottom
            startY = paneInfo.h + paneInfo.padBottom;
        }

        // slideInDown:
        //   Start completely ABOVE the pane border.
        if (firstType.includes("slideInDown")) {
            // bottom <= border-top
            // y + elInfo.h <= -padTop  =>  y <= -padTop - elInfo.h
            startY = -paneInfo.padTop - elInfo.h;
        }

        // 3) Normalize: let GSAP control position from now on

        // Clear any manual top/left so CSS doesn't fight GSAP
        $el.css({ left: 0, top: 0 });

        // Respect the element's transform origin if provided
        const transOriginAttr = $el.attr("data-transformorigin") || "center";
        this.transform = this._getTransformOrigin(transOriginAttr);

        // 4) Instantly put the element at its start position (no tween)
        gsap.set($el, {
            x: startX,
            y: startY,
            scale: 1,
            opacity: firstType.includes("fadeIn") ? 0 : 1,
            transformOrigin: this.transform
        });

        $el.css("visibility", "visible");

        // After gsap.set(...)
        const buttonSel = $el.attr("data-playbutton");
        if (buttonSel) {
            // Use a closure so each button triggers its own element
            $(buttonSel).on("click", () => {
                this.playAnimation($el);
            });
        }

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
        // 3) "Slide out" completely outside the pane border
        // ------------------------

        // slideOutRight: move so the element's LEFT edge is past the RIGHT border
        if (type.includes("slideOutRight")) {
            // border-right = paneInfo.w + paneInfo.padRight
            const targetLeft = paneInfo.w + paneInfo.padRight;
            const delta = targetLeft - homeLeft;
            this.x = homeX + delta;
        }

        // slideOutLeft: move so the element's RIGHT edge is past the LEFT border
        if (type.includes("slideOutLeft")) {
            // border-left = -paneInfo.padLeft
            // right edge <= border-left → left <= -padLeft - scaledW
            const targetLeft = -paneInfo.padLeft - scaledW;
            const delta = targetLeft - homeLeft;
            this.x = homeX + delta;
        }

        // slideOutUp: move so the element's BOTTOM edge is past the TOP border
        if (type.includes("slideOutUp")) {
            // border-top = -paneInfo.padTop
            // bottom <= border-top → top <= -padTop - scaledH
            const targetTop = -paneInfo.padTop - scaledH;
            const delta = targetTop - homeTop;
            this.y = homeY + delta;
        }

        // slideOutDown: move so the element's TOP edge is past the BOTTOM border
        if (type.includes("slideOutDown")) {
            // border-bottom = paneInfo.h + paneInfo.padBottom
            const targetTop = paneInfo.h + paneInfo.padBottom;
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
    // Outer position of the pane (border box)
    const off = $pane.offset() || { left: 0, top: 0 };

    // Padding values
    const padLeft   = parseFloat($pane.css("padding-left"))   || 0;
    const padTop    = parseFloat($pane.css("padding-top"))    || 0;
    const padRight  = parseFloat($pane.css("padding-right"))  || 0;
    const padBottom = parseFloat($pane.css("padding-bottom")) || 0;

    // Inner content area (inside padding)
    const innerW = ($pane.innerWidth()  || 0) - padLeft - padRight;
    const innerH = ($pane.innerHeight() || 0) - padTop  - padBottom;

    return {
        // Top-left corner of the *inner* content area
        x: off.left + padLeft,
        y: off.top  + padTop,

        // Usable width/height (inside padding)
        w: innerW,
        h: innerH,

        // Raw padding (for off-screen slideIn positions)
        padLeft,
        padRight,
        padTop,
        padBottom
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
