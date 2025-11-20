module walrus::blob;

use std::option::Option;
use walrus::storage_resource::Storage;

public struct Blob has key, store {
    id: UID,
    registered_epoch: u32,
    blob_id: u256,
    size: u64,
    encoding_type: u8,
    // Stores the epoch first certified.
    certified_epoch: Option<u32>,
    storage: Storage,
    // Marks if this blob can be deleted.
    deletable: bool,
}
