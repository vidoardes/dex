## Dex
### Keep track of your little monsters

A simple app that allows you to track and maintain a list of Pokemon, including any variants in a easy to read and sharable format.

Built using Python 3.7

### Requirements
* Python v3.7+
* PostgreSQL v10+
* Node v10+
* NPM v3.1+

### Project Setup  
First you will need to create you virtual environment, so open once you have checked out the repo open a terminal window and create a new directory in the root of your project:

> python -m venv env

Once created you can activate it and install the requirements:

> pip install -r requirements.txt  
npm install
 
 You will need to run a debug mail server in your test environment, which can be done with the following command:

 > python -m smtpd -n -c DebuggingServer localhost:8025
 
 and you will need to create a database called `dex` with the user role and password `dex:test` (or change the connection string in the example config). Once availible you can then run the following commands to create the empty tables.
 
 > flask db init  
 flask db migrate  
 flask db upgrade
 
 Once all of the above is complete, you are ready to run the site!  Simply type`python -m dex` and `gulp` to get started.
 
 **Please note**: Due to potential copyright issues, images of the pokemon as well as the data on each one is not included in this repo, and will need to be sourced elsewhere 