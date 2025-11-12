class QuizManager {

  constructor(course, settings) {

    this.course = course || null;

    this.settings = settings || {};

    this.totalQuestions = this.settings.totalQuestions;

    this.passingScore = this.settings.passingScore;

    this.countCorrect = 0;

    this.answerConfig = null;

  }

  /**
   * Initialize quizzes with an answer configuration.
   *
   * Examples:
   *   // ONE quiz on the page:
   *   quizMgr.init([1]);          // only option index 1 is correct
   *
   *   // MANY quizzes keyed by data-question-id:
   *   quizMgr.init({
   *     q1: [1],
   *     q2: [0, 2]
   *   });
   *
   *   // MANY quizzes by index (array-of-arrays):
   *   quizMgr.init([
   *     [1],       // for first .wbt-quiz
   *     [0, 2]     // for second .wbt-quiz
   *   ]);
   *
   *   // NO config: fall back to data-correct="true" in HTML
   *   quizMgr.init();
   */

  init(answersConfig) {

    this.answerConfig = answersConfig;   // may be undefined/null

    this.addCourseFeedback();
    
    this._setupQuizzes();

  }

  /* ---------------- internal setup ---------------- */

  _setupQuizzes() {
    const _this = this;

    $('.wbt-quiz').each(function (index) {
      _this._initQuiz($(this), index);
    });
  }

  _initQuiz($quiz, quizIndex) {
    const $options = $quiz.find('.quiz-option');
    if (!$options.length) return;

    const questionId = $quiz.data('questionId') || `quiz-${quizIndex}`;

    // 1) try to read correct answers from config passed to init()
    let correctIndexes = this._getCorrectIndexesFromConfig(questionId, quizIndex);

    // 2) if none found, fall back to data-correct="true" in HTML
    if (!correctIndexes.length) {
      correctIndexes = this._getCorrectIndexesFromDOM($options);
    }

    const multiple  = correctIndexes.length > 1;
    const inputType = multiple ? 'checkbox' : 'radio';

    // Optional feedback (kept hidden via CSS)
    const fbCorrect   = this.answerConfig.correctFeedback || '';
    const fbIncorrect = this.answerConfig.incorrectFeedback || '';

    // Store meta
    $quiz.data('multiple', multiple);
    $quiz.data('correctIndexes', correctIndexes);
    $quiz.data('questionId', questionId);
    $quiz.data('feedbackCorrect', fbCorrect);
    $quiz.data('feedbackIncorrect', fbIncorrect);

    // Inject inputs into each option
    $options.each(function (i) {
      const $opt = $(this);
      const text = $.trim($opt.text());
      $opt.empty();

      const inputId = questionId + '-opt-' + i;

      const $label = $('<label/>', {
        class: 'quiz-option-label',
        for: inputId
      });

      const $input = $('<input/>', {
        type: inputType,
        id: inputId,
        name: questionId,         // same name => radio-group for single-answer
        'data-index': i,
        'aria-label': text
      });

      const $span = $('<span/>', {
        class: 'quiz-option-text',
        text: text
      });

      $label.append($input, $span);
      $opt.append($label);
    });

    const _this = this;
    $quiz.find('.quiz-submit').on('click', function (e) {
      e.preventDefault();
      _this._checkQuiz($quiz);
    });
  }

  /**
   * Try to get correct answers based on how init() was called.
   */
  _getCorrectIndexesFromConfig(questionId, quizIndex) {
    const cfg = this.answerConfig;
    if (!cfg) return [];

    // CASE A: init([0, 2]) or init([1]) - plain array
    if (Array.isArray(cfg)) {
      const $allQuizzes = $('.wbt-quiz');

      // Only one quiz → use entire array for that quiz
      if ($allQuizzes.length === 1) {
        return cfg.slice();
      }

      // If it's an array-of-arrays → per quiz index
      if (Array.isArray(cfg[quizIndex])) {
        return cfg[quizIndex].slice();
      }

      // If it's a flat array but multiple quizzes,
      // we fall back to DOM unless you want "same answers for all".
      // If you DO want same answers for all, uncomment:
      // return cfg.slice();
      return [];
    }

    // CASE B: init({ q1:[1], q2:[0,2], ... }) - keyed by questionId
    if (typeof cfg === 'object') {
      if (Array.isArray(cfg[questionId])) {
        return cfg[questionId].slice();
      }
    }

    return [];
  }

  /**
   * Fallback: read correct answers from data-correct="true" on <li>.
   */
  _getCorrectIndexesFromDOM($options) {
    const correct = [];
    $options.each(function (i) {
      const $opt = $(this);
      const val = $opt.data('correct');
      if (val === true || val === 'true') {
        correct.push(i);
      }
    });
    return correct;
  }

  _checkQuiz($quiz) {
    const questionId         = $quiz.data('questionId');
    const correctIndexes     = $quiz.data('correctIndexes') || [];
    const feedbackCorrect    = $quiz.data('feedbackCorrect')  || '';
    const feedbackIncorrect  = $quiz.data('feedbackIncorrect')|| '';

    const selectedIndexes = [];

    $quiz.find('input[type=radio], input[type=checkbox]').each(function () {
      if (this.checked) {
        const idx = parseInt($(this).attr('data-index'), 10);
        if (!isNaN(idx)) selectedIndexes.push(idx);
      }
    });

    const sortedSel = selectedIndexes.slice().sort();
    const sortedCor = correctIndexes.slice().sort();

    const isCorrect = sortedSel.length === sortedCor.length &&
      sortedSel.every(function (v, i) { return v === sortedCor[i]; });

    $quiz.removeClass('quiz-correct quiz-incorrect');

    if (isCorrect) {
      $quiz.addClass('quiz-correct');
      console.log(
        'Question "' + questionId + '": CORRECT' +
        (feedbackCorrect ? ' — ' + feedbackCorrect : '')
      );

      if(this.answerConfig.credit)
      {
        this.countCorrect++;
      }

      console.log("Total Correct Answers: " + this.countCorrect);

      this._showFeedback(true, feedbackCorrect);

    } else {
      $quiz.addClass('quiz-incorrect');
      console.log(
        'Question "' + questionId + '": INCORRECT' +
        (feedbackIncorrect ? ' — ' + feedbackIncorrect : '')
      );

      this._showFeedback(false, feedbackIncorrect);
    }
  }

  _showFeedback(isCorrect, feedbackText) 
  {

      let $d = $("#courseFeedback");

      $d.attr("title", isCorrect ? 'Correct!' : 'Incorrect');

      $d.find(".tip-body").html(feedbackText);

      $d.dialog();

      $d.dialog('open');
    
  }

  addCourseFeedback() {

    const feedbackHTML = `
      <div id="courseFeedback" title="Info" style="display:none;">
        <div class="tip-body"></div>
      </div>
    `;

    // Append to body if it doesn't already exist
    if (!$('#courseFeedback').length) {
      $('body').append(feedbackHTML);
      console.log('Course feedback dialog added.');
    } else {
      console.log('Course feedback dialog already exists.');
    }

  }


}
