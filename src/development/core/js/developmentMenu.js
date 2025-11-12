class DevelopmentMenu {

  constructor(course) 
  {
    this.course = course;
  }

  init() {

    $("#reload").on('click', (event) => {
      event.preventDefault();
      this.reloadPage();  
    });

    $("#switchModes").on('click', (event) => {
      event.preventDefault();
      this.switchModes();  
    });

    $('#dev-go').on('click', (event) => {
      event.preventDefault();
      this.goToPage();  
    });
    
  }

  reloadPage() {
    
    this.course.gotoPage(curMod, curPage);

  }

  switchModes()
  {

    creditMode = !creditMode;

    if(creditMode)
    {
      $("#courseMode").html("Credit Mode");
    }
    else
    {
      $("#courseMode").html("Browse Mode");
    }

    this.course.checkViewedCount();
    
  }

  goToPage()
  {
      const mod  =Math.max(1, parseInt($('#dev-mod').val(), 10) || 1);
      const page = Math.max(1, parseInt($('#dev-page').val(), 10) || 1);

      this.course.gotoPage((mod-1), (page-1));
  }

}
