module creator_platform::profile;

use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};

// Error codes
const EProfileAlreadyExists: u64 = 0;
const EProfileNotFound: u64 = 1;

// ===== Events =====

/// Event emitted when a new creator profile is created
public struct ProfileCreated has copy, drop {
    creator: address,
}

/// Event emitted when a profile is updated
public struct ProfileUpdated has copy, drop {
    creator: address,
}

// ===== Structs =====

public struct ProfileRegistry has key {
    id: UID,
    profiles: Table<address, CreatorProfile>,
}

/// Creator profile NFT - represents a creator's identity on the platform
public struct CreatorProfile has store {
    info: vector<u8>,
    created_at: u64,
}

// ===== Public Functions =====

fun init(ctx: &mut TxContext) {
    transfer::share_object(ProfileRegistry {
        id: object::new(ctx),
        profiles: table::new(ctx),
    });
}

/// Create a new creator profile
/// Profile is returned to allow composability in programmable transactions
public fun create_profile(
    registry: &mut ProfileRegistry,
    info: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let creator = ctx.sender();
    assert!(!registry.profiles.contains(creator), EProfileAlreadyExists);

    let profile = CreatorProfile {
        info,
        created_at: clock.timestamp_ms(),
    };

    registry.profiles.add(creator, profile);
    event::emit(ProfileCreated { creator });
}

/// Update profile information
/// Only the profile owner can update their profile
public fun update_profile(registry: &mut ProfileRegistry, info: vector<u8>, ctx: &TxContext) {
    let creator = ctx.sender();
    assert!(registry.profiles.contains(creator), EProfileNotFound);

    registry.profiles.borrow_mut(creator).info = info;
    event::emit(ProfileUpdated { creator });
}
