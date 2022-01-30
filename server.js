const express = require('express')
const next = require('next')
const app = express()
const cors = require('cors')
// const redis = require('@upstash/redis')
// const axios = require('axios')
const moralis = require('moralis/node')
const fs = require('fs')
const BigNumber = require('bignumber.js')
const status = require("./status.json")

BigNumber.config({ EXPONENTIAL_AT: 1e+9 })

// const db = require('./db')
const ALPHA = 0.9999828089974554711736567733551404044961683376730844584685269050
const CHAIN = 'bsc testnet'
const MORALIS_APP_ID = 'tmEJ4g1hH5imCfUxtXP4vm8BtfAaCw0VRz8pcUTF';
const MORALIS_SERVER = 'https://9yelljm57n1q.usemoralis.com:2053/server';

moralis.start({appId:MORALIS_APP_ID,serverUrl:MORALIS_SERVER})
// redis.auth('https://eu1-major-fawn-34672.upstash.io','AYdwASQgZDA0ODdiMWYtOWFmNS00NzgzLWJkNGUtMzkyMWM1NDRkNjhjMWUwODc2ODY3MjJkNDRiZGJjOTczOTA4MTMwN2VjMGU=')

const CONTRACT_ADDRESS = '0xd1dae0fe9dffd359e597249579e57f2ce520cfc3'
const EVENT_TRANSFER_HASH = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const EVENT_DELEGATECHANGED_HASH = '0x3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f'

const abiEventTransfer = {
	"anonymous":false,
	"inputs":[
		{"indexed":true,"internalType":"address","name":"from","type":"address"},
		{"indexed":true,"internalType":"address","name":"to","type":"address"},
		{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}
	],
	"name":"Transfer",
	"type":"event"
}
const abiEventDelegateChanged = {
	"anonymous":false,
	"inputs":[
		{"indexed":true,"internalType":"address","name":"delegator","type":"address"},
		{"indexed":true,"internalType":"address","name":"fromDelegate","type":"address"},
		{"indexed":true,"internalType":"address","name":"toDelegate","type":"address"}
	],
	"name":"DelegateChanged",
	"type":"event"
}

app.use(cors({
    origin: '*'
}))
app.use(express.static(__dirname + '/public'))

const progress = {
	total: 0,
	current: 0,
	status: 0
}
let last_rebate_block = status.last_rebate_block ? status.last_rebate_block : -1
let last_reward_block = status.last_reward_block ? status.last_reward_block : 0
// let last_rebate_time = status.last_rebate_time
const delegates = status.delegates ? status.delegates : []
const accounts = status.accounts ? status.accounts : {}
let total_spent = status.total_spent ? status.total_spent : 0
let total_count = status.total_count ? status.total_count : 0

let transactions = []
let delegate_logs = {}
let transfer_logs = {}

function start() {
	progress.status = 1
	progress.current = 0
	rebate()
}
async function rebate() {
	const options = {
		chain: CHAIN,
		address: CONTRACT_ADDRESS,
		from_block: parseInt(last_rebate_block)+1,
		// to_block: 14000000,
		limit: 1
	}
	transactions = []
	delegate_logs = {}
	transfer_logs = {}
	const est = await moralis.Web3API.account.getTransactions(options)
	return new Promise((resolve, reject) => {	
		if(est.total==0) {
			resolve()
			return
		}
		const to_block = est.result[0].block_number
		// resolve()
		// return	
		Promise.all([
			new Promise((resolve,reject)=>{
				load_transactions(to_block).then(resolve).catch(reject)
			}),
			new Promise((resolve,reject)=>{
				load_delegates(to_block).then(resolve).catch(reject)
			}),
			new Promise((resolve,reject)=>{
				load_transfers(to_block).then(resolve).catch(reject)
			}),
		]).then(()=>{
			let w_spent = {}
			let last_block = last_rebate_block
			for(let i = transactions.length-1;i>=0;i--) {
				const tx = transactions[i]
				const logs = transfer_logs[tx.hash]
				if(logs) for(const log of logs) {
					const amount = log.value
					if(accounts[log.to]==undefined)
						accounts[log.to] = {}
					if(accounts[log.to].balance==undefined)
						accounts[log.to].balance = 0
					accounts[log.to].balance = new BigNumber(accounts[log.to].balance).plus(amount).toString()
					if(log.from=='0x0000000000000000000000000000000000000000' || log.from==CONTRACT_ADDRESS)
						continue
					if(accounts[log.from]==undefined)
						accounts[log.from] = {}
					if(accounts[log.from].balance==undefined)
						accounts[log.from].balance = 0
					accounts[log.from].balance = new BigNumber(accounts[log.from].balance).minus(amount).toString()
				}
				if(delegate_logs[tx.hash] && !delegates.includes(delegate_logs[tx.hash])) {
					delegates.push(delegate_logs[tx.hash])
				}
				if(tx.block >= last_reward_block) {
					if(tx.block > last_block) {
						for(const address of delegates) {
							if(accounts[address]!=undefined && accounts[address].balance) {
								const balance = new BigNumber(accounts[address].balance).shiftedBy(-18).toNumber()
								if(balance) {
									if(accounts[address].weight==undefined)
										accounts[address].weight = balance*(1-ALPHA)
									else
										accounts[address].weight = accounts[address].weight*ALPHA + balance*(1-ALPHA)
								}
							}
						}
					}
					if(tx.block - last_reward_block > 5760) {
						let total = 0
						for(const address of delegates) {
							if(accounts[address]!=undefined) {
								if(accounts[address].rewards==undefined)
									accounts[address].rewards = 0
							}
						}
						for(const w of Object.values(w_spent)) total += w
						for(const address of Object.keys(w_spent)) {
							if(accounts[address]!=undefined) {
								accounts[address].rewards += 500000000 * w_spent[address] / total
							}
						}
						w_spent = {}
						last_reward_block = tx.block
					}
					if(delegates.includes(tx.from)) {
						if(accounts[tx.from]==undefined) {
							accounts[tx.from] = {
								spent: 0,
								count: 0
							}
						}
						const gas = new BigNumber(tx.gas).shiftedBy(-18).toNumber()
						if(accounts[tx.from].weight!=undefined)
							w_spent[tx.from] += accounts[tx.from].weight * gas
						if(accounts[tx.from].spent==undefined)
							accounts[tx.from].spent = 0
						accounts[tx.from].spent += gas
						if(accounts[tx.from].count==undefined)
							accounts[tx.from].count = 0
						accounts[tx.from].count ++
						total_count++
						total_spent += gas
					}
				}
				last_block = tx.block
			}
			last_rebate_block = to_block
			fs.writeFileSync('./status.json', JSON.stringify({ last_rebate_block, last_reward_block, total_spent, total_count, delegates, accounts }))
			transactions = []
			delegate_logs = {}
			transfer_logs = {}
			resolve()
		}).catch(reject)
	})
}
async function load_delegates(to_block, offset = 0) {
	const options = {
		chain: CHAIN,
		address: CONTRACT_ADDRESS,
		topic: EVENT_DELEGATECHANGED_HASH,
	  	abi: abiEventDelegateChanged,
	  	from_block: last_rebate_block,
		to_block: to_block,
		offset: offset
	}	
	return new Promise((resolve, reject) => {
		moralis.Web3API.native.getContractEvents(options).then(result => {
			console.log('load delegates',offset,result.result.length)
			for(const row of result.result) {
				const tx_hash = row.transaction_hash
				delegate_logs[tx_hash] = row.data.delegator
			}
			// db.query("INSERT INTO delegate (`hash`,`address`,`block`) VALUES ?",[result.result.map(item=>[item.transaction_hash,item.data.delegator,item.block_number])]).then((data)=>{
			// 	console.log('store delegates',offset,data.affectedRows)
			// })
			if(result.total>(result.page+1)*result.page_size)
				load_delegates(to_block,offset+result.page_size).then(()=>resolve())
			else
				resolve()
		}).catch((err)=>{
			console.log('load delegates error')
			setTimeout(()=>{
				load_delegates(to_block, offset).then(()=>resolve())
			},500)
		})
	})
}
async function load_transfers(to_block, offset = 0) {
	const options = {
		chain: CHAIN,
		address: CONTRACT_ADDRESS,
		topic: EVENT_TRANSFER_HASH,
	  	abi: abiEventTransfer,
	  	from_block: last_rebate_block,
		to_block: to_block,
		offset: offset
	}
	return new Promise((resolve, reject) => {
		moralis.Web3API.native.getContractEvents(options).then(result => {
			console.log('load transfers',offset,result.result.length)
			for(const row of result.result) {
				const tx_hash = row.transaction_hash
				const address = row.data.delegator
				if(transfer_logs[tx_hash]==undefined)
					transfer_logs[tx_hash] = []
				transfer_logs[tx_hash].push(row.data)
			}
			// db.query("INSERT INTO transfer (`hash`,`from`,`to`,`value`,`block`) VALUES ?",[result.result.map(item=>[item.transaction_hash,item.data.from,item.data.to,item.data.value,item.block_number])]).then((data)=>{
			// 	console.log('store transfers',offset,data.affectedRows)
			// })
			if(result.total>(result.page+1)*result.page_size) {
				load_transfers(to_block,offset+result.page_size).then(()=>resolve())
			} else
				resolve()
		}).catch((err)=>{
			console.log('load transfers error')
			setTimeout(()=>{
				load_transfers(to_block, offset).then(()=>resolve())
			}, 500)
		})
	})
}
function load_transactions(to_block, offset = 0) {
	const options = {
		chain: CHAIN,
		address: CONTRACT_ADDRESS,
		from_block: last_rebate_block,
		to_block: to_block,
		offset: offset
	}
	return new Promise((resolve, reject) => {
		moralis.Web3API.account.getTransactions(options).then(result => {
			console.log('load transactions',offset,result.result.length,result.total,result.result[0].hash,result.result[0].block_number)
			for(const tx of result.result) {
				transactions.push({
					hash: tx.hash,
					from: tx.from_address,
					to: tx.to_address,
					gas: new BigNumber(tx.gas_price).times(tx.receipt_gas_used).toString(),
					block: tx.block_number
				})
			}
			// db.query("INSERT INTO transactions (`hash`,`from`,`to`,`gas`,`block`) VALUES ?",[result.result.map(tx=>[tx.hash,tx.from_address,tx.to_address,new BigNumber(tx.gas_price).times(tx.gas).toString(),tx.block_number])]).then((data)=>{
			// 	console.log('store transactions',offset,data.affectedRows)
			// })
			if(result.total>(result.page+1)*result.page_size) {
				load_transactions(to_block, offset+result.page_size).then(()=>resolve())
			} else
				resolve()
		}).catch((err)=>{
			console.log('load transactions error')
			setTimeout(()=>{
				load_transactions(to_block, offset).then(()=>resolve())
			}, 500)
		})
	})
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
app.get('/rebate', (req, res) => {
	res.end(`${progress.current} / ${progress.total}`)
})
app.post('/rebate', async (req, res) => {
	rebate().then(()=>{
		res.end('Success')
	}).catch(err=>{
		console.log(err)
		res.end('Error')
	})
})
// app.delete('/rebate', (req, res) => {
// 	progress.status = -1
// 	res.end('Canceled')
// })
app.get('/account/:address', (req, res) => {
	const address = req.params.address
	res.json({
		total_spent, total_count,
		own: accounts[address]
	})
})

const port = process.argv[3]
const server = next({ dev:false, port })
const handle = server.getRequestHandler()
server.prepare().then(() => {
	app.all('*', (req, res) => {
    return handle(req, res)
  })
	app.listen(port, (err) => {
		if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
		rebate()
		setTimeout(rebate, 7200000)
	})
})