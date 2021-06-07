require("dotenv").config()

const Web3 = require("web3")

const AddressWorthChecker = require("./api")
const CHAINS = require("./chains")
const addrToCheck = require("./addressesToCheck.json")

const web3s = {
  1: new Web3(process.env.eth),
  56: new Web3(process.env.bsc)
};

(async () =>{
  const check = AddressWorthChecker(web3s)
  for (var i = 0; i < addrToCheck.length; i++) {
    const nowAddr = addrToCheck[i]
    for (var j = 0; j < 2; j++) {
      const nowChain = j == 0 ? CHAINS.ETH : CHAINS.BSC
      console.log(`[${nowChain == 1 ? "ETH" : "BSC"}] Fetching: ${nowAddr}`)
      const data = await check(nowChain, nowAddr)
      if (data == null) {
        console.log("Error")
        return
      }
      const { out } = data
      out.sort((a, b) => parseInt(a.worth.toString()) - parseInt(b.worth.toString())).forEach(v => {
        console.log(`${v.amt.toString()} ${v.symbol}: $${v.worth.toString()}`)
      })
      console.log("========\n")
    }
  }
})();