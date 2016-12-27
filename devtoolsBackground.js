var panels = chrome && chrome.devtools && chrome.devtools.panels;


var gwtcPanel = panels.create(
   'SAP GW TC Builder',
    null, // No icon path
    'Panel/app.html',
    null // no callback needed
);
//'Panel/NetworkRequests.html',
console.log(JSON.stringify(panels) );

chrome.devtools.panels.elements.createSidebarPane("My Sidebar",
    function(sidebar) {
        // sidebar initialization code here
        sidebar.setObject({ some_data: "Some data to show" });
});
/*
chrome.devtools.panels.elements.createSidebarPane("Font Properties",
          function(sidebar) {
            sidebar.setPage("Sidebar.html");
            sidebar.setHeight("8ex");
          });
		  
		  */