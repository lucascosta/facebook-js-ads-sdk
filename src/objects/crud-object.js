if (typeof require === 'function')
  var Promise = require('promise');

(function(root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['data-object'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('./data-object.js'));
  } else {
    root.FbApiAssets.CoreObjects.CrudObject = factory(root.FbApiAssets.CoreObjects.DataObject);
  }
}(this, function(DataObject) {
  'use strict';

  /**
   * Crud Object
   * Basic Facebook Object properties operations
   * @param {FacebookAdsApi} api
   * @param {string} endpoint
   * @param {array} fields
   * @param {mixed} [initData]
   * @param {int} [parentId] for new object creation
   * @extends DataObject
   * @class
   */
  function CrudObject(api, endpoint, fields, initData, parentId) {
    if (!endpoint)
      throw new Error('A crud object needs an endpoint');

    initData = initData || {};
    if (initData && typeof initData != 'object')
      initData = {id: initData};

    var _this = new DataObject(fields, initData);

    /**
     * @return {facebookadsapi}
     */
    _this.getApi = function() {
      return api;
    };

    /**
     * @return {string}
     */
    _this.getEndpoint = function() {
      return endpoint;
    };

    /**
     * @return {mixed}
     */
    _this.getParentId = function() {
      if (parentId !== 0 && !parentId)
        throw new Error('parentId not defined');
      return parentId;
    };

    /**
     * @param {mixed} newParentId
     * @return _this
     */
    _this.setParentId = function(newParentId) {
      parentId = newParentId;
      return _this;
    };

    /**
     * @throws {error} if object has no id
     * @return {mixed]}
     */
    _this.getId = function() {
      if (_this.id !== 0 && !_this.id)
        throw new Error('ID not defined');
      return _this.id;
    };

    /**
     * @return {string}
     */
    _this.getNodePath = function() {
      return _this.getId();
    };

    /**
     * Read object data
     * @param {array} [filter] selected fields
     * @param {object} [params] additional params
     * @throws {error} if graph promise is rejected
     * @return {promise} resolves to {object} _this
     */
    _this.read = function(filter, params) {
      var path = _this.getNodePath();
      if (filter) {
        for (var field in filter) {
          if (fields.indexOf(filter[field]) < 0)
            throw new Error('"' + filter[field] + '"" is not a field of this object');
        }
      } else {
        filter = fields;
      }
      params = params || {};
      params.fields = filter;
      return new Promise(function(resolve, reject) {
        api.graph.get(path, params)
          .then(function(data) {
            resolve(_this.setData(data, true));
          })
          .catch(reject);
      });
    };

    /**
     * Create alias for save
     * @param {object} params additional params
     * @throws {error} if object already has an ID
     * @return {promise} resolves to {object} _this
     */
    _this.create = function(params) {
      if (_this.id)
        throw new Error('Object already has an ID. Try updating.');
      var path = _this.getParentId() + '/' + _this.getEndpoint();
      var data = _this.getChangedData();
      return new Promise(function(resolve, reject) {
        api.graph.post(path, params, data)
          .then(function(data) {
            if (data.success) // Validation
              resolve(data);
            else
              resolve(_this.setData(data, true));
          })
          .catch(reject);
      });
    };

    /**
     * Update alias for save
     * @param {object} params additional params
     * @throws {error} if object has no ID
     * @return {promise} resolves to {object} _this
     */
    _this.update = function(params) {
      if (!_this.id)
        throw new Error('Object has no ID. Try creating.');
      var path = _this.getNodePath();
      var data = _this.getChangedData();
      return new Promise(function(resolve, reject) {
        api.graph.post(path, params, data)
          .then(function(data) {
            var isValidation = params && params.execution_options && params.execution_options[0] && params.execution_options[0] == 'validate_only';
            if (!isValidation)
              _this.persistData();
            resolve(data);
          })
          .catch(reject);
      });
    };

    /**
     * Delete object
     * @return {promise} resolves to {object} _this
     */
    _this.delete = function() {
      var path = _this.getNodePath();
      return api.graph.delete(path);
    };

    /**
     * Create or Update alias
     * @param {object} params additional params
     * @return {promise} resolves to {object} _this
     */
    _this.save = function(params) {
      if (_this.id)
        return _this.update(params);
      return _this.create(params);
    };

    return _this;
  }

  return CrudObject;
}));
