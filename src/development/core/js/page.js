class Page {

  constructor(pageInfo) 
  {
    this.pageInfo = pageInfo;

    console.log("Page Initialized: " + this.pageInfo.title);
  }

  init() {

    console.log("Page Initialized")
  
  }

  getPageURL() 
  {
  
    return this.pageInfo.url;
  
  }

}


