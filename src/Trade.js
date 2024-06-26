import BigNumber from "bignumber.js";
import { Fragment, useEffect, useState } from "react";

const FORMAT = new Intl.NumberFormat('en-US', {
    minimumSignificantDigits: 4,
    maximumSignificantDigits: 4,
});

function Trade({ transaction_id, trader, balance_changes, block_timestamp_nanosec, prices }) {
    let [balanceChanges, setBalanceChanges] = useState('');
    useEffect(() => {
        setBalanceChanges(Object.entries(balance_changes).filter(([_, amountRaw]) => amountRaw !== '0').map(([tokenId, amountRaw], i) => {
            let sign = amountRaw.startsWith('-') ? '-' : '+';
            let token = prices[tokenId];
            let symbol = token?.symbol ?? tokenId;
            let decimals = token?.decimal ?? 0;
            let amount = new BigNumber(amountRaw).abs().shiftedBy(-decimals).toNumber();
            let usdAmount = token ? `($${FORMAT.format(amount * token.price)})` : '';
            return <Fragment key={i}>{`${sign}${FORMAT.format(amount)} ${symbol} ${usdAmount}`}</Fragment>;
        }).reduce((prev, curr) => [prev, <br />, curr]));
    }, [balance_changes, prices]);
    return <tr>
        <td><a href={`https://pikespeak.ai/transaction-viewer/${transaction_id}`}>Tx</a></td>
        <td><a href={`https://pikespeak.ai/wallet-explorer/${trader}`}>{trader}</a></td>
        <td>{balanceChanges}</td>
        <td>{new Date(parseInt(block_timestamp_nanosec.slice(0, -6))).toLocaleString()}</td>
    </tr>;
}

export default Trade;
