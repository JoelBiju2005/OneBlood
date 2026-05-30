const fs = require('fs');
const path = require('path');
const { getDistanceKm } = require('./geoUtils');

const DB_FILE = path.join(__dirname, '../../memory_db.json');

// Global in-memory storage structure
let collections = {
  User: [],
  Donor: [],
  BloodBank: [],
  BloodRequest: [],
  Notification: [],
  Donation: []
};

// Load existing database from file if it exists
const loadData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf8');
      collections = JSON.parse(fileData);
      console.log(`💾 Loaded memory database from ${DB_FILE}`);
    }
  } catch (error) {
    console.error('Failed to load memory database file, starting clean.', error.message);
  }
};

// Save database state to file
const saveToDisk = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(collections, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save memory database state to disk.', error.message);
  }
};

// Initial load
loadData();

const mongooseMock = {
  Types: {
    ObjectId: class ObjectId {
      constructor(id) {
        // Generate a 24-character hex string representing a MongoDB ObjectId
        this.id = id || `${Math.floor(Math.random() * 1000000000).toString(16).padStart(24, '0')}`;
      }
      toString() {
        return this.id;
      }
      equals(other) {
        return this.toString() === other?.toString();
      }
    }
  }
};

class QueryBuilder {
  constructor(results, modelName) {
    this.results = results;
    this.modelName = modelName;
  }

  populate(path) {
    if (!this.results) return this;
    const isArray = Array.isArray(this.results);
    const items = isArray ? this.results : [this.results];

    items.forEach(item => {
      if (path === 'userId' && item.userId) {
        const user = collections.User.find(u => u._id.toString() === item.userId.toString());
        if (user) item.userId = user;
      } else if (path === 'requesterId' && item.requesterId) {
        const user = collections.User.find(u => u._id.toString() === item.requesterId.toString());
        if (user) item.requesterId = user;
      } else if (path === 'donorId' && item.donorId) {
        const donor = collections.Donor.find(d => d._id.toString() === item.donorId.toString());
        if (donor) item.donorId = donor;
      } else if (path === 'bloodBankId' && item.bloodBankId) {
        const bank = collections.BloodBank.find(b => b._id.toString() === item.bloodBankId.toString());
        if (bank) item.bloodBankId = bank;
      } else if (path === 'donationHistory' && item.donationHistory) {
        item.donationHistory = item.donationHistory.map(id => 
          collections.Donation.find(d => d._id.toString() === id.toString()) || id
        );
      }
    });

    return this;
  }

  select(fields) {
    if (!this.results || !fields) return this;
    
    const isArray = Array.isArray(this.results);
    const items = isArray ? this.results : [this.results];
    
    const exclude = fields.startsWith('-');
    const fieldList = fields.replace(/[+-]/g, '').split(' ').filter(Boolean);

    items.forEach(item => {
      if (exclude) {
        fieldList.forEach(f => delete item[f]);
      } else {
        Object.keys(item).forEach(k => {
          if (k !== '_id' && !fieldList.includes(k)) delete item[k];
        });
      }
    });

    return this;
  }

  sort(sortOption) {
    if (!this.results || !Array.isArray(this.results)) return this;
    
    let key = 'createdAt';
    let direction = -1;

    if (typeof sortOption === 'string') {
      if (sortOption.startsWith('-')) {
        key = sortOption.substring(1);
        direction = -1;
      } else {
        key = sortOption;
        direction = 1;
      }
    } else if (sortOption && typeof sortOption === 'object') {
      key = Object.keys(sortOption)[0];
      direction = sortOption[key];
    }

    this.results.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA < valB) return -direction;
      if (valA > valB) return direction;
      return 0;
    });

    return this;
  }

  then(onFulfilled, onRejected) {
    return Promise.resolve(this.results).then(onFulfilled, onRejected);
  }
}

const matchQuery = (item, query) => {
  for (const key in query) {
    if (key === '$or' && Array.isArray(query.$or)) {
      const matchOr = query.$or.some(q => matchQuery(item, q));
      if (!matchOr) return false;
      continue;
    }
    
    if (key === 'location') continue;
    if (key.includes('.')) {
      const parts = key.split('.');
      let val = item;
      for (const part of parts) {
        val = val?.[part];
      }
      const qVal = query[key];
      if (qVal && typeof qVal === 'object' && qVal.$gte !== undefined) {
        if (!(val >= qVal.$gte)) return false;
      } else if (val !== qVal) {
        return false;
      }
      continue;
    }

    const itemVal = item[key];
    const queryVal = query[key];

    if (queryVal instanceof RegExp) {
      if (!queryVal.test(itemVal)) return false;
    } else if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
      const isObjectId = queryVal._bsontype === 'ObjectID' || 
                         queryVal.constructor?.name === 'ObjectId' || 
                         queryVal.constructor?.name === 'ObjectID';
      if (isObjectId) {
        if (itemVal?.toString() !== queryVal.toString()) return false;
      } else if (queryVal.$in && Array.isArray(queryVal.$in)) {
        if (!queryVal.$in.includes(itemVal)) return false;
      } else if (queryVal.$gte !== undefined) {
        if (!(itemVal >= queryVal.$gte)) return false;
      } else if (queryVal.$gt !== undefined) {
        if (!(itemVal > queryVal.$gt)) return false;
      }
    } else if (itemVal?.toString() !== queryVal?.toString()) {
      return false;
    }
  }
  return true;
};

const getModel = (modelName) => {
  const list = collections[modelName] || [];

  const documentWrapper = (data) => {
    const doc = JSON.parse(JSON.stringify(data));
    doc._id = doc._id || new mongooseMock.Types.ObjectId().toString();
    
    doc.save = async function() {
      const index = list.findIndex(item => item._id.toString() === this._id.toString());
      this.updatedAt = new Date();
      if (index !== -1) {
        list[index] = { ...list[index], ...JSON.parse(JSON.stringify(this)) };
      } else {
        this.createdAt = this.createdAt || new Date();
        list.push(JSON.parse(JSON.stringify(this)));
      }
      saveToDisk();
      return this;
    };
    
    doc.toObject = function() {
      const obj = { ...this };
      delete obj.save;
      delete obj.toObject;
      return obj;
    };

    return doc;
  };

  return {
    create: async (data) => {
      const items = Array.isArray(data) ? data : [data];
      const created = [];
      
      for (const itemData of items) {
        const doc = documentWrapper(itemData);
        doc.createdAt = new Date();
        doc.updatedAt = new Date();
        list.push(doc);
        created.push(doc);
      }
      
      saveToDisk();
      return Array.isArray(data) ? created : created[0];
    },

    find: (query = {}) => {
      let filtered = [...list];

      if (query.location && query.location.$near) {
        const [lng, lat] = query.location.$near.$geometry.coordinates;
        const maxDist = query.location.$near.$maxDistance || 1000000;
        
        filtered = filtered
          .map(item => {
            if (!item.location || !item.location.coordinates) return { item, distance: Infinity };
            const [itemLng, itemLat] = item.location.coordinates;
            const distKm = getDistanceKm(lat, lng, itemLat, itemLng);
            return { item, distance: distKm * 1000 };
          })
          .filter(e => e.distance <= maxDist)
          .sort((a, b) => a.distance - b.distance)
          .map(e => {
            e.item.distance = parseFloat((e.distance / 1000).toFixed(1));
            return e.item;
          });
      }

      filtered = filtered.filter(item => matchQuery(item, query));
      filtered = JSON.parse(JSON.stringify(filtered)).map(documentWrapper);
      
      return new QueryBuilder(filtered, modelName);
    },

    findOne: (query = {}) => {
      let filtered = list.filter(item => matchQuery(item, query));
      if (filtered.length === 0) return new QueryBuilder(null, modelName);
      
      const copy = documentWrapper(JSON.parse(JSON.stringify(filtered[0])));
      return new QueryBuilder(copy, modelName);
    },

    findById: (id) => {
      if (!id) return new QueryBuilder(null, modelName);
      const found = list.find(item => item._id.toString() === id.toString());
      if (!found) return new QueryBuilder(null, modelName);
      
      const copy = documentWrapper(JSON.parse(JSON.stringify(found)));
      return new QueryBuilder(copy, modelName);
    },

    findOneAndUpdate: async (query, update, options = {}) => {
      const found = list.find(item => matchQuery(item, query));
      if (!found) return null;

      Object.assign(found, JSON.parse(JSON.stringify(update)));
      found.updatedAt = new Date();
      saveToDisk();
      return documentWrapper(JSON.parse(JSON.stringify(found)));
    },

    findByIdAndUpdate: async (id, update, options = {}) => {
      if (!id) return null;
      const found = list.find(item => item._id.toString() === id.toString());
      if (!found) return null;

      if (update.$push) {
        for (const k in update.$push) {
          found[k] = found[k] || [];
          found[k].push(JSON.parse(JSON.stringify(update.$push[k])));
        }
      } else {
        Object.assign(found, JSON.parse(JSON.stringify(update)));
      }
      
      found.updatedAt = new Date();
      saveToDisk();
      return documentWrapper(JSON.parse(JSON.stringify(found)));
    },

    findOneAndDelete: async (query) => {
      const index = list.findIndex(item => matchQuery(item, query));
      if (index === -1) return null;
      
      const deleted = list.splice(index, 1)[0];
      saveToDisk();
      return documentWrapper(JSON.parse(JSON.stringify(deleted)));
    },

    updateMany: async (query, update) => {
      const matches = list.filter(item => matchQuery(item, query));
      matches.forEach(item => {
        Object.assign(item, JSON.parse(JSON.stringify(update)));
        item.updatedAt = new Date();
      });
      saveToDisk();
      return { modifiedCount: matches.length };
    },

    countDocuments: async (query = {}) => {
      const filtered = list.filter(item => matchQuery(item, query));
      return filtered.length;
    },

    deleteMany: async (query = {}) => {
      if (Object.keys(query).length === 0) {
        list.length = 0;
      } else {
        const kept = list.filter(item => !matchQuery(item, query));
        list.length = 0;
        list.push(...kept);
      }
      saveToDisk();
      return { deletedCount: list.length };
    }
  };
};

module.exports = {
  getModel,
  Types: mongooseMock.Types,
  collections
};
