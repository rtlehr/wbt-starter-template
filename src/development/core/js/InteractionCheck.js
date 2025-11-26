class InteractionCheck {

    constructor(course, int) {
        this.course = course;
        this.interface = int;
    }

    checkForNotViewed() {
        const $allNotViewed = $(".notViewed");

        if ($allNotViewed.length === 0) {
            // Everything has been viewed already
            this.interface.turnOnNextButton();
            return;
        }

        // There are still interactions pending
        this.interface.turnOffNextButton();

        // Only attach click handlers to .notViewed that are NOT .noClick
        const $clickableNotViewed = $allNotViewed.not(".noClick");

        $clickableNotViewed.each((_, el) => {
            const $el = $(el);

            // avoid stacking multiple handlers
            $el.off(".interactionCheck");

            $el.on("click.interactionCheck", (e) => {

                const hasOrder = $el.is("[data-clickOrder]");
                const isLocked = hasOrder && !$el.hasClass("ic-active");

                // If this is part of the ordered sequence and NOT active, block it
                if (isLocked) {
                    e.preventDefault();
                    return;
                }

                // Mark as viewed
                $el.removeClass("notViewed").addClass("viewed");

                // Recalculate next ordered interaction
                this._updateClickOrderState();

                // Check if all interactions are complete
                this.checkInteractions();

                // Decide if we should allow navigation
                const isAnchor = $el.is("a");
                const href = $el.attr("href");

                // For real links, let the browser navigate
                if (isAnchor && href && href !== "#" && href !== "javascript:void(0)") {
                    return; // no preventDefault -> follow link
                }

                // For non-links or fake links, prevent default
                e.preventDefault();
            });
        });

        // Initialize click-order state for clickable, ordered items
        this._updateClickOrderState();
    }

    elementViewed(el)
    {
        
        if(el.hasClass("notViewed"))
        {
            el.removeClass("notViewed").addClass("viewed");
            this.checkInteractions();
        }
        
    }

    addClickCheck() {
        // future logic
    }

    checkInteractions() {
        if ($(".notViewed").length === 0) {
            this.interface.turnOnNextButton();
        }
    }

    /**
     * Determines which .notViewed item with data-clickOrder should be active.
     * Skips elements with .noClick.
     */
    _updateClickOrderState() {
        // Clear previous state on clickable ordered items
        $("[data-clickOrder]").not(".noClick")
            .removeClass("ic-active ic-locked");

        const $orderedNotViewed = $(".notViewed[data-clickOrder]").not(".noClick");

        if ($orderedNotViewed.length === 0) {
            // No ordered clickable items remaining
            return;
        }

        // Find the smallest clickOrder among clickable .notViewed
        let nextOrder = null;

        $orderedNotViewed.each((_, el) => {
            const $el = $(el);
            const val = parseInt($el.data("clickorder"), 10);
            if (isNaN(val)) return;

            if (nextOrder === null || val < nextOrder) {
                nextOrder = val;
            }
        });

        if (nextOrder === null) {
            return;
        }

        // Mark only the nextOrder item as active, others locked
        $orderedNotViewed.each((_, el) => {
            const $el = $(el);
            const val = parseInt($el.data("clickorder"), 10);

            if (val === nextOrder) {
                $el.addClass("ic-active");
            } else {
                $el.addClass("ic-locked");
            }
        });
    }

}
