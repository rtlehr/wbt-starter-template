class toolTip {

  constructor(interactionCheck) {
    this.interactionCheck = interactionCheck;
  }

  addToolTip() {

    console.log("Adding tool tip functionality");

    const self = this; // keep reference to class instance

    // Reusable dialog (closed by default)
    $('#modalDialog').dialog({
      autoOpen: false,
      modal: true,
      width: 360,
      buttons: [
        { text: "Close", click: function () { $(this).dialog('close'); } }
      ]
    });

    // Mobile/touch: open dialog on tap
    $('.has-tip')
      .attr({ role: 'button', tabindex: '0' }) // a11y affordances
      .on('click keydown', function (e) {
        // Activate on click or Enter/Space
        if (
          e.type === 'click' ||
          (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))
        ) {
          e.preventDefault();

          // On desktop we rely on hover tooltip instead
          if (mqDesktop.matches) return;

          const $target = $(this);
          const tip = $target.data('tip') || $target.attr('title') || '';

          $('#modalDialog .tip-body').text(tip);
          $('#modalDialog')
            .dialog('option', 'title', $target.text().trim() || 'Info')
            .dialog('open');

          // Call your rollover/activation function (mobile/touch)
          self.handleToolTipHover($target);
        }
      });

    // Desktop/hover: standard jQuery UI tooltip
    $('.has-tip').tooltip({
      items: '.has-tip',
      content: function () {
        return $(this).data('tip') || $(this).attr('title') || '';
      },
      show: { delay: 100 },
      hide: { delay: 0 },
      // Called when the tooltip is shown (hover/rollover)
      open: (event, ui) => {
        const $target = $(event.currentTarget);
        this.handleToolTipHover($target);
      }
    });

    this.adjustForScreenSize();
  }

  // Called whenever a tooltip is "rolled over" / activated
  handleToolTipHover($target) {
    this.interactionCheck.elementViewed($target);
  }

  // Remove whichever mode is active (idempotent)
  adjustForScreenSize() {

    if (mqPhone.matches) {
      $('.has-tip').tooltip('disable');
    } else {
      $('.has-tip').tooltip('enable');
    }

  }

}
