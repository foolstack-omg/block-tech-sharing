module SwapDeployer::AnimeSwapPoolV1 {
    use aptos_framework::coin::{Coin};

    public fun swap_coins_for_coins<X, Y>(_coins_in: Coin<X>): Coin<Y> {
        abort 0
    }

    public fun get_amounts_in_1_pair<X, Y>(
        _amount_out: u64
    ): u64 {
        abort 0
    }
}
