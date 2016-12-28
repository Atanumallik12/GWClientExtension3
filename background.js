(function() {
console.log('hello');

chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
    
	if(message.client == "") {
		
		gwUrl = message.url + '/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/' ;
	}
    else{ 
		gwUrl = message.url + '/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/' +'?sap-client=' + message.client ;
	}
	console.log(gwUrl);
	var xsrftoken;
	_this = this;
// Get XSRF Token and check is system is reachable	
   

	$.ajax({    async: true,  
			    url: gwUrl ,
                type: "GET"	,
				context: _this ,
				beforeSend: function(xhr){ 
				     xhr.setRequestHeader('X-CSRF-Token', 'Fetch');
					 if( message.userid != "" && message.password != "" ){
						 
						 var tok = message.userid + ':' + message.password;
                         var hash = btoa(tok);
                         
						 
						 xhr.setRequestHeader('Authorization' , "Basic " + hash ) ;
					 }
					 
					 },
				success: function(res, status, xhr) {
					console.log("response: ");					
					console.log(res);
					
					console.log("status: ");					
					console.log(status);
					
					
					console.log("XHR: ");					
					console.log(xhr);
					
					console.log("Response Headers: XSRF Token ");
					console.log(xhr.getResponseHeader('X-CSRF-Token'));
					
					this.xsrftoken = xhr.getResponseHeader('X-CSRF-Token') ;
					//Use Promise
					postData2GW();
				},
				error: function(err) {
					sendResponse({
						type:'error', 
						response: { responseText : err.responseText , status :  err.status , statusText : err.statusText} ,
						errorText: 'Failed to connect ' +  gwUrl + '; check console for details!'
					});
					 
				}
				}) ;
				
				
	
	
	function postData2GW(){
		
		if ( this.xsrftoken.length == 0)	 { console.log("XSRF Token fetch failed"); }
//Make the JSON RPC call
		if(message.client == "") {
		    gwUrl = message.url + '/sap/gw/jsonrpc' ;
		}
		else{ 
		    gwUrl = message.url + '/sap/gw/jsonrpc' + '?sap-client=' + message.client ;
			}
		console.log( gwUrl);
		
		 _this = this; 
		  if( message.userid != "" && message.password != "" ){
						 
		 var tok = message.userid + ':' + message.password;
		 var hash = btoa(tok); }
		 this.gwauthtok = null ; 
		 this.gwauthtok = hash ;
		 
		 var oData =   message.request ;   
		 $.ajax({    async: true,  
			    url: gwUrl ,
                type: "POST"	,
				context: _this,
				data: oData ,
				beforeSend: function(xhr){
					xhr.setRequestHeader('X-CSRF-Token',  this.xsrftoken );
					xhr.setRequestHeader('Content-Type','application/json');
					if(this.gwauthtok != null ){
					xhr.setRequestHeader('Authorization' , "Basic " + this.gwauthtok  ) ;
					}
					},
				success: function(res, status, xhr) {
					console.log("response: ");					
					console.log(res);
					
					console.log("status: ");					
					console.log(status);
					
					
					console.log("XHR: ");					
					console.log(xhr);
									
					sendResponse({
						type:'success', 
						response:res 
					});

				},
				error: function(err) {
					sendResponse({
						type:'error', 
						response:err ,
						errorText: 'Failed to Create Test Group via URL  ' +  gwUrl + '; check console for details!'
					});
				}
				}) ;

		
	}
	
   
	
    return true;
});
})();