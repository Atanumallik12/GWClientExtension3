'use strict';

angular.module('gwtcbuilder.app').
  controller('MainController', ['$scope',MainController]);

	function MainController($scope) {
		
			$scope.mainCtrlVal = {
							"selectDeselectAll" : false,
							"urls" : [],
							"selectedOdataUrlDetail" : {
														"reqHeader" : []
														},
							"gwClient" : "",
							"gwSystem" : "",
							"testGroup" : "TEST-X-2",
							"errorText" : "",
							"showErrorStatus" : "false",
							"counter" : 1 ,
							"excludeNotificationOData": true ,
							"userid":"",
							"password":""
			};
			
			
			
			$scope.testCaseResponseTable = [];
			
					
		var initEvents = function () {
		
			debugger;
			chrome.devtools.network.onNavigated.addListener($scope.resetList);
			chrome.devtools.network.onRequestFinished.addListener($scope.requestFinished);
		};
		
		var detectGWSystem = function (){
	   
			var urls = $scope.mainCtrlVal.urls;
			var gwSystem = []; 
			var gwSystemAss = []; 
			var sysaddr ;
			//in loop
			for (var x = 0; x < urls.length; x++) {
				sysaddr = urls[x].URL.slice(0, urls[x].URL.indexOf('/sap/opu/odata')) ;
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
			
		};
		 
		var getTestGroup = function (){
			
			return $scope.mainCtrlVal.testGroup ;
			
		} ;
	    function prepareData(excludeNotiOdata){
	     
			 var urls = $scope.mainCtrlVal.urls ;
			
			 var request = [] ;
			 var testgroup = getTestGroup() ;
			 var counter =  0 ;
			 var baseUrlidx ;
			 var checkNotifOdata = -1 ;
			 var excludeNotificationOData	 = $scope.mainCtrlVal.excludeNotificationOData ;
			 	 
			 for(var i = 0 ; i< urls.length ; i++)
			 {   
				 //Pick only selected checkbox
				 if(urls[i].select == false){ continue;}
				 if ( excludeNotificationOData == true) {
				 checkNotifOdata = urls[i].URL.indexOf('/sap/opu/odata4/iwngw') ;
				 {
					 if (checkNotifOdata != -1 ) {
						 "If found"
						 checkNotifOdata = -1 ;
						 continue;
					 }
					
				 }
				 }
			 
				 counter++ ;
				 
				 var str = "" + counter
				 var tcasePrefix = "000".substring(0, 3 - str.length) + str
				 
				 var data = { "TGROUP" :" ", "TCASE" : "", "METHOD" : "",	 "REQUESTHEADER" : "", "REQUEST_DATA":"" , "REQUEST_URI" : "" , "REUSE_CONNECTION" : " "} ;
				 data.TGROUP = testgroup ;
				 data.TCASE = tcasePrefix.concat(' -  ').concat(urls[i].Method);
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
				 data.REQUEST_DATA =   urls[i].postdata == undefined? "": ( urls[i].postdata.text == undefined ?"": urls[i].postdata.text);
				 }
			    
				
				request.push( data  );
			     
			 }
			 
			if(request.length == 0 ){
				var error = {errorText : "Selection could not be determined"};
				
				prepareError(error) ;
				return;
			}
			 
			var data = JSON.stringify({ "jsonrpc" :  "2.0" ,  "method" : "RFC.ZFM_CREATE_GW_TEST_CASES" ,  "id":  1 , "params": {"IT_TEST_CASE_DATA" : request} }) ;
			return data ;
		};
		
		var showResponsefromServer = function(response){
	   
			   if(response.type == 'error'){
				   prepareError(response);
			   }
			   else if (response.type == 'success'){
					prepareSuccess(response);
			   }
	   
		};
		var prepareError = function(error){
			 
			  
			  
			  if(error.response != undefined  ){
				 if( error.response.status  != undefined ){
				$scope.mainCtrlVal.errorText = $scope.mainCtrlVal.errorText +  " Status: " +error.response.status  ;
				}
				 if( error.response.statusText != undefined ){
					 $scope.mainCtrlVal.errorText = $scope.mainCtrlVal.errorText +  "  Status Text: " +error.response.statusText ;
				 }
				
				if( error.response.responseText != undefined ){
				   
				   console.log(error.response.responseText);
				
				}
			  }
			  
			  $scope.mainCtrlVal.errorText = $scope.mainCtrlVal.errorText + "  " + error.errorText;
			  
			  if(error.errorText !== ""){
				   $scope.mainCtrlVal.showErrorStatus = "true";
			  }else{
				   $scope.mainCtrlVal.showErrorStatus = "false";
			  }
			 
			  

		};
		var prepareSuccess = function(response){
		   
		   //Check IF there is some error from JSON RPC
		   if(response.response.error != undefined) {
			   prepareError({  errorText : response.response.error.message });
			   return ;
		   }
		   
		   // Response Data from the server 
			var responseData = response.response.result.ET_TEST_CASE_DATA ;
			
			
			var gwResponse = [] ;
			//gwResponse.push(["Test Group", "Test Case", "Method" ,"Status", "Status Description", "URL"]);
			
			
			
			for(var i = 0 ; i<  responseData.length ; i++){
				var tmpResponse = responseData[i];
				//gwResponse.push([responseData[i].TGROUP , responseData[i].TCASE,responseData[i].METHOD,responseData[i].STATUS,responseData[i].STATUS_TEXT,responseData[i].REQUEST_URI]);
				gwResponse.push(
											{
												"TestGroup" :tmpResponse.TGROUP, 
												"TestCase" : tmpResponse.TCASE , 
												"Method" : tmpResponse.METHOD,
												"Status" :	tmpResponse.STATUS, 
												"StatusDescription" : tmpResponse.STATUS_TEXT, 
												"URL" : tmpResponse.REQUEST_URI
											}
								);
			}
			$scope.testCaseResponseTable = gwResponse;
			$scope.mainCtrlVal.errorText = "";
			$scope.mainCtrlVal.showErrorStatus = false;
			$scope.$apply();
			
	   
		};
		
			

		$scope.resetList = function() {
			console.log("clear");
			$scope.clear();
		};
		
		
		$scope.downloadTestCase = function(){
			console.log("Download GW Test Case");
			var counter =  0 ;
			var testgroup = getTestGroup() ; 
			var urls = $scope.mainCtrlVal.urls ;
			var excludeNotificationOData	 = $scope.mainCtrlVal.excludeNotificationOData ;
			var checkNotifOdata = -1 ;
			var itemTestCase = null ;
			var itemData = {TESTGROUP:  "", TESTCASE: ""  , CHANGED_BY: "", CHANGED_AT: "", METHOD: "" , REQUEST_URI: "" , REQUEST_DATA:  "" };
			
			var testcaseXML = null ; 
			var itemXML  = null ;
			error = {errorText : "No OData call Selected"};
			prepareError(error) ;
				 
				 
			 for(var i = 0 ; i< urls.length ; i++)
			 {   
				 //Pick only selected checkbox
				 if(urls[i].select == false){ continue;}
				 
				 if ( excludeNotificationOData == true) {
				 checkNotifOdata = urls[i].URL.indexOf('/sap/opu/odata4/iwngw') ;
				 {
					 if (checkNotifOdata != -1 ) {
						 "If found"
						 checkNotifOdata = -1 ;
						 continue;
					 }
					
				 }
				 }
				 
				 
			 
				 counter++ ;
				 itemData = getTestCaseForItem(counter ,  testgroup,   urls[i]);
				 if(itemXML == null) { 
				 itemXML = '<item><TESTGROUP>' + itemData.TESTGROUP +'</TESTGROUP><TESTCASE>' + itemData.TESTCASE + '</TESTCASE><CHANGED_BY>' + itemData.CHANGED_BY+'</CHANGED_BY>'+
				           '<CHANGED_AT>'+ itemData.CHANGED_AT +'</CHANGED_AT><METHOD>'+ itemData.METHOD +'</METHOD><REQUEST_URI>'+ itemData.REQUEST_URI+'</REQUEST_URI>'
						   +'<REQUEST_DATA>'+itemData.REQUEST_DATA+'</REQUEST_DATA>'+'</item>'; 
				 }
				 else
				 {
					  itemXML =  itemXML + '<item><TESTGROUP>' + itemData.TESTGROUP +'</TESTGROUP><TESTCASE>' + itemData.TESTCASE + '</TESTCASE><CHANGED_BY>' + itemData.CHANGED_BY+'</CHANGED_BY>'+
				           '<CHANGED_AT>'+ itemData.CHANGED_AT +'</CHANGED_AT><METHOD>'+ itemData.METHOD +'</METHOD><REQUEST_URI>'+ itemData.REQUEST_URI+'</REQUEST_URI>'+ 
						    +'<REQUEST_DATA>'+itemData.REQUEST_DATA+'</REQUEST_DATA>'+'</item>'; 
				 }
				 
			 }	 
			 

			 
			 testcaseXML  = '<TEST_CASES>'  +   itemXML + '</TEST_CASES>' ;
			 
			 //Currently downloading a test group is not possible, we need to investigate further.
			 // The major issue is in backend we expecting the content of getTestCaseForItem()in BYPE MODE
			  var error = null ;
			 if(counter == 0) {
				 
				 error = {errorText : "No OData call Selected"};
				 prepareError(error) ;
				 return;
			 }else if(counter > 1){
				   error = {errorText : "Due to limitations only one call can be downloaded at once"};
				 prepareError(error) ;
				 return;
			 } 
			 download( testcaseXML ,  "RANDOM"+".XML" );
			
			
		};		

        var getTestCaseForItem = function( counter , testGroup , url ){
			
			
				 var str = "" + counter
				 var tcasePrefix = "000".substring(0, 3 - str.length) + str ;
				 
				 var data = { "TGROUP" :" ", "TCASE" : "", "METHOD" : "",	 "REQUESTHEADER" : "", "REQUEST_DATA":"" , "REQUEST_URI" : "" , "REUSE_CONNECTION" : " "} ;
				 data.TGROUP = testGroup ;
				 data.TCASE = tcasePrefix.concat(' -  ').concat(url.Method);
				 data.METHOD =  url.Method ;
				 data.REQUEST_URI =  url.URL ;
				 
				 var baseUrlidx= data.REQUEST_URI.indexOf('/sap/opu/odata') ;
				 data.REQUEST_URI = data.REQUEST_URI.substring( baseUrlidx );
				 
				 
				 var counter =  0 ;
			 var urls = $scope.mainCtrlVal.urls ;
			 var req_start = '<REQUEST_DATA>' ;
			 var req_end = '</REQUEST_DATA>' ;
			 var header_start = '<HTTP_HEADER>';
			 var header_end = '</HTTP_HEADER>' ;
			 var sutil_start ='<_-IWFND_-SUTIL_PROPERTY>' ;
			 var sutil_end ='</_-IWFND_-SUTIL_PROPERTY>'  ;
			 var name_start = '<NAME>' ;
			 var name_end= '</NAME>' ;
			 var value_start = '<VALUE>' ;
			 var value_end= '</VALUE>' ;
			 var http_body_start = '<HTTP_BODY>' ;
			 var http_body_end = '</HTTP_BODY>' ;
			 var http_method_header = '~request_method' ;
			 var http_url_header = '~request_uri' ;
			 
			 var xmlstring = null ;
			 var headerString = null ;
			 var headeritem = null ;
			 
			 xmlstring  = req_start + header_start  ;

			 
			 for(var j = 0 ; j<  url.reqHeader.length ; j++){
				 if(  url.reqHeader[j].name  == "X-XHR-Logon"  ||  url.reqHeader[j].name  == "SAP-PASSPORT"  
				      || url.reqHeader[j].name  == "Cookie"  ||  url.reqHeader[j].name  == "SAP-Perf-FESRec-opt"
					  || url.reqHeader[j].name  == "x-csrf-token"  ||  url.reqHeader[j].name  == "sap-cancel-on-close"
					  || url.reqHeader[j].name  == "SAP-Perf-FESRec"  ||  url.reqHeader[j].name  == "Connection"
					  || url.reqHeader[j].name  == "Host"  ||  url.reqHeader[j].name  == "User-Agent"
					  || url.reqHeader[j].name  == "Referer"  || url.reqHeader[j].name  == "Origin"
					  )
					  
					  
					  
				     {continue; }
					 var headerdata = {"NAME":url.reqHeader[j].name ,"VALUE" :url.reqHeader[j].value };
					 
					 if(headeritem == null) {
					 headeritem =  sutil_start +   name_start 
					               +  headerdata.NAME  + 
								   name_end + value_start 
								   +  headerdata.VALUE + 
								   value_end  + sutil_end ;
					 }
					 else
						 headeritem = headeritem + sutil_start +   name_start 
					               +  headerdata.NAME  + 
								   name_end + value_start 
								   +  headerdata.VALUE + 
								   value_end  + sutil_end ;
					 
			}
			 
			 
			 headeritem =    headeritem + sutil_start +   name_start 
					               +  http_method_header  + 
								   name_end + value_start 
								   +  data.METHOD  + 
								   value_end + sutil_end ;
								   
								   
			 headeritem =    headeritem + sutil_start +   name_start 
					               +  http_url_header  + 
								   name_end + value_start 
								   +   data.REQUEST_URI   + 
								   value_end  + sutil_end;
								   				   
			 headeritem =  headeritem + header_end ;
             xmlstring = xmlstring + 	headeritem ;
			  
			 var post_data =  null; 
			 if( url.postdata != undefined ) { 
				post_data =  url.postdata.text  ;
			 }
			 
             if( post_data != null  ||  post_data != undefined) { 
			 xmlstring =  xmlstring  + http_body_start +  url.postdata.text + http_body_end; 
			 }
			 else
				   xmlstring =  xmlstring  + http_body_start + http_body_end; 
			 

			 
			 xmlstring =  xmlstring + 	 req_end ;
			 
			 
			 return  ({TESTGROUP:  data.TGROUP, TESTCASE: data.TCASE  , CHANGED_BY: "", CHANGED_AT: "20161227060301", METHOD: data.METHOD , REQUEST_URI: data.REQUEST_URI , REQUEST_DATA:  xmlstring });
			 
			
			
		} 	;

       var download = function (text, name ) {
       var a = document.getElementById("DownloadFile");
       var file = new Blob([text], {type: "plain/text"});
       a.href = URL.createObjectURL(file);
       a.download = name;
       } ;
	   
		$scope.pushtoGw = function(){
			console.log("pushtoGw");
			//$scope.mainCtrlVal.errorText = "";
			var gwSystem = { url: $scope.mainCtrlVal.gwSystem , client : $scope.mainCtrlVal.gwClient , userid: $scope.mainCtrlVal.userid, password:$scope.mainCtrlVal.password };
			var excludeNotificationOData	 = $scope.mainCtrlVal.excludeNotificationOData ;
			$scope.testCaseResponseTable = [];
			var data =  prepareData(excludeNotificationOData) ;
			if(data == null || data == undefined ) { return; }
			if(data.length == 0 ){
				return;
			}
		    
			if( $scope.mainCtrlValgwSystem == undefined || $scope.mainCtrlValgwSystem.url == undefined) {
				
		  
			$scope.setClient(gwSystem.client) ;
			 ;
			if(gwSystem.url === ""){
				gwSystem = detectGWSystem();
				$scope.setGWsystem(gwSystem.url) ;
			}
			
	
		    
			}
		   
			chrome.extension.sendMessage({
					url: gwSystem.url ,
					client : gwSystem.client , 
					request: data ,
					userid: gwSystem.userid,
					password:gwSystem.password 
				}, function(response) { 
						showResponsefromServer(response);
					}
			);
		};
		$scope.determineGWSystem = function(){
			console.log("determineGWSystem");
			var gwSystem = detectGWSystem();
			$scope.setClient(gwSystem.client) ;
			$scope.setGWsystem(gwSystem.url) ;
		};
		$scope.requestFinished = function(request){
	 			   
			   var isUrl =  /^https?:\/\//i.test(request.request.url);
			   var odata = /sap\/opu\/odata/i;
			   var notifPattern = /sap\/opu\/odata4\/iwngw\/notification/i ;
			   var isGWOdataUrl;
			   var excludeNotificationOData	 = $scope.mainCtrlVal.excludeNotificationOData ;
			   
			   if (isUrl)
				{   
					isGWOdataUrl =  odata.test(request.request.url);
					if (!isGWOdataUrl)
						return;
					
				}
				
				if( excludeNotificationOData == true )
					
				{
						if( notifPattern.test(request.request.url) == true){
						 return  ;
						}
				}
		        
				if ( isUrl && isGWOdataUrl )
			    {
					console.log('Update List with new url');
				 
				 $scope.addNewRequest(request);
				 $scope.$apply();
				
				return;
				}
		};
			
		$scope.addNewRequest=function(request){
			var selectAll	 = $scope.mainCtrlVal.selectDeselectAll  == true ? true : false;
			
            $scope.mainCtrlVal.urls.push({select : selectAll, id: $scope.counter ,  URL : request.request.url , Method:request.request.method , reqHeader: request.request.headers , postdata:request.request.postData });
			$scope.mainCtrlVal.counter = $scope.mainCtrlVal.counter + 1;
        };
		
		$scope.clear = function(){
            $scope.mainCtrlVal.urls= [];
			$scope.mainCtrlVal.counter = 1;
			$scope.$apply();
        };
		
		$scope.setClient=function(client){
			
			$scope.mainCtrlVal.gwClient = client ;
		};
		
		$scope.setGWsystem=function(GWsystem){
			
			$scope.mainCtrlVal.gwSystem = GWsystem ;
		};
		$scope.getOdataCallDetails = function(index){
			console.log(index);
			var odataDetailResponse = $scope.mainCtrlVal.urls[index];
			$scope.mainCtrlVal.selectedOdataUrlDetail = odataDetailResponse;
		};
		$scope.toggleUrlCheckBoxes = function(){
			var state = false;
			if($scope.mainCtrlVal.selectDeselectAll){
				state = true
			}
			else{
				state = false;
			}
			for(var i = 0 ; i<  $scope.mainCtrlVal.urls.length ; i++){
				var url = $scope.mainCtrlVal.urls[i];
				url.select = state;
				
			}
		};
		$scope.showErrrorStatus = function(){
			if($scope.mainCtrlVal.errorText == ''){
				return false;
			}
			return true;
		};
		
		initEvents();
}
