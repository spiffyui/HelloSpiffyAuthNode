This is an example of a [Spiffy UI](http://www.spiffyui.org) project that runs on [Node.js](http://nodejs.org/) and requires authentication for REST requests.  The Node server authenticates, provides the REST layer, as well as serves the static files.  It does not require any Node frameworks.

This project is built with [Apache Ant](http://ant.apache.org/) using [Apache Ivy](http://ant.apache.org/ivy/) and runs against [Node.js](http://nodejs.org/).  Once you've installed Ant and Node.js go to your project's root directory and run these commands:

        <ANT HOME>/ant
        <NODE_HOME>/node HelloSpiffyAuthNode.js
        
The former will download Apache Ivy and other required libraries and build your project. The latter will start your server and provide instruction on how to access it.

For more information on this project, please see [Running Spiffy UI with Node.js](http://www.zackgrossbart.com/hackito/spiffy-nodejs).
