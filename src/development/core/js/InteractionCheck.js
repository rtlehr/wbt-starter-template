class InteractionCheck {

    constructor(course, int) {
        this.course = course;
        this.interface = int;
    }

    checkForNotViewed() {
        const $notViewed = $(".notViewed");

        if ($notViewed.length === 0) {
            // Nothing to do, everything has been viewed
            this.interface.turnOnNextButton();
            return;
        }

        // There are still interactions pending
        this.interface.turnOffNextButton();

       $notViewed.each((_, el) => {
    const $el = $(el);

    // avoid stacking multiple handlers
    $el.off(".interactionCheck");

    $el.on("click.interactionCheck", (e) => {
        const hasOrder = $el.is("[data-clickOrder]");
        const isLocked = hasOrder && !$el.hasClass("ic-active");

        // If this is part of the ordered sequence and NOT active, block it
        if (isLocked) {
            e.preventDefault(); // out-of-order click → do nothing
            return;
        }

        // Mark as viewed and update state
        $el.removeClass("notViewed").addClass("viewed");
        this._updateClickOrderState();
        this.checkInteractions();

        // Decide if we should block navigation or not
        const isAnchor = $el.is("a");
        const href = $el.attr("href");

        // If it's a "real" link (not "#" or empty), let it navigate
        if (isAnchor && href && href !== "#" && href !== "javascript:void(0)") {
            // no preventDefault → browser follows the link
            return;
        }

        // Otherwise, stop default behavior (for fake links or non-anchors)
        e.preventDefault();
    });
});


        // Initialize click-order state (decide which ordered one is first)
        this._updateClickOrderState();
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
     * Only the lowest clickOrder is marked as active.
     */
    _updateClickOrderState() {
        // Clear previous state on all ordered items
        $("[data-clickOrder]").removeClass("ic-active ic-locked");

        const $orderedNotViewed = $(".notViewed[data-clickOrder]");

        if ($orderedNotViewed.length === 0) {
            // No ordered items remaining, nothing to enforce
            return;
        }

        // Find the smallest clickOrder among .notViewed
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
                $el.addClass("ic-active");   // clickable for progress
            } else {
                $el.addClass("ic-locked");   // visually disabled / out of order
            }
        });
    }

}
