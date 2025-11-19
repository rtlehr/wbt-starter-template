class Animation {

    constructor(course, pageInfo) {
        this.course = course;
        this.pageInfo = pageInfo;
    }

    /* =========================================
       1. INITIALIZE ALL .animateMe ELEMENTS
    ==========================================*/
    initAnimations() {
        console.log("--- initAnimations ---");

        this._setDefaults();

        this.duration = 0;

        const $pane = $("#animParent");
        //const paneInfo = this._getWindowInfo($pane);

        //this.paneSel = $el.attr("data-animationPane") || "#courseWindow";   
        
        // Loop through every element that can be animated
        $(".animateMe").each((i, el) => {

            const $el = $(el);

            const $pane = $el.attr("data-animationpane") || "#courseWindow"; 
            const paneInfo = this._getWindowInfo($($pane));

            // Start at step 0
            $el.attr("data-nextstep", 0);

            // Temporarily set this.target so helpers work
            this.target = $el;

            const elInfo = this._getElementInfo();
            const steps = this._getAnimationStepsFromAttr();
            const firstStep = steps[0];

            if (!firstStep) return; // no animation defined, skip

            // Example: pre-position slideInRight elements off-screen to the right
            if (firstStep.type.includes("slideInLeft")) {
                this.x = paneInfo.w - (elInfo.x - paneInfo.x);
            }

            if (firstStep.type.includes("slideInRight")) {
                this.x = paneInfo.x - (elInfo.x + elInfo.w);
            }

            if (firstStep.type.includes("slideOutRight") || 
                firstStep.type.includes("slideOutLeft") || 
                firstStep.type.includes("slideLeft") || 
                firstStep.type.includes("slideRight")) 
            {
                this.x = 0;
            }
            
            if (firstStep.type.includes("slideOutUp") || 
                firstStep.type.includes("slideOutDown") || 
                firstStep.type.includes("slideUp") || 
                firstStep.type.includes("slideDown")) 
            {
                this.y = 0;
            }

            if (firstStep.type.includes("slideInUp")) {
                this.y = paneInfo.h;
            }

            if (firstStep.type.includes("slideInDown")) {
                this.y = paneInfo.y - (elInfo.y + elInfo.h);
            }

            // Example: pre-position slideInRight elements off-screen to the right
            if (firstStep.type.includes("fadeIn")) {
                this.opacity = 0;
            }

            $el.attr("data-origposition", '{"x":' + (elInfo.x - paneInfo.x) + ', "y":' + (elInfo.y - paneInfo.y) + ', "scale": 1}');

            this.animate();

        });
    }

    /* =========================================
       2. PLAY ANIMATION FOR A GIVEN TARGET
    ==========================================*/
    // target: selector, DOM element, or jQuery object
    // options: overrides like { y, scale, anchor, duration, delay, onStart, onComplete }
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

        const scaleFactor = 1 / Number(orgPos.scale);

        console.log("scaleFactor: " + scaleFactor);

        const transOrgin = this.target.attr("data-transformorigin") || "center";

        this.transform = this._getTransformOrigin(transOrgin);

        console.log("orgPos: " + orgPos.x);

        const $pane = $("#animParent");
        const elInfo = this._getElementInfo();

        console.log("elInfo.w: " + elInfo.w);

        const paneInfo = this._getWindowInfo($pane);
        const type = this.currAnimation.type || "";

        // --- Defaults each time so nothing "sticks" accidentally ---
        this.x = 0;
        this.y = 0;
        this.opacity = 1;
        this.scale = orgPos.scale;
        this.duration = this.currAnimation.duration || 1;
        this.delay = this.currAnimation.delay || 0;

        let p = this._getCurrentXY();
        this.y = p.y;
        this.x = p.x;

        // --- POSITION LOGIC ---
        if (type.includes("scale")) {

            this.scale = this.currAnimation.sAmount || 1;

            this.target.attr("data-origposition", '{"x":' + orgPos.x + ', "y":' + orgPos.y + ', "scale": ' + this.scale + '}');

        }

        if (type.includes("slideInRight") || type.includes("slideInLeft")) {
            // Move back to normal position
            this.x = 0;
        }

        if (type.includes("slideOutRight")) {
            // Move out to the right, based on pane and element position
            this.x = paneInfo.w - (orgPos.x);
        }

        if (type.includes("slideOutLeft")) 
        {
           this.x = 0 - (orgPos.x + elInfo.w);
        }

        if (type.includes("slideRight")) {

            const sF = (elInfo.w * this.scale) - elInfo.w;

            console.log("sF: " + sF);
            this.x = (paneInfo.w - ((elInfo.x - paneInfo.x) + elInfo.w)) - sF;

        }

        if (type.includes("slideLeft")) 
        {

            this.x = 0 - orgPos.x;

        }

        if (type.includes("slideInUp")|| type.includes("slideInDown")) {
            
            this.y = 0;

        }

        if (type.includes("slideOutUp")) 
        {
           this.y = orgPos.y - elInfo.h;
        }

        if (type.includes("slideOutDown")) 
        {
           this.y = paneInfo.h - orgPos.y;
        }

        if (type.includes("slideUp")) 
        {

           this.y = 0;

        }

        if (type.includes("slideDown")) 
        {

            const sF = (elInfo.h * this.scale) - elInfo.h;

            console.log("sF: " + sF);

            //this.y = (paneInfo.h - (elInfo.y - paneInfo.x)) - sF;

            this.y = (paneInfo.h - elInfo.h) - sF;

            console.log("orgPos.y: " + orgPos.y);
            console.log("elInfo.y: " + elInfo.y);
            console.log("slideDown y: " + this.y);

        }

        // --- OPACITY LOGIC ---
        if (type.includes("fadeOut")) {
            this.opacity = 0;
        }

        if (type.includes("fadeIn")) {
            // Start invisible, fade to 1
            this.target.css("opacity", 0);
            this.opacity = 1;
        }

        

        this.animate();
    }

    /* =========================================
       4. RUN GSAP ANIMATION
    ==========================================*/
    animate() {

        const transformOrigin = this._getTransformOrigin(this.anchor);

        gsap.to(this.target, {
            x: this.x,
            y: this.y,
            opacity: this.opacity,
            scale: this.scale,
            transformOrigin: this.transform,
            duration: this.duration,
            delay: this.delay,
            onStart: this.onStart || undefined,
            onComplete: this.onComplete || undefined
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
            w: $pane.width() || 0,
            h: $pane.height() || 0,
            x: $pane.offset().left,
            y: $pane.offset().top
        };
    }

    /* =========================================
       6. HELPERS: JSON STEPS & STEP INDEX
    ==========================================*/
    // Get a single step by index, and update data-nextstep for the next call
    _readAnimationStep(stepIndex) {

        const steps = this._getAnimationStepsFromAttr();

        if (!Array.isArray(steps) || steps.length === 0) {
            return null;
        }

        // Set next step for the next time this element is animated
        this._setNextStep(stepIndex, steps.length);

        return steps[stepIndex] || null;
    }

    // Parse the JSON array in data-animation
    _getAnimationStepsFromAttr() {

        const json = this.target.attr("data-animation");
        if (!json) return [];

        try {
            return JSON.parse(json);  // e.g. [ { "type": "slideOutRight" }, ... ]
        } catch (e) {
            console.warn("Invalid animation JSON:", e, json);
            return [];
        }
    }

    // Store the next step index in data-nextstep (loops back to 0 at end)
    _setNextStep(currentStep, totalSteps) {
        
        let next = currentStep + 1;
        
        if (next >= totalSteps) {
            next = 0; // loop to start
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

    _setDefaults()
    {
        this.x          = 0;
        this.y          = 0;
        this.scale      = 1;
        this.anchor     = "center";
        this.duration   = 1;
        this.delay      = 0;
        this.onStart    = null;
        this.onComplete = null;
    }

    _getCurrentXY() {
        const el = this.target[0]; // you’ve been normalizing to jQuery
        return {
            x: gsap.getProperty(el, "x") || 0,
            y: gsap.getProperty(el, "y") || 0
        };
        }

}
