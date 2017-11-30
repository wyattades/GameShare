# GameShare [![Build Status](https://travis-ci.org/wyattades/GameShare.svg?branch=master)](https://travis-ci.org/wyattades/GameShare)

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
.  
|-- src/ - source of page assets (js, css, templates)  
|-- +-- assets/ - static images, fonts, etc.  
|-- +-- templates/ - small Pug templates inserted by jQuery  
|-- +-- styles/ - css/scss files  
|-- +-- [page].js - these js files will run on their corresponding page: index, play, edit  
|-- +-- [js utilities folders]/ - other javaScript helper files  
|-- views/ Pug files  
|-- +-- templates/ - small templates that can be shared between pages  
|-- +-- [page].pug - template for each page  
|-- server/ - source of server js  
|-- +-- index.js - starts node/express server  
|-- +-- [other server files]  

### Technologies
- [ES6 JavaScript](https://webapplog.com/es6/) (.js): the newest javascript version
- [Sass](http://sass-lang.com/documentation/file.SASS_REFERENCE.html) (.scss): Its like css but with variables and nested classes
- [Pug](https://pugjs.org/api/getting-started.html) (.pug): modern HTML templating language
- [Socket.io](https://socket.io/docs/): Easy websockets aka live "chatting" between client and server
- [PixiJs](http://pixijs.download/release/docs/index.html): 2D rendering engine. Used for rendering editor
- [Phaser.io](https://photonstorm.github.io/phaser-ce/): 2D game engine
- [Firebase](https://firebase.google.com/docs/): Handles user authentication and storing/fetching data

### Other Notes
- Remember to ```npm install``` if the package.json depencencies/devDependencies change

