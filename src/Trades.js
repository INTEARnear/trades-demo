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
            let currentPage = await fetch(`${EVENTS_URL}/query/trade_swap?trader_account_id=${accountId}&pagination_by=Newest&limit=200`)
                .then(response => response.json());
            let allTrades = [...currentPage.map(d => d.event)];
            setTrades(allTrades)
            while (allTrades.length <= 1000 && currentPage.length > 0) {
                currentPage = await fetch(`${EVENTS_URL}/query/trade_swap?trader_account_id=${accountId}&pagination_by=BeforeId&id=${currentPage[currentPage.length - 1].id}&limit=200`)
                    .then(response => response.json());
                allTrades.push(...currentPage.map(d => d.event));
                setTrades(allTrades);
            }
            setTrades(allTrades);
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
