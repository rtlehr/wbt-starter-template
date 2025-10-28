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
  }

  reloadPage() {
    
    this.course.gotoPage(curMod, curPage);

  }
}
