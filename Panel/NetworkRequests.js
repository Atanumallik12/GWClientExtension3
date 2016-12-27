
(function() {
    //Event Initializer
	function initEvents() {
	
		addEvt('clearBtn', 'click', resetList, this);
		addEvt('gwBtn', 'click', pushtoGw , this);
		addEvt('gwDetect', 'click', determineGWSystem, this );

		
		chrome.devtools.network.onNavigated.addListener(resetList);
		chrome.devtools.network.onRequestFinished.addListener(requestFinished);
	}
	//Generic Event Binding
    function addEvt(sel, evt, func, _that) {
		document.getElementById(sel).addEventListener(evt, func.bind(_that));
	}
	//URL checker 
	function isUrl(url , filterGWOdata) {
		isUrl =  /^https?:\/\//i.test(url);
		isGWOdataUrl = true;
        return  ( isUrl && isGWOdataUrl );
		 
		}

	function resetList() {
		console.log('readlist');
		//reqList = [];
		var scope = angular.element('[ng-controller="mycontroller"]').scope();
		scope.clear();
		scope.$apply();
		
		$('#dvTable').empty() ;
	}
	function clearGWresponse(){
		$('#dvTable').empty() ;
	} 
   function detectGWSystem(){
	    var scope = angular.element('[ng-controller="mycontroller"]').scope();
		var urls = scope.urls;
		var gwSystem = []; 
		var gwSystemAss = []; 
		var sysaddr ;
		//in loop
		for (var x = 0; x < urls.length; x++) {
			sysaddr = scope.urls[x].URL.slice(0, scope.urls[x].URL.indexOf('/sap/opu/odata')) ;
			if ( gwSystemAss[ sysaddr ] == undefined ) {
				gwSystemAss[ sysaddr ] = sysaddr ;
				gwSystem.push( sysaddr );
			} 	
		} 
		
		if(gwSystem.length > 1)
		{
			console.log('multiple GW systems found, additional action needed');
			
		}	
		
		//Set the final GW system to Scope
		//angular.element('[ng-controller="mycontroller"]').scope().gwSystem = gwSystem[0];
		
		//Client determination needs to be done explicitly 
		gwSystem = {url : gwSystem[0] , client :  '' };
		
		return gwSystem;
		
   }
	
   function getGWSystem(){
	   
      var gwSystem = detectGWSystem();
	  var scope = angular.element('[ng-controller="mycontroller"]').scope();

  	  scope.setClient(gwSystem.client) ;
	  scope.setGWsystem(gwSystem.url) ;
	  scope.$apply();

	  return gwSystem ;
	   
   }	
   
   function determineGWSystem(){
	   var gwSystem = getGWSystem() ;
   
   }
   
   
     function getTestGroup(){
	    var scope = angular.element('[ng-controller="mycontroller"]').scope(); 
		return scope.testGroup ;
	    
   } 
   
   function prepareData(){
	     var scope = angular.element('[ng-controller="mycontroller"]').scope();
		 var urls = scope.urls ;
		
		 var request = [] ;
		 var testgroup = getTestGroup() ;
		 var counter = 0 ;
		 var baseUrlidx ;
		 
		 for(var i = 0 ; i< urls.length ; i++)
		 {   
	         //Pick only selected checkbox
			 if(urls[i].select == false){ continue;}
			 counter++ ;
			 var data = { "TGROUP" :" ", "TCASE" : "", "METHOD" : "",	 "REQUESTHEADER" : "", "REQUEST_DATA":"" , "REQUEST_URI" : "" , "REUSE_CONNECTION" : " "} ;
			 data.TGROUP = testgroup ;
			 data.TCASE = (counter).toString().concat(' -  ').concat(urls[i].Method);
			 data.METHOD =  urls[i].Method ;
			 data.REQUEST_URI =  urls[i].URL ;
			 
			 baseUrlidx= data.REQUEST_URI.indexOf('/sap/opu/odata') ;
			 data.REQUEST_URI = data.REQUEST_URI.substring( baseUrlidx );
			 
			 //Javascrit HEADER is ""name-value"" pair,, abap expects "NAME-VALUE" in uppercase
			 //not needed anymore --> still cross check
			 for(var j = 0 ; j<  urls[i].reqHeader.length ; j++){
				 var headerdata = {"NAME":urls[i].reqHeader[j].name ,"VALUE" :urls[i].reqHeader[j].value };
				 if(data.REQUESTHEADER === ""){
					 data.REQUESTHEADER = [];
				 }
				 data.REQUESTHEADER.push(headerdata);
			 }
			 
			 if( data.METHOD == 'POST'){
			 data.REQUEST_DATA =  urls[i].postdata.text ;
			 }
		
			request.push( data  );
		 
		 }
		 
		var data = JSON.stringify({ "jsonrpc" :  "2.0" ,  "method" : "RFC.ZFM_CREATE_GW_TEST_CASES" ,  "id":  1 , "params": {"IT_TEST_CASE_DATA" : request} }) ;
    	return data ;
   }
   function showResponsefromServer(response){
	   
	   if(response.type == 'error'){
		   prepareError(response);
	   }
	   else if (response.type == 'success'){
		    prepareSuccess(response);
	   }
	   
	}
   function prepareError(error){
	   
	  var errString = 
	  "<div>" + "<strong style=\"color: red;\">Error : </strong>"  + error.errorText +"</div>" ;
	  console.log(error.response); 
	  var dvTable = $("#dvTable");
      dvTable.html("");  
	  dvTable.append( errString ); 
	  

   }
   
   function prepareSuccess(response){
	   // Response Data from the server 
		var responseData = response.response.result.ET_TEST_CASE_DATA ;
		
		
		var gwResponse = new Array();
        gwResponse.push(["Test Group", "Test Case", "Method" ,"Status", "Status Description", "URL"]);
		for(var i = 0 ; i<  responseData.length ; i++){
			gwResponse.push([responseData[i].TGROUP , responseData[i].TCASE,responseData[i].METHOD,responseData[i].STATUS,responseData[i].STATUS_TEXT,responseData[i].REQUEST_URI]);
		}
 
        //Create a HTML Table element.
        var table = $("<table />");
        table[0].border = "1";
 
        //Get the count of columns.
        var columnCount = gwResponse[0].length;
 
        //Add the header row.
        var row = $(table[0].insertRow(-1));
        for (var i = 0; i < columnCount; i++) {
            var headerCell = $("<th />");
            headerCell.html(gwResponse[0][i]);
            row.append(headerCell);
        }
 
        //Add the data rows.
        for (var i = 1; i < gwResponse.length; i++) {
            row = $(table[0].insertRow(-1));
            for (var j = 0; j < columnCount; j++) {
                var cell = $("<td />");
				if(j == 3){
					if(  gwResponse[i][j] == 'failed' )
					{
						cell.html( "<strong style=\"color: red;\">" + gwResponse[i][j]  + "</strong>");
					}
					else{
						cell.html("<strong style=\"color: green;\">" + gwResponse[i][j]  + "</strong>");
					}
					
				}
				
				else {
					cell.html( gwResponse[i][j]  );
				}
                
                row.append(cell);
            }
        }
 
        var dvTable = $("#dvTable");
        dvTable.html("");
        dvTable.append(table);
		
	   
   }
   function   pushtoGw(){
	   var scope = angular.element('[ng-controller="mycontroller"]').scope();
	   $('#dvTable').empty() ;
		
	   gwSystem = { url: scope.gwSystem , client : scope.gwClient };
	   var data =  prepareData() ;
	  
	   chrome.extension.sendMessage({
            url: gwSystem.url ,
			client : gwSystem.client , 
			request: data
        }, function(response) { 
		      showResponsefromServer(response);
		});
   }
		

	function requestFinished(request){
	 			   
			    isUrl =  /^https?:\/\//i.test(request.request.url);
				if (isUrl)
				{   var odata = /sap\/opu\/odata/i;
					isGWOdataUrl =  odata.test(request.request.url);
					if (isGWOdataUrl != true)
						return;
					
				}
		        
				if ( isUrl && isGWOdataUrl )
			    {
			    console.log('Update List with new url');
				 var scope = angular.element('[ng-controller="mycontroller"]').scope();
				 scope.addNewRequest(request);
				 scope.$apply();
				
				return;
				}
			}
			
		
	window.addEventListener('load', initEvents);
})();

//Angular Controller
function mycontroller($scope){
	
	    $scope.counter= 1;
		$scope.urls = [];
		$scope.gwSystem = [];
		$scope.gwClient = "";  
		$scope.gwSystem = "";  
		$scope.testGroup = "TEST-X-1";
		 
	 
		$scope.addNewRequest=function(request){
            $scope.urls.push({select : true, id: $scope.counter ,  URL : request.request.url , Method:request.request.method , reqHeader: request.request.headers , postdata:request.request.postData });
			$scope.counter = $scope.counter + 1;
        }
		
		$scope.clear=function(){
            $scope.urls= [];
			$scope.counter = 1;
        }
		
		$scope.setClient=function(client){
			
			$scope.gwClient = client ;
		}
		
		$scope.setGWsystem=function(GWsystem){
			
			$scope.gwSystem = GWsystem ;
		}
}		

