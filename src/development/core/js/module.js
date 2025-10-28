class Module {

  constructor(course, modInfo) {

    this.course = course;

    this.modInfo = modInfo;

    this.pages = [];

    for(let count=0; count < this.modInfo.pages.length; count++) {

      this.pages.push(new Page(this.course, this.modInfo.pages[count]));
    
    }

  }

  getTotalPages() {

    return this.pages.length;

  }

  getId()
  {
    return this.modInfo.id;
  }

  init() {}

}


