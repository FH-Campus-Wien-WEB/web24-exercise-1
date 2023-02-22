const express = require('express')
const path = require('path')
const app = express()

// Serve static content in directory 'files'
app.use(express.static(path.join(__dirname, 'files')));

// Configure a 'get' endpoint for data..
app.get('/data', function (req, res) {
  // Part 1: Remove the next line and replace with your code
  res.send(
    [{ title: 'Moby-Dick', 'isbn': '0553213113', 'price': { 'value': 4.95, 'currency': '€' } },
    { title: 'Wind in the Willows', 'isbn': '0517632306', 'price': { 'value': 12.99, 'currency': '€' } },
    { title: 'Wuthering Heights', 'isbn': '0141439556', 'price': { 'value': 8, 'currency': '€' } }])
})

app.listen(3000)

console.log("Server now listening on http://localhost:3000/")