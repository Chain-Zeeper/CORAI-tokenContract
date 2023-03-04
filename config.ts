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
        "mainnet":"0x3f54C4F76f5f288a7015B7882DAe571e373aaea7",
        "testnet":"0x4f343dc523386CF5676CF899FBA26C88A3b6Eb0A"

    },
    taxCollector:{
        "mainnet":"0x70d50169039556D0F2340d2317a20d9fc07aFC1c",
        "testnet":"0x4f343dc523386CF5676CF899FBA26C88A3b6Eb0A"

    }
}