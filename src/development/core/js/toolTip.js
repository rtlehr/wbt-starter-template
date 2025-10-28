class toolTip {

  constructor(){}

  addToolTip() {

    console.log("Adding tool tip functionality");

    //this.isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Reusable dialog (closed by default)
  $('#tipDialog').dialog({
    autoOpen: false,
    modal: true,
    width: 360,
    buttons: [
      { text: "Close", click: function () { $(this).dialog('close'); } }
    ]
  });

  //if (mqPhone.matches) {
    // Mobile/touch: open dialog on tap
    $('.has-tip')
      .attr({ role: 'button', tabindex: '0' }) // a11y affordances
      .on('click keydown', function (e) {
        // Activate on click or Enter/Space
        if (e.type === 'click' ||
            (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
          e.preventDefault();
          if (mqDesktop.matches) return;  
          const tip = $(this).data('tip') || $(this).attr('title') || '';
          $('#tipDialog .tip-body').text(tip);
          $('#tipDialog').dialog('option', 'title', $(this).text().trim() || 'Info').dialog('open');
        }
      });

 // } else {
    // Desktop/hover: standard jQuery UI tooltip
    $('.has-tip').tooltip({
      items: '.has-tip',
      content: function () { return $(this).data('tip') || $(this).attr('title') || ''; },
      show: { delay: 100 },
      hide: { delay: 0 }
    });
  //}

  this.adjustForScreenSize();
}

  // Remove whichever mode is active (idempotent)
  adjustForScreenSize(){

    if(mqPhone.matches)
    {
      $('.has-tip').tooltip('disable');
    }
    else
    {
      $('.has-tip').tooltip('enable');
    }

  }


}


