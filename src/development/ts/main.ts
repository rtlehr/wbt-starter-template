/// <reference types="jquery" />
// If you also use jQuery UI types:
// /// <reference types="jqueryui" />

// ------------------------------------------
// Entry Point
// ------------------------------------------

import { UserService } from "./services/userService";
import { AppUI } from "./ui/appUI";

document.addEventListener("DOMContentLoaded", () => {
  const service = new UserService();
  const app = new AppUI(service);
  app.init();
});


$(() => {
  console.log('✅ TypeScript is running and jQuery types are working.');

  $('h1').append(' <span class="badge bg-success" style="font-size:0.6em;">TS OK</span>');

  $('#btnTest').on('click', () => {
    $('#dialog').dialog({ modal: true, width: 400 });
  });
});
