var RPS = require('./index')
  , _ = require('./utils')
  , MixinResolvable = require('./MixinResolvable');


var validDefinitionKeys = [
  "partial",
  "fragments",
  "uri",
  "actions",
  "onlyActions"
];

function validateDefinition(definition) {
  if (!_.isPlainObject(definition)) {
    throw new TypeError(
      "createDataset: You're attempting to pass an invalid definition of type `" + typeof(definition) + "`. " +
      "A valid definition type is either a Dataset, Store or regular object."
    );
  }

  _.each(definition, function(value, key) {
    if (validDefinitionKeys.indexOf(key) == -1) {
      throw new TypeError(
        "createDataset: Invalid definition option `" + key + "`."
      );
    }
  });

  // Does the definition looks like a MixinResolvable
  if (_.isFunction(definition.resolve) && _.isFunction(definition.getResolvable)) {
    return definition;
  }

  if (definition.partial && typeof(definition.partial) !== "string") {
    throw new TypeError(
      "createDataset: Option `partial` can only be of type String but found " +
      "type `" + typeof(definition.partial) + "`."
    );
  }

  if (definition.fragments) {
    var fragments = definition.fragments;
    if (!_.isArray(fragments)) {
      throw new TypeError(
        "createDataset: Option `fragments` can only be of type String but found type `" + typeof(fragments) + "`."
      );
    }

    _.each(fragments, function(value) {
      if (typeof(value) !== "string") {
        throw new TypeError(
          "createDataset: Option `fragments` contains a non-String value `" + typeof(value) + "`."
        );
      }
    });
  }

  if (definition.uri && typeof(definition.uri) !== "string") {
    throw new TypeError(
      "createDataset: Option `uri` can only be of type String but found type `" + typeof(definition.uri) + "`."
    );
  }

  if (definition.actions && !_.isPlainObject(definition.actions)) {
    throw new TypeError(
      "createDataset: Option `actions` can only be of type Object but found " +
      "type `" + typeof(definition.actions) + "`."
    );
  }

  if (definition.onlyActions && !_.isPlainObject(definition.onlyActions)) {
    throw new TypeError(
      "createDataset: Option `onlyActions` can only be of type Object but found " +
      "type `" + typeof(definition.onlyActions) + "`."
    );
  }

  return definition;
}

/**
 * A dataset represents a configuration against a data store that provides an
 * abstract set of object(s).
 *
 * Dataset defiinitons:
 *   <dataset name>: {
 *     uri: "...",
 *     fragments: ["...", ...]
 *   }
 *
 * Dataset specific options:
 * @param {String} [optional] partial When specified, objects that are fetched
 *   through this datset are associated with the specified partial name.
 * @param {Object} [optional] paramMap A lookup map to translate params on the
 *   object to a request.
 * @param {...String} [optional] fragments Specified fragments that are used to
 *   compose objects from this dataset until the "complete" data can be fetched.
 *
 * Common options that Actions/Store/Datasets all share:
 * @param {String} [optional] uri A URI that will be resolve and concat with other
 *   URI's in the action chain.
 * @param {...Action} [optional] actions A list of `actions` can be provided
 *   as additional actions to be allowed to perform on data from this store.
 * @param {...Action} [optional] onlyActions A list of `actions` can be provided
 *   as the new base set actions to be allowed in the hierarchy.
 */
var Dataset = _.defineClass(MixinResolvable, {
  initialize: function(definition) {
    this.definition = definition;
  },

  createDataset: function() {
    var dataset = RPS.createDataset.apply(null, arguments);
    dataset.parent = this;
    return dataset;
  },

  // MixinResolvable

  getResolvable: function() {
    return {
      __type: "dataset",
      __definition: this.definition,
      __ref: this
    };
  }
});

/**
 * RPS.createDataset
 *
 * Accepts a single definition object or one or more resolvables.
 */
 function createDataset() {
  var definitions = [].slice.call(arguments)
    , result = null;

  if (definitions.length == 1) {
    result = validateDefinition(definitions[0]);
  }
  else {
    result = [];
    for (var i = 0; i < definitions.length; i++) {
      var definition = validateDefinition(definitions[i]);

      // If our definition looks like a MixinResolvable then no need to wrap it
      if (definition.resolve && definition.getResolvable) {
        result.push(definition);
      }
      else {
        result.push(RPS.createDataset(definition));
      }
    }
  }

  return new Dataset(result);
}
createDataset.prototype = Dataset;

module.exports = createDataset;
