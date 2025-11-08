// QuizManager.js
class QuizManager {

  constructor(course) {
    this.course = course || null;
  }

  init() {
    console.log("QuizManager initialized");
    this._setupQuizzes();
  }

  // Find all quizzes on the page and initialize them
  _setupQuizzes() {
    const _this = this;

    $('.wbt-quiz').each(function (index) {
      _this._initQuiz($(this), index);
    });
  }

  // Initialize a single quiz block
  _initQuiz($quiz, quizIndex) {
    const $options = $quiz.find('.quiz-option');
    if (!$options.length) return;

    const correctIndexes = [];
    $options.each(function (i) {
      const $opt = $(this);
      if ($opt.data('correct') === true || $opt.data('correct') === "true") {
        correctIndexes.push(i);
      }
    });

    const multiple = correctIndexes.length > 1;
    const inputType = multiple ? 'checkbox' : 'radio';
    const questionId = $quiz.data('questionId') || `quiz-${quizIndex}`;

    // Store meta on the quiz container
    $quiz.data('multiple', multiple);
    $quiz.data('correctIndexes', correctIndexes);
    $quiz.data('questionId', questionId);

    // Inject inputs into each option
    $options.each(function (i) {
      const $opt = $(this);
      const text = $.trim($opt.text());

      $opt.empty(); // clear existing text

      const inputId = questionId + '-opt-' + i;

      const $label = $('<label/>', {
        class: 'quiz-option-label',
        for: inputId
      });

      const $input = $('<input/>', {
        type: inputType,
        id: inputId,
        name: questionId,         // same name → radio group
        'data-index': i,
        'aria-label': text        // basic accessibility
      });

      const $span = $('<span/>', {
        class: 'quiz-option-text',
        text: text
      });

      $label.append($input, $span);
      $opt.append($label);
    });

    // Wire up submit button
    const _this = this;
    $quiz.find('.quiz-submit').on('click', function (e) {
      e.preventDefault();
      _this._checkQuiz($quiz);
    });
  }

  // Evaluate one quiz: compare selections to correctIndexes
  _checkQuiz($quiz) {
    const questionId      = $quiz.data('questionId');
    const correctIndexes  = $quiz.data('correctIndexes') || [];
    const multiple        = !!$quiz.data('multiple');

    const selectedIndexes = [];

    $quiz.find('input[type=radio], input[type=checkbox]').each(function () {
      if (this.checked) {
        const idx = parseInt($(this).attr('data-index'), 10);
        if (!isNaN(idx)) selectedIndexes.push(idx);
      }
    });

    // Normalize arrays & compare
    const sortedSel = selectedIndexes.slice().sort();
    const sortedCor = correctIndexes.slice().sort();

    let isCorrect = sortedSel.length === sortedCor.length &&
      sortedSel.every(function (v, i) { return v === sortedCor[i]; });

    // Visual state (optional)
    $quiz.removeClass('quiz-correct quiz-incorrect');
    if (isCorrect) {
      $quiz.addClass('quiz-correct');
      console.log('Question "' + questionId + '": CORRECT');
    } else {
      $quiz.addClass('quiz-incorrect');
      console.log('Question "' + questionId + '": INCORRECT');
    }
  }

}
