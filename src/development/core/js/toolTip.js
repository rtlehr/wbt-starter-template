class toolTip {

  constructor(){}

  addToolTip() {

    console.log("Adding tool tip functionality");

    let modalName = "";

    $(".toolTip").each(function(){
        
        //elementId = $(this).attr("id");

        $(this).tooltip({
            track: true
        });

    });
    
  }

}


