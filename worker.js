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

function _worker(){

var cells = {};
var nCells = 0;

function setCell(x, y, state) {
	let column = cells[x];
	
	if(!column && state) {
		column = {};
		cells[x] = column;
	}
	else if (!column) {
		return;
	}
	
	if(state) {
		if(column[y] == undefined) {
			column[y] = nCells++;
		}
	}
	else {
		if(column[y] != undefined) {
			delete column[y];
		}
	}
}

function toggleCell(x, y) {
	let column = cells[x];
	
	if(!column) {
		column = {};
		cells[x] = column;
	}
	
	if(column[y] != undefined) {
		postMessage({
			type: "delete",
			id: column[y]
		});
		
		delete column[y];
	}
	else {
		column[y] = nCells;
		
		postMessage({
			type: "create",
			id: nCells++,
			x, y
		});
	}
}

function getCell(x, y) {
	let column = cells[x];
	
	if(!column) {
		return undefined;
	}
	
	return column[y];
}

const adjacent = [
	[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
];

function tick() {
	if(!PAUSED) {
		let deadp = [],
			dead = [],
			check = [],
			livep = [],
			live = [];
		
		for(let x in cells) {
			let row = cells[x];
			
			x = parseInt(x);
			
			for(let y in row) {
				if(row[y] == undefined) {
					continue;
				}
				
				y = parseInt(y);
				
				let neighbors = 0;
				
				//TODO: I could optimize this by requesting only the necessary rows
				for(let offset of adjacent) {
					if(getCell(offset[0] + x, offset[1] + y) != undefined) {
						neighbors++;
					}
					else {
						check.push([offset[0] + x, offset[1] + y]);
					}
				}
				
				if(neighbors < 2 || neighbors > 3) {
					dead.push(row[y]);
					deadp.push([x, y]);
				}
			}
		}
		
		for(let position of check) {
			let neighbors = 0;
			
			for(let offset of adjacent) {
				if(getCell(position[0] + offset[0], position[1] + offset[1]) != undefined) {
					neighbors++;
				}
			}
			
			if(neighbors == 3) {
				livep.push([position[0], position[1]]);
				//setCell(position[0], position[1], true);
			}
		}
		
		for(let position of livep) {
			if(getCell(position[0], position[1]) != undefined) {
				continue;
			}
			
			live.push([position[0], position[1], nCells]);
			setCell(position[0], position[1], true);
		}
		
		for(let position of deadp) {
			setCell(position[0], position[1], false);
		}
		
		postMessage({
			type: "updates",
			dead, live
		});
	}
}

var gameDelay = 100;
var PAUSED = true;

this.onmessage = function(message) {
	message = message.data;
	//console.log(message);
	
	if(message.type === "toggle") {
		toggleCell(message.x, message.y, message.id);
	}
	else if(message.type === "cells") {
		cells = message.cells;
	}
	else if(message.type === "pause") {
		PAUSED = message.pause;
	}
	else if(message.type === "delay") {
		gameDelay = message.delay;
		
		stopInterval(cellInterval);
		cellInterval = setInterval(tick, gameDelay);
	}
	else if(message.type === "clear") {
		delete cells;
		cells = {};
		nCells = 0;
		
		postMessage({type: "clear"});
	}
}

var cellInterval = setInterval(tick, gameDelay);

}