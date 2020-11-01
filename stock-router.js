const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const router = express.Router();

//API Settings
const apikey = "20b045b3fa1650540bb0079836235de0";
const apiurl_eod = "http://api.marketstack.com/v1/eod?access_key=" + apikey + "&limit=365&symbols="
const apiurl_intra = "http://api.marketstack.com/v1/intraday/latest?interval=15min&access_key=" + apikey + "&symbols="

//Connect to DB
mongoose.connect('mongodb://admin:secret@localhost/', { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', err => console.error('connection error:', err))
db.once('open', () => console.log('Connected'))


//Stock schema for DB
const stockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    high: { type: Number },
    low: { type: Number },
    current: { type: Number },
    prices_open: { type: [Number] },
    prices_close: { type: [Number] },
    prices_low: { type: [Number] },
    prices_high: { type: [Number] },
    dates: { type: [String] }
}, {
    timestamps: true //use created_at and updated_at
});

const Stock = mongoose.model('Stock', stockSchema);

//clear DB at startup
Stock.remove({}, () => null);

//price init values
const initprices = [0];

//init DB with initial entries
new Stock({
    "name": "APPLE INC",
    "symbol": "AAPL",
    "prices": initprices,
}).save();

new Stock({
    "name": "AMAZON COM INC",
    "symbol": "AMZN",
    "prices": initprices,
}).save();

new Stock({
    "name": "Google",
    "symbol": "GOOGL",
    "prices": initprices,
}).save();

new Stock({
    "name": "Microsoft",
    "symbol": "MSFT",
    "prices": initprices,
}).save();

new Stock({
    "name": "SAP",
    "symbol": "SAP",
    "prices": initprices,
}).save();


//Returns all stock data in DB
router.get('/stocks', (req, res) => {
    Stock.find()
        .then(data => res.status(200).type("json").send(data))
        .catch(err => res.status(500).send(err));
});

//Returns stock by symbol
router.get('/stock/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    Stock.find({ symbol: symbol })
        .then(data => res.status(200).type("json").send(data))
        .catch(err => res.status(500).send(err));
});

//Returns stockapi data by type and symbol
router.get('/stockapi/:type/:symbol', (req, res) => {

    //get data from request
    const type = req.params.type;
    const symbol = req.params.symbol;
    var url = apiurl_eod + symbol;

    //Determine if infraday or end-of-day data
    if (type == 'intraday') url = apiurl_intra + symbol;

    fetch(url)
        .then(res => res.json())
        .then(data => res.status(200).type("json").send(JSON.stringify(data["data"])))
        .catch(err => res.status(500).send(err));

});

//Update stock in DB by symbol
router.patch('/stock/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const data = req.body;

    Stock.findOneAndUpdate({ symbol: symbol }, data)
        .then(data => res.status(200).type("json").send(data))
        .catch(err => res.status(500).send(err));
});

//Create new stock in DB
router.post('/stock', function (req, res) {

    const stock = new Stock({
        "name": req.body.name,
        "symbol": req.body.symbol,
        "prices": [0],
    });

    stock.save()
        .then(data => res.status(200).type("json").send())
        .catch(err => res.status(500).send("Error while saving stock to DB"));
})

//Delete stock in DB by symbol
router.delete('/stock/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    const data = req.body;

    Stock.findOneAndRemove({ symbol: symbol }, data)
        .then(data => res.status(200).type("json").send(data))
        .catch(err => res.status(500).send(err));
});



module.exports = router