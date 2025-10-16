class Module {

  constructor(modInfo) {

    this.modInfo = modInfo;

    this.pages = [];

    console.log("Module Initialized: " + this.modInfo.title);

    for(let count=0; count < this.modInfo.pages.length; count++) {

      this.pages.push(new Page(this.modInfo.pages[count]));
    
    }

  }

  getPageCount() {

    return this.pages.length;
    
  }

  init() {}

}


