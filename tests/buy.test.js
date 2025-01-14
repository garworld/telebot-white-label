const buyTokenUseETH1Inch = require("../helpers/buy-1inch");

const token = `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`;     //usdt
// const token = '0x38E68A37E401F7271568CecaAc63c6B1e19130B4';      // banana

const oneInchBuyTest = async () => {
    const response = await buyTokenUseETH1Inch(
        process.env.TEST_WALLET,
        token,
        `0.0001`
    );

    return response
}

const main = async () => {
    // 1inch transactions
    return await oneInchBuyTest();
}


console.log('Starting test...');
main().then((response) => {
    console.log('Function finished')
    console.log(`response: ${response}`)
    process.exit(0)
}).catch(e => {
    console.error('ERROR selling: ', e)
    process.exit(1)
})


