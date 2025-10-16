class Navigation {

    constructor(modules) {

        this.modules = modules;

    }

    init() {

        console.log("Navigation Initialized");

        this.animateWidth = $("#currentPage").outerWidth();

        this.animateLeft = parseFloat($('#wbtContentRow').css('left')) || 0;

    }

    calcNextPage(direction)
    {   

        curPage += direction;

        if(curPage > this.modules[curMod].getPageCount() - 1)
        {
            curPage = 0;
            curMod++;
        }
        else if(curPage < 0)
        {
            curMod--;
            curPage = this.modules[curMod].getPageCount()-1;
        }

        this.loadPage(curMod, curPage, direction);

    }

    loadPage(mod, page, direction = 1)
    {

        let selector = (direction > 0) ? $('#nextPage') : $('#previousPage');
        
        let url = this.modules[mod].pages[page].getPageURL();

        // inside your class method
        $(selector).load(url, (response, status, xhr) => {
        if (status === "error") {
            $(selector).html('<p role="alert">Sorry, failed to load this page.</p>');
            console.error("Load error:", xhr.status, xhr.statusText);
            return; // bail on error
        }
        
        let methodName = "Lesson1Init"; // Example method name based on loaded content

        if (typeof window[methodName] === 'function') {
            window[methodName]();          // or: this[methodName].apply(this, args)
        }

        this.animatePage(direction);

        });

    }

    animatePage(direction)
    {
        let newPos = this.animateLeft + (-direction * this.animateWidth);

        const $row = $('#wbtContentRow');
        const $loadDiv = (Math.round(newPos) < 0) ? $('#nextPage') : $('#previousPage');
        const origLeft = this.animateLeft; // capture once

        $row.stop(true).animate({ left: newPos }, 800, function () {

            $row.css('left', origLeft);
            $('#currentPage').html($loadDiv.html()); 

        });
    }

}


