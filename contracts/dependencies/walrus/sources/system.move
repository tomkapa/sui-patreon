module walrus::system;

use sui::coin::Coin;
use wal::wal::WAL;
use walrus::blob::Blob;

public struct System has key {
    id: UID,
    version: u64,
    package_id: ID,
    new_package_id: Option<ID>,
}

public fun extend_blob(
    self: &mut System,
    blob: &mut Blob,
    extended_epochs: u32,
    payment: &mut Coin<WAL>,
) {
    abort 0
}
