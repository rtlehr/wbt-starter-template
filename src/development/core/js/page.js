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


  getId()
  {
    return this.pageInfo.id;
  }

  isQuiz()
  {
    return this.pageInfo.hasOwnProperty('quiz');
  }

  forQuizCredit()
  {
    if(this.isQuiz())
    {
      return this.pageInfo.quiz.credit || false;
    }
    return false;
  }

  quizAnswers()
  {
    if(this.isQuiz())
    {
      return this.pageInfo.quiz || [];
    }
    return [];
  }

}


