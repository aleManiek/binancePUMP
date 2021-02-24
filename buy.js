require("dotenv").config();
const fetch = require("node-fetch");
const crypto = require("crypto");

const url = process.env.URL;
const apiKey = process.env.APIKEY;
const secret = process.env.SECRET;
const amount = process.env.AMOUNT;
const estimatedProfit = process.env.ESTIMATED_PROFIT;

const ticker = process.argv[2];
const symbol = `${ticker}BTC`;

async function createMarketOrderAndPlaceTP() {
  const qs = `symbol=${symbol}&quoteOrderQty=${amount}&side=BUY&type=MARKET&timestamp=${Date.now()}`;
  const hmac = crypto.createHmac("sha256", secret).update(qs).digest("hex");
  try {
    const response = await fetch(`${url}?${qs}&signature=${hmac}`, {
      method: "post",
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    });
    const data = await response.json();
    const { fills, executedQty } = data;
    console.log(data);
    const price = parseFloat(fills[fills.length - 1].price);
    console.log(`Kupiono ${executedQty} po cenie ${price}`);

    if (data.status === "FILLED") {
      const newPrice = (price * estimatedProfit).toFixed(8);
      const newQs = `symbol=${symbol}&price=${newPrice}&quantity=${parseFloat(executedQty)}&timeInForce=GTC&side=SELL&type=LIMIT&timestamp=${Date.now()}`;
      const signature = crypto.createHmac("sha256", secret).update(newQs).digest("hex");
      console.log(`Próba wwystawienia zlecenia po cenie: ${price}`);
      const res = await fetch(`${url}?${newQs}&signature=${signature}`, {
        method: "post",
        headers: {
          "X-MBX-APIKEY": apiKey,
        },
      });
      const newData = await res.json();
      console.log(newData);
      if (res.status === 200) console.log(`Wystawiono ${newData.origQty} po cenie ${newData.price}`);
    }
  } catch (err) {
    console.log(err);
  }
}

createMarketOrderAndPlaceTP();
