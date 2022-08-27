--[[

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

]]--

function loadfont(size)
	if fontcache[size] == nil then
		fontcache[size] = love.graphics.newFont("comic.ttf", size)
	end
	love.graphics.setFont(fontcache[size])
	fontsize = size
end

function createNewUniverse()
	universe = {}
	
	local univMT = {
		__index = function(table, key)
			return rawget(table, key % cellLine)
		end,
		
		__newindex = function(table, key, value)
			return rawset(table, key % cellLine, value)
		end
	}
	
	setmetatable(universe, univMT)
	
	for i=0,cellLine do
		universe[i] = {}
		setmetatable(universe[i], univMT)
		
		for j=0,cellLine do
			universe[i][j] = false
		end
	end
	
	return universe
end


function love.load()
	love.graphics.setNewFont("comic.ttf", 30)
	
	if math.tointeger == nil then
		function math.tointeger(n) -- I *think* this is how tointeger typically works?
			if n < 0 then return math.ceil(n) end
			return math.floor(n)
		end
	end
	
	love.window.width, love.window.height = love.graphics.getDimensions()
	
	cellWidth = 20
	cellHeight = 20
	
	fontcache = {}
	loadfont(30)
	
	-- canvas = love.graphics.newCanvas(love.window.width, love.window.height, {format="rgba8"})
	
	cellLine = math.max(math.ceil(love.window.width / cellWidth), math.ceil(love.window.height / cellHeight))
	
	createNewUniverse()
	
	paused = true
	lastUpdated = 0
	updateRate = 0.2
	
	love.keyboard.setKeyRepeat(true)
end

function tick()
	toToggle = {}
	
	for i=0,cellLine-1 do
		for j=0,cellLine-1 do
			local neighbors = 0
			
			if universe[i-1][j-1] then neighbors = neighbors + 1 end
			if universe[i-1][j] then neighbors = neighbors + 1 end
			if universe[i-1][j+1] then neighbors = neighbors + 1 end
			if universe[i][j-1] then neighbors = neighbors + 1 end
			if universe[i][j+1] then neighbors = neighbors + 1 end
			if universe[i+1][j-1] then neighbors = neighbors + 1 end
			if universe[i+1][j] then neighbors = neighbors + 1 end
			if universe[i+1][j+1] then neighbors = neighbors + 1 end
			
			if universe[i][j] then
				if neighbors < 2 or neighbors > 3 then
					table.insert(toToggle, {i, j})
				end
			elseif neighbors == 3 then
				table.insert(toToggle, {i, j})
			end
		end
	end
	
	for i, item in ipairs(toToggle) do
		universe[item[1]][item[2]] = not universe[item[1]][item[2]]
	end
end

function love.update(dt)
	lastUpdated = lastUpdated + dt
	if not paused and lastUpdated > updateRate then
		lastUpdated = 0
		
		tick()
	end
end

function love.keypressed(key, sc, isrepeat)
	if key == "space" then
		paused = not paused
	elseif key == "right" then
		tick()
	end
end

function love.mousepressed(x, y, button, istouch, presses)
	if button ~= 1 then return end
	
	local indexX = math.floor(x / cellWidth)
	local indexY = math.floor(y / cellHeight)
	
	universe[indexX][indexY] = not universe[indexX][indexY]
end

function love.wheelmoved(x, y)
	if y > 0 then
		updateRate = updateRate * 0.85
	elseif y < 0 then
		updateRate = updateRate / 0.85
	end
end

function clear()
	love.graphics.clear(1.0, 1.0, 1.0)
end

function drawUniverse()
	love.graphics.setLineWidth(2)
	
	love.graphics.setColor(0, 0, 0)
	
	for i=0,cellLine do
		love.graphics.line(0, i * cellHeight, love.window.width, i * cellHeight)
		love.graphics.line(i * cellWidth, 0, i * cellWidth, love.window.height)
	end
	
	for i=0,cellLine-1 do
		for j=0,cellLine do
			if universe[i][j] then
				love.graphics.rectangle("fill", i * cellWidth, j * cellHeight, cellWidth, cellHeight)
			end
		end
	end
end

function love.draw()
	love.graphics.clear(1, 1, 1)
	--loadfont(fontsize)
	love.graphics.setColor(0, 0, 0)
	
	drawUniverse()
	
	if paused then
		love.graphics.setColor(0.9, 0.87, 0.2)
		love.graphics.print("Paused", 0, 0)
	else
		love.graphics.setColor(0.21, 0.9, 0.3)
		love.graphics.print("Running", 0, 0)
	end
	
	--love.button.draw()
end