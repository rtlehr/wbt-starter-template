class Module {

  constructor(course, modInfo) {

    this.course = course;

    this.modInfo = modInfo;

    this.pages = [];

    console.log("Module Initialized: " + this.modInfo.title);

    for(let count=0; count < this.modInfo.pages.length; count++) {

      this.pages.push(new Page(this.course, this.modInfo.pages[count]));
    
    }

  }

  getTotalPages() {

    return this.pages.length;

  }

  init() {}

}


