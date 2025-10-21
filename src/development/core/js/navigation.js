class Navigation {

    constructor(course, modules) {

        this.course = course;

        this.modules = modules;

        this.modalWindow = new modalWindow();

        this.toolTip = new toolTip();

        this.interface = new Interface(this.course, this.modules);

    }

    init() {

        console.log("Navigation Initialized");

        this.animateWidth = $("#currentPage").outerWidth();

        this.animateLeft = parseFloat($('#wbtContentRow').css('left')) || 0;

    }

    calcNextPage(direction)
    {   

        curPage += direction;

        if(curPage > this.modules[curMod].getTotalPages() - 1)
        {
            curPage = 0;
            curMod++;
        }
        else if(curPage < 0)
        {
            curMod--;
            curPage = this.modules[curMod].getTotalPages()-1;
        }

        this.loadPage(curMod, curPage, direction);

    }

    loadPage(mod, page, direction = 1)
    {

        let selector = (direction > 0) ? $('#nextPage') : $('#previousPage');

        let url = this.modules[mod].pages[page].getPageURL();

        console.log("isPhone: " + mqPhone.matches);

        if(mqPhone.matches)
        {
            $("#currentPage").load(url, (response, status, xhr) => {

                if (status === "error") {
                    $(selector).html('<p role="alert">Sorry, failed to load this page.</p>');
                    console.error("Load error:", xhr.status, xhr.statusText);
                    return; // bail on error
                }
                
                if (typeof window["pageLoadedFunction"] === 'function') {
                    window["pageLoadedFunction"]();          // or: this[methodName].apply(this, args)
                }

            });

            return;
        }

        // inside your class method
        $(selector).load(url, (response, status, xhr) => {
        if (status === "error") {
            $(selector).html('<p role="alert">Sorry, failed to load this page.</p>');
            console.error("Load error:", xhr.status, xhr.statusText);
            return; // bail on error
        }
        
        if (typeof window["pageLoadedFunction"] === 'function') {
            window["pageLoadedFunction"]();          // or: this[methodName].apply(this, args)
        }

        this.animatePage(direction);

        });

    }
    
    checkFooterVisibility()
    {
        if($("#courseFooter").css("top") == "0px") {
            this.interface.showFooter();    
        }
    }

    animatePage(direction) {

        this.checkFooterVisibility();

        const newPos = this.animateLeft + (-direction * this.animateWidth);
        const $row = $('#wbtContentRow');
        const $loadDiv = (direction > 0) ? $('#nextPage') : $('#previousPage'); // clearer
        const origLeft = this.animateLeft;

        $row.stop(true).animate({ left: newPos }, 800, () => {
            $row.css('left', origLeft);
            $('#currentPage').html($loadDiv.html());
            $($loadDiv).empty();
            this.interface.setInterface();
            this.interface.setPageNumber(this.modules[curMod].getTotalPages());

            this.modalWindow.addModal();

            this.toolTip.addToolTip();

            if (typeof window["finishedMovingIn"] === 'function') {
                window["finishedMovingIn"]();          // or: this[methodName].apply(this, args)
            }


        });
        }


}


