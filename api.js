const axios = require("axios").default
const { parse } = require("node-html-parser")
const abis = require("./abis")
const chains = require("./chains")
const addresses = require("./addresses")

const AddressWorthChecker = (web3s) => {

  const tokenListURL = (chain, addr) => `https://${chain == chains.BSC ? "bscscan.com" : "etherscan.io"}/tokenholdingsHandler.aspx?=&a=${addr}&q=&p=1&f=0&h=0&sort=total_price_usd&order=desc&fav=&langMsg=A%20total%20of%20XX%20tokenSS%20found&langFilter=Filtered%20by%20XX&langFirst=First&langPage=Page%20X%20of%20Y&langLast=Last&ps=200`

  const get1InchPrice = async (chain, from, to, amt) => {
    try {
      const {data} = await axios.get(`https://api.1inch.exchange/v3.0/${chain}/quote?fromTokenAddress=${from}&toTokenAddress=${to}&amount=${amt}`)
      // console.log(data)
      return data
    } catch (e) {
      console.log(e)
      return null
    }
  };

  return async (chain, addr) => {
    try {
      const {data} = await axios.get(tokenListURL(chain, addr))
      const {recordsfound, fixedlayout} = data
      const root = parse(fixedlayout)
      const totalTokens = parseInt(/\d+/g.exec(recordsfound)[0])
  
      const allTokensAddr = root.querySelectorAll("a[title]").map(v => v.getAttribute("title"))
  
      const out = []
      const errAddr = []
  
      if (totalTokens != allTokensAddr.length + 1) {
        throw new Error("Incorrect token addresses length")
      }

      const utils = web3s[chain].utils
      
      for (var i = 0; i < allTokensAddr.length; i++) {
        const tokenAddr = allTokensAddr[i]
        const c = new web3s[chain].eth.Contract(abis.erc20, tokenAddr)
        try {
          const decimals = parseInt(await c.methods.decimals().call({from: addr}))
          const amt = utils.toBN(await c.methods.balanceOf(addr).call({from: addr})) //.div(web3s[chain].utils.toBN("1".padEnd(decimals + 1, "0")))
          const price = tokenAddr.toLowerCase() == addresses.USDT[chain] ? {fromToken: {symbol: "USDT"}, toTokenAmount: amt} : await get1InchPrice(chain, tokenAddr, addresses.USDT[chain], amt.toString())
          if (price == null) {
            // console.log(tokenAddr)
            errAddr.push(tokenAddr)
            continue
          }
          out.push(
            {
              symbol: price.fromToken.symbol,
              tokenAddr: tokenAddr,
              amt: amt.div(utils.toBN("1".padEnd(decimals + 1, "0"))),
              worth: utils.toBN(price.toTokenAmount).div(utils.toBN("1".padEnd(chain == 1 ? 6 : 18 + 1, "0")))
            }
          )
        } catch(e) {
         continue
        }
      }
  
      return {
        out, errAddr
      }
    } catch (e) {
      console.log(e)
      return null
    }
  }
}



module.exports = AddressWorthChecker