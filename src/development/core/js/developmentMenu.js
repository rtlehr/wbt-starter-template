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

  }

  goToPage()
  {
      const mod  = $('#dev-mod').val().trim();
      const page = $('#dev-page').val().trim();

      this.course.gotoPage((mod-1), (page-1));
  }

}
