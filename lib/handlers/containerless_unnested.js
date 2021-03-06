var _ = require("../utils")
  , containerless_unnested;


function parseObject(object) {
  if (!_.isPlainObject(object)) {
    throw new TypeError(
      "containerless_unnested:parseObject: expected object type but found `" + typeof(object) + "`."
    );
  }

  var result = {}
    , data = (result.data = {});

  _.each(object, function(value, key) {
    if (key[0] === '_') {
      if (key === "_type") {
        result.type = value;
      }
      else if (key === "_partial") {
        result.partial = value;
      }
      else {
        console.warn("containerless_unnested:parseObject: ignoring unknown object property `" + key + "`");
      }

      return;
    }

    // while parsing an object, any array/object is considered embedded data
    // so we just treat it like the start of a unknown request
    if (_.isArray(value) || _.isPlainObject(value)) {
      containerless_unnested(value);
    }
    else {
      data[key] = value;
    }
  });

  return result;
}

function containerless_unnested(data, descriptor) {
  var result = null
    , discoveredType = null
    , discoveredPartial = null;

  descriptor = descriptor || {};

  // collection
  if (_.isArray(data)) {
    result = [];

    for (var i = 0; i < data.length; i++) {
      var object = data[i]
        , entry = parseObject(object);

      if (entry.type) {
        if (discoveredType && discoveredType !== entry.type) {
          throw new TypeError(
            "containerless_unnested: Found conflicting types inside array of `" + discoveredType +
            "` and `" + entry.type + "`."
          );
        }
        discoveredType = entry.type;
      }

      if (entry.partial) {
        if (discoveredPartial && discoveredPartial !== entry.partial) {
          throw new TypeError(
            "containerless_unnested: Found conflicting partials inside array of `" + discoveredPartial +
            "` and `" + entry.partial + "`."
          );
        }
        discoveredPartial = entry.partial;
      }

      result.push(entry.data);
    }
  }
  // non-collection
  else {
    var resource = parseObject(data);

    result = resource.data;
    discoveredType = resource.type;
    discoveredPartial = resource.partial;
  }

  return {
    type: discoveredType,
    partial: discoveredPartial,
    data: result
  };
}

module.exports = containerless_unnested;
