#[test_only]
module creator_platform::profile_tests {
    use std::string::{Self, String};
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::test_utils::assert_eq;
    use creator_platform::profile::{Self, CreatorProfile};

    // Test addresses
    const CREATOR: address = @0xA;
    const OTHER_USER: address = @0xB;

    // Helper function to create a test string
    fun test_string(s: vector<u8>): String {
        string::utf8(s)
    }

    // ===== Test: Profile Creation =====

    #[test]
    fun test_create_profile_success() {
        let mut scenario = test::begin(CREATOR);

        // Create profile
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"TestCreator"),
                test_string(b"Test bio for creator"),
                test_string(b"https://example.com/avatar.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // Verify profile was created and transferred to creator
        next_tx(&mut scenario, CREATOR);
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);

            // Verify all fields
            assert_eq(profile.creator(), CREATOR);
            assert_eq(profile.name(), test_string(b"TestCreator"));
            assert_eq(profile.bio(), test_string(b"Test bio for creator"));
            assert_eq(profile.avatar_url(), test_string(b"https://example.com/avatar.png"));
            // In test environment, epoch_timestamp_ms() returns 0
            assert_eq(profile.created_at(), 0);

            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::profile::EInvalidName)]
    fun test_create_profile_empty_name_fails() {
        let mut scenario = test::begin(CREATOR);

        // Try to create profile with empty name - should fail
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b""),  // Empty name
                test_string(b"Test bio"),
                test_string(b"https://example.com/avatar.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        test::end(scenario);
    }

    // ===== Test: Profile Update =====

    #[test]
    fun test_update_profile_success() {
        let mut scenario = test::begin(CREATOR);

        // Create profile
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"TestCreator"),
                test_string(b"Original bio"),
                test_string(b"https://example.com/original.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // Update profile as owner
        next_tx(&mut scenario, CREATOR);
        {
            let mut profile = test::take_from_sender<CreatorProfile>(&scenario);
            let ctx = ctx(&mut scenario);

            profile::update_profile(
                &mut profile,
                test_string(b"Updated bio"),
                test_string(b"https://example.com/updated.png"),
                ctx
            );

            // Verify updates
            assert_eq(profile.bio(), test_string(b"Updated bio"));
            assert_eq(profile.avatar_url(), test_string(b"https://example.com/updated.png"));

            // Verify name and creator didn't change
            assert_eq(profile.name(), test_string(b"TestCreator"));
            assert_eq(profile.creator(), CREATOR);

            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = creator_platform::profile::ENotOwner)]
    fun test_update_profile_unauthorized_fails() {
        let mut scenario = test::begin(CREATOR);

        // Create profile as CREATOR
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"TestCreator"),
                test_string(b"Original bio"),
                test_string(b"https://example.com/original.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // Transfer profile to OTHER_USER for testing
        next_tx(&mut scenario, CREATOR);
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);
            transfer::public_transfer(profile, OTHER_USER);
        };

        // Try to update as OTHER_USER (not the creator) - should fail
        next_tx(&mut scenario, OTHER_USER);
        {
            let mut profile = test::take_from_sender<CreatorProfile>(&scenario);
            let ctx = ctx(&mut scenario);

            profile::update_profile(
                &mut profile,
                test_string(b"Unauthorized update"),
                test_string(b"https://example.com/hacked.png"),
                ctx
            );

            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }

    // ===== Test: View Functions =====

    #[test]
    fun test_view_functions() {
        let mut scenario = test::begin(CREATOR);

        // Create profile
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"ViewTestCreator"),
                test_string(b"View test bio"),
                test_string(b"https://example.com/view.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // Test all view functions
        next_tx(&mut scenario, CREATOR);
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);

            // Test individual getters
            assert_eq(profile.creator(), CREATOR);
            assert_eq(profile.name(), test_string(b"ViewTestCreator"));
            assert_eq(profile.bio(), test_string(b"View test bio"));
            assert_eq(profile.avatar_url(), test_string(b"https://example.com/view.png"));

            // Test created_at is set (returns 0 in test environment)
            let created_at = profile.created_at();
            assert_eq(created_at, 0);

            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }

    // ===== Test: Multiple Profiles =====

    #[test]
    fun test_multiple_creators_can_create_profiles() {
        let mut scenario = test::begin(CREATOR);

        // CREATOR creates a profile
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"Creator1"),
                test_string(b"First creator bio"),
                test_string(b"https://example.com/creator1.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // OTHER_USER creates a profile
        next_tx(&mut scenario, OTHER_USER);
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"Creator2"),
                test_string(b"Second creator bio"),
                test_string(b"https://example.com/creator2.png"),
                ctx
            );
            transfer::public_transfer(profile, OTHER_USER);
        };

        // Verify CREATOR has their profile
        next_tx(&mut scenario, CREATOR);
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);
            assert_eq(profile.name(), test_string(b"Creator1"));
            assert_eq(profile.creator(), CREATOR);
            test::return_to_sender(&scenario, profile);
        };

        // Verify OTHER_USER has their profile
        next_tx(&mut scenario, OTHER_USER);
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);
            assert_eq(profile.name(), test_string(b"Creator2"));
            assert_eq(profile.creator(), OTHER_USER);
            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }

    // ===== Test: Profile Immutability =====

    #[test]
    fun test_profile_immutable_fields() {
        let mut scenario = test::begin(CREATOR);

        // Create profile
        {
            let ctx = ctx(&mut scenario);
            let profile = profile::create_profile(
                test_string(b"ImmutableTest"),
                test_string(b"Original bio"),
                test_string(b"https://example.com/original.png"),
                ctx
            );
            transfer::public_transfer(profile, CREATOR);
        };

        // Get initial values
        next_tx(&mut scenario, CREATOR);
        let original_creator: address;
        let original_name: String;
        let original_created_at: u64;
        {
            let profile = test::take_from_sender<CreatorProfile>(&scenario);
            original_creator = profile.creator();
            original_name = profile.name();
            original_created_at = profile.created_at();
            test::return_to_sender(&scenario, profile);
        };

        // Update profile
        next_tx(&mut scenario, CREATOR);
        {
            let mut profile = test::take_from_sender<CreatorProfile>(&scenario);
            let ctx = ctx(&mut scenario);

            profile::update_profile(
                &mut profile,
                test_string(b"Updated bio"),
                test_string(b"https://example.com/updated.png"),
                ctx
            );

            // Verify immutable fields didn't change
            assert_eq(profile.creator(), original_creator);
            assert_eq(profile.name(), original_name);
            assert_eq(profile.created_at(), original_created_at);

            test::return_to_sender(&scenario, profile);
        };

        test::end(scenario);
    }
}
