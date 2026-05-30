const { Op } = require('sequelize');

const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const convertMongoQueryToSequelize = (query) => {
  if (!query) return {};
  const where = {};
  
  for (const key in query) {
    const val = query[key];
    
    // Ignore location $near query for SQL database filter (handled in memory)
    if (key === 'location') {
      continue;
    }
    
    if (key === '$or' && Array.isArray(val)) {
      where[Op.or] = val.map(q => convertMongoQueryToSequelize(q));
      continue;
    }
    
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Handle $in
      if (val.$in && Array.isArray(val.$in)) {
        where[key] = { [Op.in]: val.$in };
        continue;
      }
      
      // Handle comparison operators
      const opMap = {};
      if (val.$gt !== undefined) opMap[Op.gt] = val.$gt;
      if (val.$gte !== undefined) opMap[Op.gte] = val.$gte;
      if (val.$lt !== undefined) opMap[Op.lt] = val.$lt;
      if (val.$lte !== undefined) opMap[Op.lte] = val.$lte;
      
      if (Object.keys(opMap).length > 0) {
        where[key] = opMap;
        continue;
      }
    }
    
    if (val instanceof RegExp) {
      // Map regex to SQL LIKE
      where[key] = { [Op.like]: `%${val.source}%` };
      continue;
    }
    
    where[key] = val;
  }
  
  return where;
};

class SequelizeQueryBuilder {
  constructor(model, query, findType = 'all') {
    this.model = model;
    this.query = query;
    this.findType = findType;
    
    if (query && typeof query === 'object' && ('where' in query || 'attributes' in query || 'include' in query || 'limit' in query)) {
      this.options = {
        include: [],
        ...query
      };
    } else {
      this.options = {
        where: convertMongoQueryToSequelize(query),
        include: []
      };
    }
  }

  select(fields) {
    if (typeof fields === 'string') {
      const exclude = fields.startsWith('-');
      const fieldList = fields.replace(/[+-]/g, '').split(' ').filter(Boolean);
      
      if (exclude) {
        const allAttributes = Object.keys(this.model.rawAttributes);
        this.options.attributes = allAttributes.filter(attr => !fieldList.includes(attr));
      } else {
        this.options.attributes = fieldList;
      }
    }
    return this;
  }

  sort(sortOption) {
    if (typeof sortOption === 'string') {
      let key = sortOption;
      let dir = 'ASC';
      if (sortOption.startsWith('-')) {
        key = sortOption.substring(1);
        dir = 'DESC';
      }
      this.options.order = [[key, dir]];
    } else if (sortOption && typeof sortOption === 'object') {
      const order = [];
      for (const k in sortOption) {
        order.push([k, sortOption[k] === -1 ? 'DESC' : 'ASC']);
      }
      this.options.order = order;
    }
    return this;
  }

  populate(path) {
    if (!path) return this;
    
    // Parse paths (e.g. 'userId' or 'requesterId')
    const paths = Array.isArray(path) ? path : [path];
    
    for (const p of paths) {
      let alias = p;
      if (typeof p === 'object' && p.path) {
        alias = p.path;
      }
      
      if (alias === 'userId') alias = 'user';
      else if (alias === 'adminUserId') alias = 'adminUser';
      else if (alias === 'requesterId') alias = 'requester';
      else if (alias === 'seekerId') alias = 'seeker';
      else if (alias === 'donorId') alias = 'donor';
      else if (alias === 'bloodBankId') alias = 'bloodBank';
      else if (alias === 'bloodRequestId') alias = 'bloodRequest';
      
      const association = this.model.associations[alias];
      if (association) {
        this.options.include.push({
          association,
          required: false
        });
      }
    }
    return this;
  }

  limit(n) {
    this.options.limit = parseInt(n, 10);
    return this;
  }

  skip(n) {
    this.options.offset = parseInt(n, 10);
    return this;
  }

  lean() {
    return this;
  }

  async execute() {
    let result;
    if (this.findType === 'pk') {
      result = await this.model._rawFindByPk(this.query, this.options);
    } else if (this.findType === 'one') {
      result = await this.model._rawFindOne(this.options);
    } else {
      result = await this.model._rawFindAll(this.options);
      
      // Handle MongoDB Proximity search filter in memory
      if (this.query && this.query.location && this.query.location.$near) {
        const [lng, lat] = this.query.location.$near.$geometry.coordinates;
        const maxDist = this.query.location.$near.$maxDistance || 1000000;
        
        result = result
          .map(item => {
            const distKm = getHaversineDistance(lat, lng, item.latitude, item.longitude);
            item.distance = parseFloat(distKm.toFixed(1));
            return { item, distanceMeters: distKm * 1000 };
          })
          .filter(e => e.distanceMeters <= maxDist)
          .sort((a, b) => a.distanceMeters - b.distanceMeters)
          .map(e => e.item);
      }
    }
    return result;
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

const wrapModel = (Model) => {
  if (Model._isWrapped) return Model;
  Model._isWrapped = true;

  // Store raw references to prevent infinite recursion
  Model._rawFindAll = Model.findAll.bind(Model);
  Model._rawFindOne = Model.findOne.bind(Model);
  Model._rawFindByPk = Model.findByPk.bind(Model);
  Model._rawUpdate = Model.update.bind(Model);
  Model._rawDestroy = Model.destroy.bind(Model);
  Model._rawCount = Model.count.bind(Model);
  Model._rawCreate = Model.create.bind(Model);
  Model._rawBulkCreate = Model.bulkCreate.bind(Model);

  // Add Mongoose instance compatibility
  Model.prototype.toObject = function() {
    return this.get({ plain: true });
  };

  // Add Mongoose class methods
  Model.find = function(query) {
    return new SequelizeQueryBuilder(Model, query, 'all');
  };

  Model.findOne = function(query) {
    return new SequelizeQueryBuilder(Model, query, 'one');
  };

  Model.findById = function(id) {
    return new SequelizeQueryBuilder(Model, id, 'pk');
  };

  Model.findByIdAndUpdate = async function(id, update, options = {}) {
    const instance = await Model._rawFindByPk(id);
    if (!instance) return null;
    
    if (update.$push) {
      for (const key in update.$push) {
        const arr = instance[key] || [];
        arr.push(update.$push[key]);
        instance[key] = arr;
      }
    } else {
      instance.set(update);
    }
    await instance.save();
    return instance;
  };

  Model.findOneAndUpdate = async function(query, update, options = {}) {
    const where = convertMongoQueryToSequelize(query);
    const instance = await Model._rawFindOne({ where });
    if (!instance) return null;
    
    if (update.$push) {
      for (const key in update.$push) {
        const arr = instance[key] || [];
        arr.push(update.$push[key]);
        instance[key] = arr;
      }
    } else {
      instance.set(update);
    }
    await instance.save();
    return instance;
  };

  Model.findOneAndDelete = async function(query) {
    const where = convertMongoQueryToSequelize(query);
    const instance = await Model._rawFindOne({ where });
    if (!instance) return null;
    await instance.destroy();
    return instance;
  };

  Model.updateMany = async function(query, update) {
    const where = convertMongoQueryToSequelize(query);
    const [affectedCount] = await Model._rawUpdate(update, { where });
    return { modifiedCount: affectedCount };
  };

  Model.deleteMany = async function(query = {}) {
    const where = convertMongoQueryToSequelize(query);
    const deletedCount = await Model._rawDestroy(where ? { where } : { truncate: true });
    return { deletedCount };
  };

  Model.countDocuments = async function(query = {}) {
    const where = convertMongoQueryToSequelize(query);
    return await Model._rawCount({ where });
  };

  Model.distinct = async function(field, query = {}) {
    const where = convertMongoQueryToSequelize(query);
    const results = await Model._rawFindAll({
      attributes: [field],
      where,
      group: [field],
      raw: true
    });
    return results.map(r => r[field]);
  };

  return Model;
};

module.exports = {
  wrapModel,
  getHaversineDistance
};
