#[test_only]
module creator_platform::subscription_tests {
    use std::string::{Self, String};
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::test_utils::assert_eq;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use creator_platform::subscription::{Self, SubscriptionTier, ActiveSubscription};

    // Test addresses
    const CREATOR: address = @0xA;
    const OTHER_USER: address = @0xB;
    const SUBSCRIBER: address = @0xC;

    // Helper function to create a test string
    fun test_string(s: vector<u8>): String {
        string::utf8(s)
    }

    // ===== Test: Tier Creation =====

    #[test]
    fun test_create_tier_valid_price() {
        let mut scenario = test::begin(CREATOR);

        // Create tier with valid price
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Access to basic content"),
                subscription::sui_to_mist(5), // 5 SUI/month
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Verify tier was created and shared
        next_tx(&mut scenario, CREATOR);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);

            // Verify all fields
            assert_eq(tier.creator(), CREATOR);
            assert_eq(tier.name(), test_string(b"Basic Tier"));
            assert_eq(tier.description(), test_string(b"Access to basic content"));
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(5));
            assert_eq(tier.is_active(), true);
            assert_eq(tier.created_at(), 0); // Test environment returns 0

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_create_tier_minimal_price() {
        let mut scenario = test::begin(CREATOR);

        // Create tier with minimal price (1 MIST)
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Free Tier"),
                test_string(b"Free content access"),
                1, // 1 MIST (minimal non-zero)
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Verify tier was created
        next_tx(&mut scenario, CREATOR);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.price_monthly(), 1);
            assert_eq(tier.is_active(), true);
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::EInvalidPrice)]
    fun test_create_tier_zero_price_fails() {
        let mut scenario = test::begin(CREATOR);

        // Try to create tier with zero price - should fail
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Invalid Tier"),
                test_string(b"Should fail"),
                0, // Zero price not allowed
                ctx
            );
            transfer::public_share_object(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::EInvalidName)]
    fun test_create_tier_empty_name_fails() {
        let mut scenario = test::begin(CREATOR);

        // Try to create tier with empty name - should fail
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b""), // Empty name
                test_string(b"Valid description"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_create_multiple_tiers_same_creator() {
        let mut scenario = test::begin(CREATOR);

        // Create first tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Create second tier
        next_tx(&mut scenario, CREATOR);
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Premium Tier"),
                test_string(b"Premium content"),
                subscription::sui_to_mist(10),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Both tiers should exist and be accessible
        // Verify we can take the most recent shared tier (Premium Tier)
        next_tx(&mut scenario, CREATOR);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            // Should be the most recently created tier (Premium)
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(10));
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: Price Updates =====

    #[test]
    fun test_update_price_by_creator() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Update price as creator
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let old_price = tier.price_monthly();
            let new_price = subscription::sui_to_mist(10);

            subscription::update_tier_price(&mut tier, new_price, ctx);

            // Verify price was updated
            assert_eq(tier.price_monthly(), new_price);
            assert!(tier.price_monthly() != old_price, 0);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::ENotCreator)]
    fun test_update_price_unauthorized() {
        let mut scenario = test::begin(CREATOR);

        // Create tier as CREATOR
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Try to update price as OTHER_USER - should fail
        next_tx(&mut scenario, OTHER_USER);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            subscription::update_tier_price(
                &mut tier,
                subscription::sui_to_mist(1), // Try to lower price
                ctx
            );

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::EInvalidPrice)]
    fun test_update_price_to_zero_fails() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Try to update price to zero - should fail
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            subscription::update_tier_price(&mut tier, 0, ctx);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_update_price_multiple_times() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // First price update
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::update_tier_price(&mut tier, subscription::sui_to_mist(8), ctx);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(8));
            test::return_shared(tier);
        };

        // Second price update
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::update_tier_price(&mut tier, subscription::sui_to_mist(12), ctx);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(12));
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: Tier Deactivation =====

    #[test]
    fun test_deactivate_tier() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Deactivate tier as creator
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            assert_eq(tier.is_active(), true); // Initially active
            subscription::deactivate_tier(&mut tier, ctx);
            assert_eq(tier.is_active(), false); // Now inactive

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::ENotCreator)]
    fun test_deactivate_tier_unauthorized() {
        let mut scenario = test::begin(CREATOR);

        // Create tier as CREATOR
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Try to deactivate as OTHER_USER - should fail
        next_tx(&mut scenario, OTHER_USER);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            subscription::deactivate_tier(&mut tier, ctx);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_inactive_tier_remains_accessible() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Deactivate tier
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::deactivate_tier(&mut tier, ctx);
            test::return_shared(tier);
        };

        // Verify tier is still accessible and readable after deactivation
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);

            // Can still read all fields
            assert_eq(tier.is_active(), false);
            assert_eq(tier.name(), test_string(b"Basic Tier"));
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(5));
            assert_eq(tier.creator(), CREATOR);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::ETierInactive)]
    fun test_assert_tier_active_fails_when_inactive() {
        let mut scenario = test::begin(CREATOR);

        // Create and deactivate tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::deactivate_tier(&mut tier, ctx);
            test::return_shared(tier);
        };

        // Try to assert tier is active - should fail
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            subscription::assert_tier_active(&tier);
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: View Functions =====

    #[test]
    fun test_view_functions() {
        let mut scenario = test::begin(CREATOR);

        // Create tier with specific values
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"View Test Tier"),
                test_string(b"Test description for views"),
                subscription::sui_to_mist(7),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Test all view functions
        next_tx(&mut scenario, CREATOR);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);

            // Test individual getters
            assert_eq(tier.creator(), CREATOR);
            assert_eq(tier.name(), test_string(b"View Test Tier"));
            assert_eq(tier.description(), test_string(b"Test description for views"));
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(7));
            assert_eq(tier.is_active(), true);
            assert_eq(tier.created_at(), 0); // Test environment returns 0

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: Price Conversion Helpers =====

    #[test]
    fun test_price_conversion_sui_to_mist() {
        // Test SUI to MIST conversion
        let mist_per_sui = subscription::get_mist_per_sui();

        assert_eq(subscription::sui_to_mist(1), mist_per_sui);
        assert_eq(subscription::sui_to_mist(5), 5 * mist_per_sui);
        assert_eq(subscription::sui_to_mist(10), 10 * mist_per_sui);
        assert_eq(subscription::sui_to_mist(0), 0);
    }

    #[test]
    fun test_price_conversion_mist_to_sui() {
        let mist_per_sui = subscription::get_mist_per_sui();

        // Test MIST to SUI conversion (rounds down)
        assert_eq(subscription::mist_to_sui(mist_per_sui), 1);
        assert_eq(subscription::mist_to_sui(5 * mist_per_sui), 5);
        assert_eq(subscription::mist_to_sui(10 * mist_per_sui), 10);
        assert_eq(subscription::mist_to_sui(0), 0);

        // Test rounding down for partial amounts
        assert_eq(subscription::mist_to_sui(mist_per_sui + 1), 1);
        assert_eq(subscription::mist_to_sui(mist_per_sui - 1), 0);
    }

    #[test]
    fun test_price_conversion_round_trip() {
        let mist_per_sui = subscription::get_mist_per_sui();

        // Test round-trip conversion for whole SUI amounts
        let sui_amount = 15u64;
        let mist_amount = subscription::sui_to_mist(sui_amount);
        let back_to_sui = subscription::mist_to_sui(mist_amount);

        assert_eq(back_to_sui, sui_amount);
        assert_eq(mist_amount, sui_amount * mist_per_sui);
    }

    // ===== Test: Shared Object Behavior =====

    #[test]
    fun test_concurrent_tier_access() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Concurrent Tier"),
                test_string(b"Test concurrent access"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // User 1 reads tier
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.name(), test_string(b"Concurrent Tier"));
            test::return_shared(tier);
        };

        // User 2 (creator) updates price
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::update_tier_price(&mut tier, subscription::sui_to_mist(8), ctx);
            test::return_shared(tier);
        };

        // User 1 reads updated tier
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(8));
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: Integration Scenarios =====

    #[test]
    fun test_full_tier_lifecycle() {
        let mut scenario = test::begin(CREATOR);

        // 1. Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Lifecycle Tier"),
                test_string(b"Full lifecycle test"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // 2. Verify initial state
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.is_active(), true);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(5));
            test::return_shared(tier);
        };

        // 3. Update price
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::update_tier_price(&mut tier, subscription::sui_to_mist(7), ctx);
            test::return_shared(tier);
        };

        // 4. Verify price update
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(7));
            test::return_shared(tier);
        };

        // 5. Deactivate tier
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::deactivate_tier(&mut tier, ctx);
            test::return_shared(tier);
        };

        // 6. Verify deactivation
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            assert_eq(tier.is_active(), false);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(7)); // Price unchanged
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_multiple_creators_with_tiers() {
        let mut scenario = test::begin(CREATOR);

        // Creator 1 creates a tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Creator1 Tier"),
                test_string(b"First creator's tier"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Creator 2 creates a tier
        next_tx(&mut scenario, OTHER_USER);
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Creator2 Tier"),
                test_string(b"Second creator's tier"),
                subscription::sui_to_mist(10),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Both tiers exist independently
        // Verify second creator's tier
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            // Verify it's the second creator's tier
            assert_eq(tier.creator(), OTHER_USER);
            assert_eq(tier.price_monthly(), subscription::sui_to_mist(10));
            test::return_shared(tier);
        };

        test::end(scenario);
    }

    // ===== Test: Subscription Purchase =====

    #[test]
    fun test_purchase_exact_amount() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription with exact amount
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            // Create payment coin with exact tier price
            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);

            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify subscription was created and transferred to subscriber
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);

            // Verify subscription fields
            assert_eq(sub.subscriber(), SUBSCRIBER);
            assert_eq(sub.subscription_creator(), CREATOR);
            assert_eq(sub.subscription_tier_name(), test_string(b"Basic Tier"));
            assert_eq(sub.started_at(), 0); // Test environment timestamp

            // Verify expiration is 30 days from start
            let expected_expiration = subscription::get_subscription_duration_days() * subscription::get_milliseconds_per_day();
            assert_eq(sub.expires_at(), expected_expiration);

            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    fun test_purchase_overpayment() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Premium Tier"),
                test_string(b"Premium content"),
                subscription::sui_to_mist(10),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription with overpayment (should succeed)
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            // Pay more than required (15 SUI for 10 SUI tier)
            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(15), ctx);

            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify subscription was created
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);
            assert_eq(sub.subscriber(), SUBSCRIBER);
            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::EInsufficientPayment)]
    fun test_purchase_underpayment() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Try to purchase with insufficient payment - should fail
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            // Pay less than required (3 SUI for 5 SUI tier)
            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(3), ctx);

            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::subscription::ETierInactive)]
    fun test_purchase_inactive_tier() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Deactivate tier
        next_tx(&mut scenario, CREATOR);
        {
            let mut tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            subscription::deactivate_tier(&mut tier, ctx);
            test::return_shared(tier);
        };

        // Try to purchase inactive tier - should fail
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);

            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        test::end(scenario);
    }

    #[test]
    fun test_expiration_calculation() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify expiration calculation
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);

            let started_at = sub.started_at();
            let expires_at = sub.expires_at();

            // Calculate expected expiration (30 days in milliseconds)
            let expected_duration = subscription::get_subscription_duration_days() *
                                   subscription::get_milliseconds_per_day();
            let expected_expiration = started_at + expected_duration;

            assert_eq(expires_at, expected_expiration);

            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    fun test_is_active_unexpired() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify subscription is active
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);
            let ctx = ctx(&mut scenario);

            // In test environment, time doesn't advance, so subscription should be active
            assert_eq(subscription::is_subscription_active(&sub, ctx), true);

            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    fun test_multiple_subscriptions_same_tier() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // First subscriber purchases
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Second subscriber purchases
        next_tx(&mut scenario, OTHER_USER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify first subscriber has subscription
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);
            assert_eq(sub.subscriber(), SUBSCRIBER);
            test::return_to_sender(&scenario, sub);
        };

        // Verify second subscriber has subscription
        next_tx(&mut scenario, OTHER_USER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);
            assert_eq(sub.subscriber(), OTHER_USER);
            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    fun test_subscription_nft_fields() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Premium Tier"),
                test_string(b"Premium content"),
                subscription::sui_to_mist(10),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);
            let tier_id = object::id(&tier);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(10), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify all subscription NFT fields
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);

            // Verify all fields match expectations
            assert_eq(sub.subscriber(), SUBSCRIBER);
            assert_eq(sub.subscription_creator(), CREATOR);
            assert_eq(sub.tier_id(), object::id(&tier));
            assert_eq(sub.subscription_tier_name(), test_string(b"Premium Tier"));

            // Verify timestamps
            let started_at = sub.started_at();
            let expires_at = sub.expires_at();
            let expected_duration = subscription::get_subscription_duration_days() *
                                   subscription::get_milliseconds_per_day();
            assert_eq(expires_at, started_at + expected_duration);

            test::return_shared(tier);
            test::return_to_sender(&scenario, sub);
        };

        test::end(scenario);
    }

    #[test]
    fun test_payment_transfer_to_creator() {
        let mut scenario = test::begin(CREATOR);

        // Create tier
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Basic Tier"),
                test_string(b"Basic content"),
                subscription::sui_to_mist(5),
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase subscription
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(subscription::sui_to_mist(5), ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify creator received payment
        next_tx(&mut scenario, CREATOR);
        {
            // Creator should have the payment coin
            let payment_coin = test::take_from_sender<Coin<SUI>>(&scenario);
            assert_eq(payment_coin.value(), subscription::sui_to_mist(5));
            test::return_to_sender(&scenario, payment_coin);
        };

        test::end(scenario);
    }

    #[test]
    fun test_subscription_with_different_denominations() {
        let mut scenario = test::begin(CREATOR);

        // Create tier with non-round price
        {
            let ctx = ctx(&mut scenario);
            let tier = subscription::create_tier(
                test_string(b"Custom Tier"),
                test_string(b"Custom pricing"),
                7_500_000_000, // 7.5 SUI
                ctx
            );
            transfer::public_share_object(tier);
        };

        // Purchase with exact amount
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let tier = test::take_shared<SubscriptionTier>(&scenario);
            let ctx = ctx(&mut scenario);

            let payment = coin::mint_for_testing<SUI>(7_500_000_000, ctx);
            subscription::purchase_subscription(&tier, payment, ctx);

            test::return_shared(tier);
        };

        // Verify subscription created
        next_tx(&mut scenario, SUBSCRIBER);
        {
            let sub = test::take_from_sender<ActiveSubscription>(&scenario);
            assert_eq(sub.subscriber(), SUBSCRIBER);
            test::return_to_sender(&scenario, sub);
        };

        // Verify creator received exact payment
        next_tx(&mut scenario, CREATOR);
        {
            let payment_coin = test::take_from_sender<Coin<SUI>>(&scenario);
            assert_eq(payment_coin.value(), 7_500_000_000);
            test::return_to_sender(&scenario, payment_coin);
        };

        test::end(scenario);
    }
}
