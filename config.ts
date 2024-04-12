import { ethers } from "hardhat"
export default{
    initialSupply:{
        "mainnet":ethers.BigNumber.from("997900000000000000000000000"),
        "testnet":ethers.BigNumber.from("300000000000000000000000000")
    },
    name:{
        "mainnet":"CORTX",
        "testnet":"test corai"
    },
    symbol:{
        "mainnet":"CORTX",
        "testnet":"tCORAI"
    },
    to:{
        "mainnet":"0x7dB00699E5C50e3b3435fbB83EABB89A26A3c15b",
        "testnet":"0x6ceb2ADf9C413f914297A2001a54258c80C0b764"

    },
    taxCollector:{
        "mainnet":"0x7dB00699E5C50e3b3435fbB83EABB89A26A3c15b",
        "testnet":"0x6ceb2ADf9C413f914297A2001a54258c80C0b764"

    }
}