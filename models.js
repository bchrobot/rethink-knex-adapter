function dbModel(kninky, tableName, fields) {
  this.tableName = tableName
  this.kninky = kninky

  this.fields = fields || {}
  this.indexes = {}
  this.pk = 'id'
  this.justCreatedTables = false
}

dbModel.prototype = {
  ensureIndex: function(indexName, indexFunc) {
    var fields = [];
    if (indexFunc) {
      indexFunc(function(fname) {
        fields.push(fname)
      })
    } else {
      fields.push(indexName)
    }
    this.indexes[indexName] = fields;
    if (this.justCreatedTables) {
      this.kninky.k.table(tableName).index(fields)
    }
  },
  get: function(pkVal) {
    return this.kninky.r.table(this.tableName).get(pkVal)
  }
}

function modelType(fieldType) {
  //fieldType needs to be a knex type:
  // http://knexjs.org/#Schema-Building
  this.fieldType = fieldType
  this.required = false
  this.nullable = true
}

modelType.prototype = {
  object: function() {
    //just supporting schema -- no other 'object' types
    // supported for migrations -- change your schema first!
    return {
      schema: function(types) {
        // this needs to return the thing that is parsed/consumed by createModel
        // e.g. thinky.createModel('user', type.object().schema({...}).allowExtra(false))
        var schemaObj = {
          fields: [],
          allowExtra: function(extraAllowed) {
            //extraAllowed is boolean
            schemaObj.extraAllowed = extraAllowed
            return schemaObj
          }
        }
        for (var f in types) {
          schemaObj.fields.push([f, types[f]]);
        } 
        return schemaObj;
      }
    }
  },
  //These need to return a NEW modelType (or other class) that follows builder pattern
  string: function() {
    return new modelType('text')
  },
  boolean: function() {
    return new modelType('boolean')
  },
  number: function() {
    return new modelType('float')
  },
  integer: function() {
    return new modelType('integer')
  },
  date: function() {
    return new modelType('date')
  },
  point: function() {
    //GEO :-(
    // someday use this: https://www.npmjs.com/package/knex-postgis
    throw new Exception("point not supported in knex")
  },

  //Decorators:
  required: function() {
    //not knex-useful, but let's store it
    this.required = true
    return this
  },
  default: function(defaultVal) {
    this.defaultVal = defaultVal
    if (defaultVal.timestamp) {
      delete this.defaultVal
      this.timestamp = defaultVal
      this.fieldType = 'timestamp'
    }
    return this
  },
  allowNull: function(nullable) {
    this.nullable = nullable
    return this
  },
  min: function(minVal) {
    this.minVal = minVal
    return this
  },
  max: function(maxVal) {
    this.maxVal = maxVal
    return this
  },
  enum: function(options) {
    this.options = options
    return this
  },
  //conversion
  stopReference: function() {
    //stops default behavior to link '_id' fields to the referencing table
    this.noReference = true
    return this
  },
  toKnex: function(table, fieldName) {
    var kField = table[this.fieldType](fieldName)
    if (!this.nullable) {
      kField = kField.notNullable()
    }
    if (this.defaultVal) {
      kField = kField.defaultTo(this.defaultVal)
    }
    return kField
  }
}

Object.assign(modelType, modelType.prototype)

module.exports = {
  modelType,
  dbModel
}
