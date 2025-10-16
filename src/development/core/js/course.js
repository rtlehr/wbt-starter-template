let curMod = 0;
let curPage = 0;

$(function () {
  const course = new Course();
  course.init();

  // Use arrow functions so `this` = outer scope (but we don't need `this` anyway)
  $('#previousButton').on('click', (e) => {
    e.preventDefault();
    console.log('previousButton clicked!');
    course.gotoPreviousPage();      // <- use captured variable
  });

  $('#nextButton').on('click', (e) => {
    e.preventDefault();
    console.log('nextButton clicked!');
    course.gotoNextPage();          // <- use captured variable
  });
});

class Course {
  
  constructor() {
    this.courseContent = null;
    this.jsonLoader = null;
  }

  async init() {
    console.log('Course Initialized');

    // Load course data first (so Navigation can use it immediately)
    const res = await fetch('custom/data/course.json');   // or your JsonLoader
    if (!res.ok) throw new Error('Failed to load course.json');
    this.courseContent = await res.json(); 

    console.log('Course Name:', this.courseContent.name);

    // Now safe to init navigation
    this.navigation = new Navigation(this);
    this.navigation.init();

  }

  gotoNextPage() {
    this.navigation.calcNextPage(1);   // <- fixed typo
  }

  gotoPreviousPage() {
    this.navigation.calcNextPage(-1);  // <- fixed typo
  }

  gotoPage(mod, page) {}
}

