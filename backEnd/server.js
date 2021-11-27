const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const spawn = require('child_process').spawnSync
const {initOrg2, sendRequest, readResponse} = require('../operate.js');

app.use(cors())
app.set('views', '../frontEnd')

var contract;
var username = '';
var requestID = 1;

app.get('/login', async (req, res) => {
    username = req.query.username;
    contract = await initOrg2(username);
    res.redirect('/home');
})

app.get('/sendRequest', async (req, res) => {
    const proposal = req.query.proposal;
    const requestStr = requestID.toString();
    var output = await sendRequest(contract, proposal, requestStr);
    // output是发送结果
    res.send(output)
})

app.get('/readResponse', async (req, res) => {
    var output = await readResponse(contract);
    // output需要解析；
    res.send(output)
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
