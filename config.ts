import {BigNumber} from "ethers"
export default{
    initialSupply:{
        "mainnet":BigNumber.from("1000000000000000000000000000"),
        "testnet":BigNumber.from("300000000000000000000000000")
    },
    name:{
        "mainnet":"CORAI",
        "testnet":"test corai"
    },
    symbol:{
        "mainnet":"CORAI",
        "testnet":"tCORAI"
    },
    to:{
        "mainnet":"0x409E875Cf5AD95A56333CA4933F36804D2e93506",
        "testnet":"0x6ceb2ADf9C413f914297A2001a54258c80C0b764"

    },
    taxCollector:{
        "mainnet":"0x70d50169039556D0F2340d2317a20d9fc07aFC1c",
        "testnet":"0x6ceb2ADf9C413f914297A2001a54258c80C0b764"

    }
}