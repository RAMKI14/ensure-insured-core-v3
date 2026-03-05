// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EITCrowdsale.sol";

contract EchidnaCrowdsaleTest {

    EITCrowdsale public sale;

    constructor() payable {
        sale = new EITCrowdsale(
            address(0x1),
            address(0x2),
            address(0x3),
            address(0x4)
        );
    }

    // fuzz purchase attempts
    function fuzzBuy(uint256 amount) public payable {

        amount = amount % 1 ether;

        if (amount == 0) {
            return;
        }

        // attempt purchase
        try sale.buyWithNative{value: amount}(0) {
        } catch {
        }
    }

    // invariant: hard cap never exceeded
    function echidna_hardcap_not_exceeded() public view returns (bool) {
        return sale.totalRaisedUSD() <= sale.HARD_CAP();
    }

    // invariant: tokens sold must not exceed contract balance
    function echidna_tokens_sold_valid() public view returns (bool) {
        return sale.totalTokensSold() <= sale.token().balanceOf(address(sale));
    }
}