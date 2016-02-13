CMX e911 App
============

* Make sure you have installed REDIS and Mongo on the box this application will be running on
* In one terminal type **npm start**
* In another terminal type **npm run mongo-express** -- mongo-express is a Mongo DB web admin interface. Default username and password is admin / admin
* In another terminal type **node listener.js** and create a CMX Movement Notification and point to the IP of your machine.
At this point the listener will grab the streams it is recieveing from CMX and insert them into REDIS.
* App is accessible at http://localhost:3000/
* Mongo Express is accessible at http://localhost:4145/

Development
============

* Run *nodemon* to monitor any changes we have made to the code and have it reload.
* Run *LiveReload* app on your computer and have it connect to Chrome with the LiveReload extension so the pages can be refreshed.
* Run *redis-server* (alias we have created) to run Redis locally.
* Run *mongo* (alias we have created) to run Mongo locally.
* Run *npm run mongo-express* to have the admin website for Mongo to load.
* Run *redis-cli* to load the Redis cli.
* Run *grunt watch* to look for changes in grunt.
