/*
 * Load modules
 */
var sys = require('sys'),  
    http = require('http'),  
    url = require('url'),  
    path = require('path'),  
    fs = require('fs');  

/*
 * Constants
 */
var port = 8181;
var targetDir = '/target/www';
var i18nDir = '/js/lib/i18n/';
var authUri = '/auth';

/*
 * Our HelloSpiffyAuthNode object defines our server and routines it needs
 * to deliver our client and respond to REST requests.
 */
var HelloSpiffyAuthNode = {
    resources: null,
    tokens: [],

    init: function() {
        /*
         * Now we do a little sanity check to make sure the client is built before
         * we try to run the server.
         */
        var targetDirFull = path.join(process.cwd(), targetDir);
        path.exists(targetDirFull, function(exists) {
            if (exists) {
                HelloSpiffyAuthNode.runServer();
            } else {
                sys.puts('========================================================================\n');
                sys.puts('You have to build the Spiffy UI client before running the server.\n');
                sys.puts('Run the ant in the current directory and then run the server again.\n');
                sys.puts('========================================================================\n');
            }
        });
    },

    /**
     * Start the server
     */
    runServer: function() {
        /*
         * Create the HTTP server
         */
        var server = http.createServer(function(request, response) {  
            /*
             * Handle based on the URI
             */
            var uri = url.parse(request.url).pathname;
            
            /*
             * Try to find a static file that matches the 
             * current working directory/target/www/file name
             * 
             * (process.cwd() gets the current working directory)
             */
            var filename = path.join(process.cwd(), targetDir, uri);  
            path.exists(filename, function(exists) {  
                /*
                 * If there's no file, it could be the REST call,
                 * the auth call, 
                 * an internationalized date JavaScript file, or
                 * 404
                 */
                if (!exists) {  
                    if (uri.indexOf('/simple/') === 0) {
                    	/*
                    	 * This is the REST call!
                    	 * Check that the request is authorized.
                    	 */
                    	if (HelloSpiffyAuthNode.isAuth(request.headers['authorization'])) {
                            /*
                             * Authorized!
                             */
                        	var user = uri.substring(8);
                            var userAgent = request.headers['user-agent'];
                            var payload = {user: user, 
                                           userAgent: userAgent, 
                                           serverInfo: 'Node.js'};                                        
                            response.writeHeader(200, {'Content-Type': 'application/json'});  
                            response.end(JSON.stringify(payload));  
                            return;            		
                    	} else {
                    		/*
                    		 * Return the unauthenticated NCAC Fault and include the header for authentication
                    		 */
                    		response.writeHeader(401, {'Content-Type': 'application/json', 
                    			'WWW-Authenticate': 'X-OPAQUE uri="http://localhost:' + port + authUri +'", signOffUri=""'});  
                    		var ncacFault = {'Fault': {'Code': {'Value': 'Sender', 'Subcode': {'Value': 'NoAuthHeader'}}, 'Reason': {'Text':''}}};
                    		response.end(JSON.stringify(ncacFault)); 
                    		return;
                    	}
                    } else if (uri === authUri) {
                    	/*
                    	 * This is either a POST to authenticate, or DELETE to logout
                    	 */
                    	if (request.method === 'POST') {
                        	/*
                        	 * Any username and password combination is fine, return the token, which is just the timestamp
                        	 */
                    		var token = '' + new Date().getTime()
                        	var json = {'Token': token};
                    		HelloSpiffyAuthNode.tokens.push(token);
                        	response.writeHeader(200, {'Content-Type': 'application/json'});  
                        	response.end(JSON.stringify(json)); 
                    		return;            		
                    	} else if (request.method === 'DELETE') {
                    		var authHeader = request.headers['authorization'];
                    		HelloSpiffyAuthNode.removeToken(authHeader);
                    		response.writeHeader(200, {'Content-Type': 'application/json'});  
                    		var json = {'Status': 'OK'};
                    		response.end(JSON.stringify(json));
                    		return;
                    	}                        
                    } else if (uri === i18nDir + 'date' || uri === i18nDir + 'jquery.ui.datepicker.js') {
                        /* 
                         * This is a internationalized file request!
                         */
                        var resource  = HelloSpiffyAuthNode.getI18nDateResource(request, uri);
                        filename = path.join(process.cwd(), targetDir, i18nDir, resource);
                        /*
                         * Do not return -- let it get the correct i18n date file below
                         */
                        
                    } else {
                        /*
                         * 404!
                         */
                        response.writeHeader(404, {'Content-Type': 'text/plain'});  
                        response.end('404 Not Found\n'); 
                        return;
                    }
                }  
                
                /*
                 * Serve up the static file that is in /target/www
                 */
                
                if (filename.match('/www/$') !== null) {
                    // Then this is a request for the root and we'll return the index.html file
                    filename += 'index.html';
                }
                        
                fs.readFile(filename, 'binary', function(err, file) {  
                    if(err) {  
                        response.writeHeader(500, {'Content-Type': 'text/plain'});  
                        response.end(err + '\n');  
                        return;  
                    }  
                    
                    response.writeHeader(200);  
                    response.write(file, 'binary');  
                    response.end();  
                }); //end fs.readFile callback
            }); //end path.exists callback
        }); 
    
        /*
         * Load all the internationalized resources by reading the i18n directory
         */
        fs.readdir(path.join(process.cwd(), targetDir,  i18nDir), function(err, files) {
            HelloSpiffyAuthNode.resources = files;
            
            /*
             * After resources are retrieved then the server can listen
             */
            server.listen(port);
            
            sys.puts('========================================================================\n');
            sys.puts('Access Hello Spiffy Auth Node at http://localhost:' + port + '\n');
            sys.puts('========================================================================\n');
        
        });
    },

    /**
     * Return the internationalized date file name
     * @param request - the http request
     * @param uri - the uri of the request
     * @returns {String} - the file name
     */
    getI18nDateResource: function(request, uri) {
        var resourceName = uri.substring(uri.lastIndexOf('/') + 1);
        
        if (resourceName.match('.js$') !== null) {
            /*
             * We start by taking the .js file extension off of the
             * filename
             */
            resourceName = resourceName.substring(0, resourceName.length - 3);
        }

        /*
         * Check for the file with the matching locale
         */
        var langs = request.headers['accept-language'];
        var locales = langs.split(',');
        var i = 0;

        for (i = 0; i < locales.length; i++) {
            var locale = locales[i];
            /*
             * Trim off ";q=0.3", if exists
             */
            var loc = locale.indexOf(';') > 0 ? locale.substring(0, locale.indexOf(';')) : locale;
            
            /*
             * Capitalize the country to match file name, if exists
             */
            var langCountry = loc.split('-');
            if (langCountry.length === 2) {
                langCountry[1] = langCountry[1].toUpperCase();          
                //rejoin loc
                loc = langCountry.join('-');
            }
            
            var resource = resourceName + '-' + loc + '.js';
            if (HelloSpiffyAuthNode.resourceExists(resource)) {
                return resource;
            } else {
                /*
                 * Try just on country
                 */
                resource = resourceName + '-' + langCountry[0] + '.js';
                if (HelloSpiffyAuthNode.resourceExists(resource)) {
                    return resource;
                }
            }
            /*
             * Hasn't found a match, so try next locale
             */
        }
        /*
         * No matches, return default
         */
        return resourceName + '-en.js';
    },

    /**
     * Check if the resource is in the resources 
     * @param resource to test
     * @returns {Boolean} true if found
     */
    resourceExists: function(resource) {
        var i = 0;
        for (i = 0; i < HelloSpiffyAuthNode.resources.length; i++) {
            if (HelloSpiffyAuthNode.resources[i] === resource) {
                return true;
            }
        }
        return false;
    },
    
    /**
     * Check if the auth header is in the tokens
     * @param authHeader which should be X-OPAQUE plus the token
     * @returns {Boolean} true if found
     */
    isAuth: function(authHeader) {
    	var i = 0;
    	if (authHeader != null) {
    		for (i = 0; i < HelloSpiffyAuthNode.tokens.length; i++) {
    			if ('X-OPAQUE ' + HelloSpiffyAuthNode.tokens[i] === authHeader) {
    				return true;
    			}
    		}
    	}
    	return false;
    },
    
    /**
     * Removes the token in the authHeader from tokens
     * @param authHeader is X-OPAQUE plus the token
     */
    removeToken: function(authHeader) {
    	if (authHeader != null) {
    		for (i in HelloSpiffyAuthNode.tokens) {
    			if ('X-OPAQUE ' + HelloSpiffyAuthNode.tokens[i] === authHeader) {
    				HelloSpiffyAuthNode.tokens.splice(i, 1);
    				return;
    			}
    		}
    	}
    }
};

/*
 * Now that we've defined everything we need the last step is to 
 * start our server.
 */
HelloSpiffyAuthNode.init();
