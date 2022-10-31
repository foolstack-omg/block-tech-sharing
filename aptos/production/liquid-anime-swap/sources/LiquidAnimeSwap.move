module lmao::liquid_anime_swap_v2 {
    use std::signer;
    use aptos_framework::coin::{Self};
    use liquidswap::router;
    use SwapDeployer::AnimeSwapPoolV1;

    const ERR_NO_PROFIT: u64 = 101;

    public entry fun swap<X, Y, Curve>(account: &signer, amount_in: u64, atob: bool, gas: u64) {
        let account_addr = signer::address_of(account);
        if (!coin::is_account_registered<X>(account_addr)) {
            coin::register<X>(account);
        };
        if (!coin::is_account_registered<Y>(account_addr)) {
            coin::register<Y>(account);
        };
        let balanceBefore = coin::balance<X>(account_addr);
        if(atob) {
            if(balanceBefore < amount_in) {
                amount_in = balanceBefore;
            };
            let coin_x_in = coin::withdraw<X>(account, amount_in);
            let coin_x_in_amount = coin::value(&coin_x_in);
            let coin_y_out = router::swap_exact_coin_for_coin<X,Y,Curve>(coin_x_in, 0);
            let coin_x_out = AnimeSwapPoolV1::swap_coins_for_coins<Y,X>(coin_y_out);
            
            assert!(coin_x_in_amount + gas < coin::value(&coin_x_out), ERR_NO_PROFIT);
            coin::deposit(account_addr, coin_x_out);
        } else {
            let amount_x_in = AnimeSwapPoolV1::get_amounts_in_1_pair<X,Y>(amount_in);
            if(balanceBefore < amount_x_in) {
                amount_x_in = balanceBefore;
            };
            let coin_x_in = coin::withdraw<X>(account, amount_x_in);
            let coin_x_in_amount = coin::value(&coin_x_in);
            let coin_y_out = AnimeSwapPoolV1::swap_coins_for_coins<X,Y>(coin_x_in);
            let coin_x_out = router::swap_exact_coin_for_coin<Y,X,Curve>(coin_y_out, 0);
            assert!(coin_x_in_amount + gas < coin::value(&coin_x_out), ERR_NO_PROFIT);
            coin::deposit(account_addr, coin_x_out);
        };
    }
   
}