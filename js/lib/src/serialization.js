function deserialize_float32array(data, manager) {
    return new Float32Array(data.data.buffer);
}

function deserialize_uint32array(data, manager) {
    return new Uint32Array(data.data.buffer);
}

function serialize_array_or_json(obj, manager) {
    return obj;
}

module.exports = {
    float32array: { deserialize: deserialize_float32array, serialize: serialize_array_or_json },
    uint32array: { deserialize: deserialize_uint32array, serialize: serialize_array_or_json }
}
