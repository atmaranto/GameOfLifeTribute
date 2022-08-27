/*

MIT License

Copyright (c) 2022 Anthony Maranto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

function newCell(x, y) {
	return $(document.createElement("div")).addClass("alive").css({left: x * window.CELL_WIDTH, top: y * window.CELL_HEIGHT}).appendTo(window.cellArea);;
}

function togglePause() {
	window.PAUSED = !window.PAUSED;
	
	if(window.PAUSED) {
		$("#togglePause").attr("value", "Unpause");
	}
	else {
		$("#togglePause").attr("value", "Pause");
	}
	
	window.cellWorker.postMessage({
		type: "pause",
		pause: window.PAUSED
	});
}

function clear() {
	if(!window.PAUSED) {
		togglePause();
	}
	
	window.cellWorker.postMessage({type: "clear"});
}

$(document).ready(() => {
	window.PAUSED = true;

	window.CELL_HEIGHT = 40;
	window.CELL_WIDTH = 40;

	window.GAME_DELAY = 500;

	window.cellArea = document.getElementById("cellarea");
	
	window.cellCache = {};
	
	document.getElementById("togglePause").onclick = togglePause;
	document.getElementById("clear").onclick = clear;
	
	console.log("Loaded");
	
	$(window.cellArea).on("click", function(evt) {
		if(window.PAUSED) {
			let x = Math.floor((evt.clientX + window.cellArea.scrollLeft) / window.CELL_WIDTH),
				y = Math.floor((evt.clientY + window.cellArea.scrollTop) / window.CELL_HEIGHT);
			
			window.cellWorker.postMessage({
				type: "toggle",
				x, y
			});
		}
	});
	
	//window.cellWorker = new Worker("worker.js");
	window.cellWorker = new Worker(URL.createObjectURL(new Blob(["("+_worker.toString()+")()"], {type: "text/javascript"})));
	
	window.cellWorker.onmessage = function(message) {
		message = message.data;
		//console.log(message);
		
		if(message.type === "create") {
			window.cellCache[message.id] = newCell(message.x, message.y);
		}
		else if(message.type === "delete") {
			window.cellCache[message.id].remove();
			delete window.cellCache[message.id];
		}
		else if(message.type === "updates") {
			for(let cell of message.dead) {
				window.cellCache[cell].remove();
				delete window.cellCache[cell];
			}
			
			for(let cell of message.live) {
				window.cellCache[cell[2]] = newCell(cell[0], cell[1]);
			}
		}
		else if(message.type === "clear") {
			$(".alive").remove();
			
			delete window.cellCache;
			window.cellCache = {};
		}
	}

	//window.GAME_INTERVAL = setInterval(tick, window.GAME_DELAY);
});