class Page {

  constructor(course, pageInfo) 
  {
    
    this.course = course;

    this.pageInfo = pageInfo;

  }

  init() {

    console.log("Page Initialized")
  
  }

  getPageURL() 
  {
  
    return this.pageInfo.url;
  
  }

}


