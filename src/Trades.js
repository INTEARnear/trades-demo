import { useEffect, useState } from "react";
import Trade from "./Trade";
import { EVENTS_URL, PRICE_URL, WEBSOCKET_URL } from "./config";
import "./Trades.css";
import useWebSocket from "react-use-websocket";

function Trades() {
    let account = 'slimedragon.near';
    if (window.location.search.length !== 0) {
        let search = new URLSearchParams(window.location.search);
        if (search.has('account')) {
            account = search.get('account');
        }
    }

    let [accountId] = useState(account);

    let [trades, setTrades] = useState([]);
    useEffect(() => {
        async function loadTrades() {
            let searchStartDate = (Date.now() - 1000 * 60 * 60 * 24) * 1_000_000;
            let currentPage = await fetch(`${EVENTS_URL}/query/trade_swap?trader_account_id=${accountId}&start_block_timestamp_nanosec=${searchStartDate}&blocks=100`)
                .then(response => response.json());
            let allTrades = [...currentPage];
            while (currentPage.length >= 100) {
                let lastBlockTimestamp = allTrades[allTrades.length - 1].block_timestamp_nanosec;
                let nanosPart = lastBlockTimestamp.slice(-3);
                let newNanoPart = parseInt(nanosPart) + 1;
                searchStartDate = lastBlockTimestamp.slice(0, -3) + newNanoPart.toString().padStart(3, '0');
                currentPage = await fetch(`${EVENTS_URL}/query/trade_swap?trader_account_id=${accountId}&start_block_timestamp_nanosec=${searchStartDate}&blocks=100`)
                    .then(response => response.json());
                allTrades.push(...currentPage);
            }
            setTrades(allTrades.reverse());
        }
        loadTrades();
    }, [accountId]);

    let [prices, setPrices] = useState({});
    useEffect(() => {
        async function loadPrices() {
            let prices = await fetch(`${PRICE_URL}/hardcoded/list-token-price`)
                .then(response => response.json());
            setPrices(prices);
        }
        loadPrices();
    }, []);

    useWebSocket(`${WEBSOCKET_URL}/events/trade_swap`, {
        onOpen: (event) => {
            event.target.send(JSON.stringify({ trader_account_id: accountId }));
        },
        onMessage: (event) => {
            let trade = JSON.parse(event.data);
            setTrades(trades => [trade, ...trades]);
        },
    });

    return <div>
        <h1>
            {accountId} trades
        </h1>
        <p>
            This page has all {accountId}'s trades in the last 24 hours, and listens for new trades in real-time. <a href="https://github.com/INTEARnear/trades-demo">Source code</a>
        </p>
        <table>
            <thead>
                <tr>
                    <th>Transaction</th>
                    <th>Trader</th>
                    <th>Balance Changes</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                {trades.map((trade, index) => <Trade key={index} {...trade} prices={prices} />)}
            </tbody>
        </table>
    </div>;
}

export default Trades;
