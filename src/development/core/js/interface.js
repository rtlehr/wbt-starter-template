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

    $(".moduleMenu li").eq(curMod).removeClass("notAvailableModule");
    $(".moduleMenu li").eq(curMod).addClass("activeModule");

    $("#previousButton").removeClass("notAvailablePage");
    $("#nextButton").removeClass("notAvailablePage");

    if(curMod == 0 && curPage == 0)
    {
        this.turnOffPreviousButton();
    }

    if((curMod + 1) == this.course.getTotalMods() && (curPage + 1) == this.modules[curMod].getTotalPages())
    {
        this.turnOffNextButton();
    }

  }

  setPageNumber(totalPages)
  {

    $("#pageNumber").html("Page " + (curPage + 1) + " of " + this.modules[curMod].getTotalPages());

  }

  turnOffPreviousButton()
  {

    $("#previousButton").addClass("notAvailablePage");

  }

  turnOffNextButton()
  {

    $("#nextButton").addClass("notAvailablePage");

  }

  showFooter()
  {
    $("#courseFooter").stop(true).animate({ top: -50 }, 500, () => {});
  }

  hideFooter()
  {
    $("#courseFooter").css({ top: 0 });
  }

  checkViewedCount()
  {

    this.setInterface();

    if(($(".notViewed").length > 0) && creditMode)
    {
      this.turnOffPreviousButton();
      this.turnOffNextButton();
    }

  }

}


