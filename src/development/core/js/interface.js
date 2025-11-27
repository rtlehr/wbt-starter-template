class Interface {

  constructor(course, modules) 
  {

    console.log("Interface Initialized");

    this.course = course;

    this.modules = modules;

  }

  init() {}

  setInterface() 
  {

    let modCount = $(".moduleMenu li").length;

    $(".moduleMenu li.activeModule").removeClass("activeModule");

    $(".moduleMenu li").eq(this.course.curMod).removeClass("notAvailableModule");
    $(".moduleMenu li").eq(this.course.curMod).addClass("activeModule");

    $("#previousButton").removeClass("notAvailablePage");
    $("#nextButton").removeClass("notAvailablePage");

    if(this.course.curMod == 0 && this.course.curPage == 0)
    {
        this.turnOffPreviousButton();
    }

    if((this.course.curMod + 1) == this.course.getTotalMods() && (this.course.curPage + 1) == this.modules[this.course.curMod].getTotalPages())
    {
        this.turnOffNextButton();
    }

  }

  setPageNumber(totalPages)
  {

    $("#pageNumber").html("Page " + (this.course.curPage + 1) + " of " + this.modules[this.course.curMod].getTotalPages());

  }

  turnOffPreviousButton()
  {

    $("#previousButton").addClass("notAvailablePage");

  }

  turnOffNextButton()
  {

    $("#nextButton").addClass("notAvailablePage");

  }

    turnOnNextButton()
  {

    $("#nextButton").removeClass("notAvailablePage");

  }

  showFooter()
  {
    $("#courseFooter").stop(true).animate({ top: -50 }, 500, () => {});
  }

  hideFooter()
  {
    $("#courseFooter").css({ top: 0 });
  }

}


