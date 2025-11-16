class Animation {

    constructor(course, pageInfo) {
        this.course = course;
        this.pageInfo = pageInfo;
    }

    /**
     * target: selector string, DOM element, or jQuery object
     * options: { x, y, opacity, scale, anchor, duration, delay, onStart, onComplete }
     */
    playAnimation(target, options = {}) {

        // Normalize target: accept jQuery object, selector, or element
        if (target instanceof jQuery) {
            this.target = target[0];
        } else if (typeof target === "string") {
            this.target = document.querySelector(target);
        } else {
            this.target = target;
        }

        if (!this.target) {
            console.warn("Animation: target not found:", target);
            return;
        }

        this.setAnimation(options);
    }

    setAnimation(options) {
        // Defaults
        this.x          = options.x          !== undefined ? options.x          : 0;
        this.y          = options.y          !== undefined ? options.y          : 0;
        this.opacity    = options.opacity    !== undefined ? options.opacity    : 1;
        this.scale      = options.scale      !== undefined ? options.scale      : 1;
        this.anchor     = options.anchor     || "center";
        this.duration   = options.duration   || 1;
        this.delay      = options.delay      || 0;
        this.onStart    = options.onStart    || null;
        this.onComplete = options.onComplete || null;

        this.animate();
    }

    _getTransformOrigin(anchor) {
        if (!anchor) return "50% 50%";

        switch (anchor.toLowerCase()) {
            case "top-left":     return "0% 0%";
            case "top-center":
            case "top":          return "50% 0%";
            case "top-right":    return "100% 0%";
            case "center-left":
            case "left":         return "0% 50%";
            case "center-right":
            case "right":        return "100% 50%";
            case "bottom-left":  return "0% 100%";
            case "bottom-center":
            case "bottom":       return "50% 100%";
            case "bottom-right": return "100% 100%";
            case "center":
            default:             return "50% 50%";
        }
    }

    animate() {

        const transformOrigin = this._getTransformOrigin(this.anchor);

        gsap.to(this.target, {
            x: this.x,
            y: this.y,
            opacity: this.opacity,
            scale: this.scale,
            transformOrigin: transformOrigin,
            duration: this.duration,
            delay: this.delay,
            onStart: this.onStart || undefined,
            onComplete: this.onComplete || undefined
        });
    }
}
