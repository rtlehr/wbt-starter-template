class modalWindow {
  /**
   * @param {InteractionCheck} interactionCheck
   *        Optional. If provided, we'll notify it when a modal has been "viewed".
   */
  constructor(interactionCheck) {
    this.interactionCheck = interactionCheck || null;
    this.$triggers = $();   // .modalWindow elements
    this.$dialog = null;    // shared #modalDialog
  }

  /**
   * Public entry point – call this once after DOM is ready.
   * Example:
   *   const mw = new modalWindow(interactionCheck);
   *   mw.addModal();
   */
  addModal() {
    this._setupSharedDialog();
    this._wireTriggers();
  }

  // --------------------------------------------------------
  // Shared dialog setup (reuses #modalDialog from toolTip)
  // --------------------------------------------------------
  _setupSharedDialog() {
    this.$dialog = $('#modalDialog');

    if (!this.$dialog.length) {
      console.warn('modalWindow: #modalDialog not found in DOM.');
      return;
    }

    // Init as jQuery UI dialog (if not already)
    // This is safe even if toolTip also calls .dialog() on it.
    this.$dialog.dialog({
      autoOpen: false,
      modal: true,
      width: 400,
      height: 200,
      buttons: [
        {
          text: "Close",
          click: function () { $(this).dialog('close'); }
        }
      ]
    });
  }

  // --------------------------------------------------------
  // Wire .modalWindow triggers to use the shared dialog
  // --------------------------------------------------------
  _wireTriggers() {
    const self = this;

    this.$triggers = $('.modalWindow');

    if (!this.$triggers.length) return;

    this.$triggers.each(function () {
      const $trigger = $(this);

      $trigger.off('.modalWindow'); // avoid duplicate handlers

      $trigger.on('click.modalWindow', function (e) {
        e.preventDefault();

        // Respect InteractionCheck's ordering:
        // If this element has data-clickOrder and is NOT .ic-active,
        // treat it as locked.
        const hasOrder = $trigger.is('[data-clickOrder]');
        const isLocked = hasOrder && !$trigger.hasClass('ic-active');

        if (isLocked) {
          self._nudge($trigger);
          return;
        }

        if (!self.$dialog) {
          console.warn('modalWindow: shared dialog not initialized.');
          return;
        }

        const modalName = $trigger.attr('id');

        // Template block like #introModal-dialog
        const $contentTemplate = $('#' + modalName + '-dialog');

        const modalWidth  = Number($trigger.data('width'))  || 400;
        const modalHeight = Number($trigger.data('height')) || 'auto';
        const modalTitle  =
          $trigger.data('modaltitle') ||
          $trigger.text().trim() ||
          'Info';

        const modalClass =
          $trigger.data('modalclass') ||
          $contentTemplate.data('modalclass') ||
          '';

        const bodyHtml = $contentTemplate.length
          ? $contentTemplate.html()
          : ($trigger.data('modalcontent') || '');

        const $body = self.$dialog.find('.tip-body');

        // Reset classes on the body and apply modalClass
        $body.attr('class', 'tip-body');
        if (modalClass) {
          $body.addClass(modalClass);
        }

        // Inject content
        $body.html(bodyHtml);

        // Apply per-modal dialog options
        self.$dialog
          .dialog('option', 'title', modalTitle)
          .dialog('option', 'width', modalWidth)
          .dialog('option', 'height', modalHeight);

        // When this dialog closes, mark this trigger as "viewed"
        self.$dialog
          .off('dialogclose.modalWindow')
          .on('dialogclose.modalWindow', function () {
            if (self.interactionCheck) {
              // Let InteractionCheck handle notViewed/viewed + Next button
              self.interactionCheck.elementViewed($trigger);
            } else {
              // Fallback: just swap classes
              if ($trigger.hasClass('notViewed')) {
                $trigger.removeClass('notViewed').addClass('viewed');
              }
            }
          });

        // Open shared dialog
        self.$dialog.dialog('open');
      });
    });
  }

  // Small visual cue for locked items
  _nudge($el) {
    $el.addClass('nudge');
    setTimeout(() => $el.removeClass('nudge'), 250);
  }
}
