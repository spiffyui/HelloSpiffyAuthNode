SpiffyAuthNode is built with [Apache Ant](http://ant.apache.org/) using [Apache Ivy](http://ant.apache.org/ivy/) and runs against [Node.js](http://nodejs.org/).  Once you've installed Ant and Node.js go to your project's root directory and run these commands:

        <ANT HOME>/ant run
        <NODE_HOME>/node SpiffyAuthNode.js
        
This will download Apache Ivy and the other the required libraries, build your project, and run it with an embedded Jetty web server.  This is an example of a Spiffy project that requires authentication for REST requests.  The node server authenticates, provides the REST layer, as well as serves the static files.  It does not require any Node frameworks.
