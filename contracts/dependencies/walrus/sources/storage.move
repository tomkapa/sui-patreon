module walrus::storage_resource;

public struct Storage has key, store {
    id: UID,
    start_epoch: u32,
    end_epoch: u32,
    storage_size: u64,
}
