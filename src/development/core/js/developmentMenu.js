class DevelopmentMenu {

  constructor(course) 
  {
    this.course = course;
  }

  init() {

    $("#reload").on('click', (event) => {
      event.preventDefault();
      this.reloadPage();   // <-- 'this' is the class instance
    });

    $("#switchModes").on('click', (event) => {
      event.preventDefault();
      this.switchModes();   // <-- 'this' is the class instance
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

}
