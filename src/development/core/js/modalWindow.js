class modalWindow {
  constructor() {
    this.maxCompletedOrder = 0;
    this.$triggers = $(); // will hold all .modalWindow triggers
    // // Optional: restore progress across page reloads
    // this.maxCompletedOrder = Number(sessionStorage.getItem('mwProgress')) || 0;
  }

  init() {
    this.addModal();
  }

  addModal() {
    const self = this;

    // Sort triggers by order
    this.$triggers = $('.modalWindow').toArray().sort((a, b) => {
      return (Number($(a).data('modalorder')) || 1) - (Number($(b).data('modalorder')) || 1);
    });
    this.$triggers = $(this.$triggers); // back to jQuery collection

    // Init each trigger + dialog
    this.$triggers.each(function () {
      const $trigger = $(this);
      const modalName = $trigger.attr('id');
      const order = Number($trigger.data('modalorder')) || 1;

      const modalWidth  = $trigger.data('width')  || 400;
      const modalHeight = $trigger.data('height') || 200;

      const $dialog = $('#' + modalName + '-dialog').dialog({
        autoOpen: false,
        modal: true,
        width: modalWidth,
        height: modalHeight
      });

      // Click: only allow if this is <= next allowed (maxCompleted + 1)
      $trigger.on('click', function (e) {
        e.preventDefault();
        if (order > self.maxCompletedOrder + 1) {
          self._nudge($trigger); // locked; tiny cue
          return;
        }

        console.log("has notViewed: " + $trigger.hasClass("notViewed"));

        if($trigger.hasClass("notViewed"))
        {
          $trigger.removeClass('notViewed').addClass('viewed');
          course.checkViewedCount();
        }

        $dialog.dialog('open');

      });

      // When closed, mark complete and refresh locks (so previous remain clickable)
      $dialog.on('dialogclose', function () {
        if (order > self.maxCompletedOrder) {
          self.maxCompletedOrder = order;
          // // Optional: persist for the session
          // sessionStorage.setItem('mwProgress', String(self.maxCompletedOrder));
        }
        self._refreshLocks();
      });
    });

    // Initial lock state
    this._refreshLocks();
  }

  // Set lock/unlock based on current progress
  _refreshLocks() {
    const self = this;
    this.$triggers.each(function () {
      const $t = $(this);
      const ord = Number($t.data('modalorder')) || 1;
      if (ord <= self.maxCompletedOrder + 1) self._unlock($t);
      else self._lock($t);
    });
  }

  _lock($el) {
    $el.addClass('is-locked')
       .attr('aria-disabled', 'true');
  }

  _unlock($el) {
    $el.removeClass('is-locked')
       .removeAttr('aria-disabled');
  }

  _nudge($el) {
    $el.addClass('nudge');
    setTimeout(() => $el.removeClass('nudge'), 250);
  }
}
