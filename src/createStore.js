var RPS = require("./index")
  , _ = require("./utils")
  , FragmentMap = require("./FragmentMap")
  , MixinResolvable = require("./MixinResolvable")
  , MixinSubscribable = require("./MixinSubscribable")
  , StoreSet = require("./StoreSet");


var validDefinitionKeys = [
  "type",
  "initialParams",
  "uri",
  "actions",
  "onlyActions",
  "paramId"
];

function validateDefinition(definition) {
  if (!_.isPlainObject(definition)) {
    throw new TypeError(
      "createStore: You're attempting to pass an invalid definition of type `" + typeof(definition) + "`. " +
      "A valid definition type is a regular object containing key values or a single string value denoting " +
      "the collection type."
    );
  }

  _.each(definition, function(value, key) {
    if (validDefinitionKeys.indexOf(key) == -1) {
      throw new TypeError(
        "createStore: Invalid definition option `" + key + "`."
      );
    }
  });

  if (definition.type && typeof(definition.type) !== "string") {
    throw new TypeError(
      "createStore: Option `type` can only be of type String but found type `" + typeof(definition.type) + "`."
    );
  }

  if (definition.initialParams && !_.isPlainObject(definition.initialParams)) {
    throw new TypeError(
      "createStore: Option `initialParams` can only be of type Object but found " +
      "type `" + typeof(definition.initialParams) + "`."
    );
  }

  if (definition.uri && typeof(definition.uri) !== "string") {
    throw new TypeError(
      "createStore: Option `uri` can only be of type String but found type `" + typeof(definition.uri) + "`."
    );
  }

  if (definition.paramId && typeof(definition.paramId) !== "string") {
    throw new TypeError(
      "createStore: Option `paramId` can only be of type String but found type `" + typeof(definition.paramId) + "`."
    );
  }

  if (definition.actions && !_.isPlainObject(definition.actions)) {
    throw new TypeError(
      "createStore: Option `actions` can only be of type Object but found " +
      "type `" + typeof(definition.actions) + "`."
    );
  }

  if (definition.onlyActions && !_.isPlainObject(definition.onlyActions)) {
    throw new TypeError(
      "createStore: Option `onlyActions` can only be of type Object but found " +
      "type `" + typeof(definition.onlyActions) + "`."
    );
  }
}

/**
 * A store is simply a gateway to a collection of abstract objects via a data
 * store backer to either a named or anonymous collection type/name.
 *
 * Store specific options:
 * @param {String} [optional] type Define the unique name of objects
 *   this Store will manage. If not provided it will use an anonymous name andf
 *   will not be able to be "looked up" from a simple string on a dataset.
 * @param {Object} [optional] initialParams Params that will be used as default
 *   params while an object is being fetched.
 *
 * Common options that Actions/Store/Datasets all share:
 * @param {String} [optional] uri A URI that will be resolve and concat with other
 *   URI's in the action chain.
 * @param {String} [optional] paramId A string identifying the param associated to
 *   the id for a given object.
 * @param {...Action} [optional] actions A list of `actions` can be provided
 *   as additional actions to be allowed to perform on data from this store.
 * @param {...Action} [optional] onlyActions A list of `actions` can be provided
 *   as the new base set actions to be allowed in the hierarchy.
 */
var Store = _.defineClass(MixinResolvable, MixinSubscribable, {
  initialize: function(definition) {
    this.definition = definition;
    this.reset();
  },

  reset: function() {
    this.fragmentMap = new FragmentMap();
  },

  createDataset: function() {
    var dataset = RPS.createDataset.apply(null, arguments);
    dataset.parent = this;
    return dataset;
  },

  // MixinResolvable

  getResolvable: function() {
    return {
      __type: "store",
      __definition: this.definition,
      __reference: this
    };
  },

  //

  notifyChange: function(resourceDescriptor) {
    this.trigger("change");
    if (resourceDescriptor.id) {
      this.trigger(resourceDescriptor.event);
    }
  },

  // Fragment Map is intentionally separate to allow future switching depending
  // on the need; this concept may change.

  fetchResource: function(resourceDescriptor) {
    return this.fragmentMap.fetch(resourceDescriptor);
  },

  touchResource: function(resourceDescriptor, action, data) {
    this.fragmentMap.touch(resourceDescriptor, data);
  },

  updateResource: function(resourceDescriptor, data, status) {
    this.fragmentMap.update(resourceDescriptor, data, status);
  },

  deleteResource: function(resourceDescriptor) {
    this.fragmentMap.delete(resourceDescriptor);
  }
});

function createStore(type, definition) {
  var store;

  if (typeof(type) !== "string") {
    definition = type;
    type = null;
  }

  definition = definition || {};
  validateDefinition(definition);

  if (!type) {
    type = definition.type;
  }

  if (type) {
    definition.type = type;
    store = StoreSet[type];

    if (!store) {
      store = StoreSet[type] = new Store(definition);
    }
    // shadow stores typically come from prefetching when data might be assigned before stores
    // get a chance to be created; so we allow a store to be created and overided when it is a shadow.
    else if (store.definition._shadow) {
      store.definition = definition;
    }
    else {
      throw new TypeError("createStore: Unexpected behavior, found existing Store of " +
      "type `" + type + "` while trying to redefine.");
    }
  }
  else {
    // an anonymous store still has a type for reference
    while (StoreSet[(type = _.randomString(12))]) {}
    definition.type = type;

    store = StoreSet[type] = new Store(definition);
  }

  return store;
}
createStore.prototype = Store;

module.exports = createStore;
