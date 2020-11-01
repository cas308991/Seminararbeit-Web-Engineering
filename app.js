var pages = [];
var worker;

//Generate stock table
function loadStocks() {
	//Get table elements
	const table = document.getElementById('data_out');
	const thead = document.createElement('thead');
	const tr = document.createElement('tr');
	table.innerHTML = "";

	//Insert table head row
	addToElement('th', 'Name', tr);
	addToElement('th', 'Symbol', tr);
	addToElement('th', 'Allzeit Tief', tr);
	addToElement('th', 'Allzeit Hoch', tr);
	addToElement('th', 'Aktueller Preis', tr);
	addToElement('th', 'Letztes Update', tr);
	addToElement('th', 'Aktion', tr);

	thead.appendChild(tr);
	table.appendChild(thead);

	//clear dropdown on Auswahl
	const dropdown = document.getElementById('stockdropdown');
	dropdown.innerHTML = "";

	fetch('stocks/')
		.then(res => res.json())
		.then(stock => stock.forEach(showStockTable))
		.catch(err => showError(err))
}

function showStockTable(stock) {
	//Get table elements to fill
	const table = document.getElementById('data_out');
	const tbody = document.createElement('tbody');
	const tr = document.createElement('tr');

	//Add table data to table row
	addToElement('td', stock.name, tr, '');
	addToElement('td', stock.symbol, tr, '');
	addToElement('td', stock.low, tr, '');
	addToElement('td', stock.high, tr, '');
	addToElement('td', stock.current, tr, 'cp-' + stock.symbol);
	addToElement('td', stock.updatedAt, tr, '');

	//create update button in table row
	const btn = document.createElement('button');
	btn.classList.add("btn", "btn-info", "mr-1");
	btn.onclick = function () {
		updateCurrentPrice(stock.symbol);
		getStockData('stockapi/eod/', stock.symbol, updateDb);
	};
	btn.innerText = 'Aktualisieren';
	const td = document.createElement('td');
	td.appendChild(btn);

	//Create delete button in table row
	const btn2 = document.createElement('button');
	btn2.classList.add("btn", "btn-danger");
	btn2.onclick = function () {
		deleteStock(stock.symbol);
	};
	btn2.innerText = 'Löschen';

	//Add button to table
	td.appendChild(btn2);
	tr.appendChild(td);

	tbody.appendChild(tr);
	table.appendChild(tbody);

	//Build dropdown on Auswahl
	const dropdown = document.getElementById('stockdropdown');
	const a = document.createElement('a');
	a.classList.add("dropdown-item");
	a.innerText = stock.symbol;
	a.onclick = function () { getStockData('stock/', stock.symbol, showCanvas) };
	dropdown.appendChild(a);


}

//generic function to add elements as child
function addToElement(newTag, content, ele, id) {
	const el = document.createElement(newTag);
	el.innerHTML = content;
	if (id) el.id = id
	ele.appendChild(el);
}

function showStockForm() {
	$('#new_stock_div').show("fast");
}

//Generic function to start web worker
function startWorker(url, method, bodydata, msgFunc, errFunc) {
	//start worker
	worker = new Worker("worker.js");
	//Function to call on worker success
	worker.onmessage = msgFunc;
	//Function called on worker error
	worker.onmessageerror = errFunc;
	worker.postMessage({
		url: url,
		method: method,
		bodydata: bodydata,
	});
}

//generic function to fetch API data
function getStockData(url, symbol, func) {
	startWorker(
		url + symbol,
		'GET',
		null,
		func,
		showError
	);
}

function updateDb(event) {
	const data = event.data;
	console.log(data);

	//get price data from api response
	const prices_open = data.map(a => a.open);
	const prices_close = data.map(a => a.close);
	const prices_low = data.map(a => a.low);
	const prices_high = data.map(a => a.high);
	const dates = data.map(a => a.date);

	//Convert price vars to json
	bodydata = JSON.stringify({
		'high': Math.max.apply(Math, prices_high),
		'low': Math.min.apply(Math, prices_low),
		'prices_open': prices_open,
		'prices_close': prices_close,
		'prices_low': prices_low,
		'prices_high': prices_high,
		'dates': dates
	});

	//Update price data in DB
	startWorker(
		'stock/' + data[0].symbol,
		'PATCH',
		bodydata,
		loadStocks,
		showError
	);

}


function updateCurrentPrice(symbol) {

	//create spinner animation in stock table
	var el = document.getElementById('cp-' + symbol);
	var div = document.createElement('div');
	div.classList.add('spinner-border');
	el.innerHTML = '';
	el.appendChild(div);

	//get intraday current price from API
	startWorker(
		'/stockapi/intraday/' + symbol,
		'GET',
		null,
		saveCurrentPrice,
		showError
	);
}

//Update price data in DB
function saveCurrentPrice(event) {
	const data = event.data;
	console.log(data);
	//use latest stock data in API
	const current = data[0].last;

	//convert to JSON
	bodydata = JSON.stringify({
		'current': current
	})

	//Call DB update with new data
	startWorker(
		'stock/' + data[0].symbol,
		'PATCH',
		bodydata,
		loadStocks,
		showError
	);
}

//function to add stock to DB
function createStock(event) {

	event.preventDefault();

	//Get stock values from form
	var name = document.getElementById('name').value;
	var symbol = document.getElementById('symbol').value;

	//convert to json
	bodydata = JSON.stringify({
		"name": name,
		"symbol": symbol
	})

	//Call backend to add new stock
	startWorker(
		'stock',
		'POST',
		bodydata,
		loadStocks,
		showError
	);
}

//Remove stock from DB
function deleteStock(symbol) {
	startWorker(
		'/stock/' + symbol,
		'DELETE',
		null,
		loadStocks,
		showError
	);
}

//Render canvas function
function showCanvas(event) {

	//Define stock data
	const data = event.data[0];
	var dataPoints = [];

	var stockChart = new CanvasJS.StockChart("chartContainer", {
		theme: "light2",
		title: {
			text: data.symbol
		},
		charts: [{
			data: [{
				type: "candlestick",
				yValueFormatString: "€####.##",
				dataPoints: dataPoints
			}]
		}],
		navigator: {
			enabled: true
		},
		rangeSelector: {
			enabled: false
		}
	});

	//Push price data into dataPoint array for canvas
	for (var i = 0; i < data.dates.length; i++) {
		dataPoints.push({
			x: new Date(data.dates[i]),
			y: [Number(data.prices_open[i]),
			Number(data.prices_high[i]),
			Number(data.prices_low[i]),
			Number(data.prices_close[i])]
		});
	}

	//Render stock chart
	stockChart.render();

}

function showError(err) {
	//add error to top page
	const err_out = document.getElementById('error_out')
	const div = document.createElement('div')
	div.classList.add('alert')
	div.classList.add('alert-danger')
	div.setAttribute('role', 'alert')
	div.innerText = err.message
	err_out.appendChild(div)

	//remove error after 5 seconds
	setTimeout(() => err_out.removeChild(div), 5000)
}

function navigation(page) {
	//process navigation elements
	for (let p of pages) {
		let el = document.getElementById(p)
		if (p === page)
			el.classList.remove("hidden")
		else
			el.classList.add("hidden")
	}
}

function handleNav() {
	//Navigate by url hashtag
	let p = window.location.hash.replace("#", "")
	if (p === "")
		p = "start"
	navigation(p)
}

//call at page load
window.addEventListener('load', evt => {
	//update stocks
	loadStocks();
	//add form buttons
	document.getElementById('form_close_button').addEventListener('click', function () {
		$(new_stock_div).hide("fast");
	})
	//Add button to show new stock form
	document.getElementById('new_stock_button').addEventListener('click', showStockForm)
	//add "Add Stock" button
	document.getElementById('new_stock_form').addEventListener('submit', createStock)

	//convert sections into navbar Elements
	let nav = document.getElementById("navbarNav");
	//for each navpage section
	for (let p of document.getElementsByClassName("navpage")) {
		const id = p.getAttribute("id");
		pages.push(id)

		//create a element in navbar
		const a = document.createElement("a");
		a.href = "#" + id
		a.classList.add("p-2", "text-blue");
		a.innerText = p.getAttribute("data-title");

		nav.appendChild(a);
	}

	handleNav();


});

//On URL change
window.addEventListener("hashchange", event => {
	//Display content
	handleNav();
});



