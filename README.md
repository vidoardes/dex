## Dex
### Keep track of your little monsters

A simple app that allows you to track and maintain a list of Pokemon, including any variants in a easy to read and sharable format.

Built using Python 3.7

### Features
* Track and share your living Pokedex with an easy to use UI
* Pick and choose what you want to track: select wether you want to track forms, costumed variants, shiny, alolan, gender, or track every variant availible!
* Filters help you narrow down you list to exactly what you want to see
* Easy search and find other trainers using the app
* If you want to keep your data for personal use, you can hide your profile from other users 

### Project Setup
#### Requirements
* Python v3.7+
* PostgreSQL v10+
* Node v10+
* NPM v3.1+
  
First you will need to create you virtual environment, so open once you have checked out the repo open a terminal window and create a new directory in the root of your project:

```
python -m venv env
```

Once created you can activate it and install the requirements:

```python
pip install -r requirements.txt  
npm install
```
 
 You will need to run a debug mail server in your test environment, which can be done with the following command:

 ```
 python -m smtpd -n -c DebuggingServer localhost:8025
 ```
 
 and you will need to create a database called `dex` with the user role and password `dex:test` (or change the connection string in the example config). Once availible you can then run the following commands to create the empty tables.
 
 ```python
 flask db init  
 flask db migrate  
 flask db upgrade
 ```
 
 Once all of the above is complete, you are ready to run the site!  Simply type`python -m dex` and `gulp` in to your terminal to get started.
 
 ### Other Resources
 #### Images
 **Massive thank you to Chrales**, whos work on updating the assets from PoGO makes this app looks so good! [You can find his repo here.](https://github.com/ZeChrales/PogoAssets)
 
 To normalise the images and trim the empty space, you can either [visit my extra repository here](https://github.com/vidoardes/dex_images), or you can install [ImageMagick](https://imagemagick.org/script/download.php) and run the following command:
 
 Windows Powershell:
 ```Powershell
 Foreach ($f in Get-ChildItem *.png) {
     magick "$f" -fuzz 15% -trim +repage "$f"
 }
 ```
 
 Unix / Linux Bash:
 ```bash
for f in ./*.png; do
  magick "$f" -fuzz 15% -trim +repage "$f";
done
 ```
 
 Play around with the parameters to see what you can do, ImageMagick is a very powerful tool.
 
 #### Database
 
 I will be uploading my data source to a seperate repository soon: stay tuned!