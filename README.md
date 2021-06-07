# Address tokens worth checker on BSC & ETH

1. Configure `.env` : 

```
bsc=rpc_url_to_bsc_node
eth=rpc_url_to_eth_node
```

2. Add the addresses you want to check in `addressesToCheck.json` :

```json
[
  "address1",
  "address2",
  .
  .
  .
  "addressN"
]
```

3. Install deps `npm install`

4. Run the script `npm start`
