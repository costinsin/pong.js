run:
	node ./server.js

install:
	sudo apt update
	sudo apt install nodejs
	sudo apt install npm
	sudo npm install -g npm
	sudo npm install socket.io
	sudo npm install express