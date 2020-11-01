const express = require('express')
const stockRouter = require('./stock-router')
const app = express()
const port = 5000

app.use(express.json())

app.use('/', express.static('www'))
app.use('/lib', express.static('node_modules'))

app.use(stockRouter)

app.listen(port, () => console.log(`Open http://localhost:${port}`))
