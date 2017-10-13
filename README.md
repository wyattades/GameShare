# GameShare

### Get Started
1. Install ```node``` v8.5.0
2. ```$ git clone https://github.com/wyattades/GameShare.git```
3. ```$ cd GameShare```
4. ```$ npm install```

Start developing by running ```$ npm run dev``` and opening ```localhost:3000``` in your browser

### Editor Config
- If you want to lint the javascript, install an ```eslint``` plugin
- Use the ```babel``` language instead of ```javascript``` if syntax highlighting doesn't work right

### File Structure
  
src/ - source of page assets (js, css, images, etc.)  
+-- assets/ - images, fonts, etc.   
+-- components/ - React components  
+-- styles/ - css/scss files   
+-- utils/ - other js files  
+-- [page].js - these js files will run on their corresponding page: index, play, edit  
views/ ejs files aka HTML templates  
+-- templates/ - smaller templates that can be shared between pages  
+-- [page].ejs - template for each page  
server.js - creates a node & express server  

### Technologies
There are a few technolgies you will need to learn to start developing:
- ES6 JavaScript (.js): the newest javascript version. Heres the [important concepts](https://webapplog.com/es6/)
- Sass (.scss): Its like css but with variables and nested classes
- Embedded JavaScript (.ejs): super simple HTML templating with javascript
- Socket.io: Easy websockets aka live "chatting" between client and server
- PixiJs: 2D game engine. I just learn as I go with this one
- ReactJs: great for making interactive UI. Only learn if you really want to, I'll try to avoid it in the project

### Other Notes
- Remember to ```npm install``` if the package.json depencencies/devDependencies change

