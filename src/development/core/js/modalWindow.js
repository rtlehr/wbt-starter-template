class modalWindow {

  constructor(){}

  addModal() {

    console.log("Adding modal window functionality");

    let modalName = "";

    $(".modalWindow").each(function(){
        
        modalName = $(this).attr("id");

        let modalWidth = $(this).data("width") || 400;
        let modalHeight = $(this).data("height") || 200;

        $("#" + modalName + '-dialog').dialog({
            autoOpen: false,
            modal: true,
            width: modalWidth,
            height: modalHeight
        });

        $(this).on("click", function(event){
            event.preventDefault();
            $("#" + modalName + '-dialog').dialog('open');
        });

    });
    
  }

}


