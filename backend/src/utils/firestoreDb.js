const { db, admin } = require('../config/firebase');
const { generateMongoObjectId } = require('./idUtils');

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

const convertTimestampsToDates = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  const copy = {};
  for (const key in obj) {
    copy[key] = convertTimestampsToDates(obj[key]);
  }
  return copy;
};

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
      } else if (queryVal.$lte !== undefined) {
        if (!(itemVal <= queryVal.$lte)) return false;
      } else if (queryVal.$lt !== undefined) {
        if (!(itemVal < queryVal.$lt)) return false;
      }
    } else if (itemVal?.toString() !== queryVal?.toString()) {
      return false;
    }
  }
  return true;
};

const convertMongoQueryToFirestore = (query, collectionRef) => {
  let queryRef = collectionRef;
  const memoryFilters = [];

  if (!query) return { queryRef, memoryFilters };

  for (const key in query) {
    const val = query[key];
    
    // Proximity search handled in-memory later
    if (key === 'location') {
      continue;
    }

    if (key === '$or' && Array.isArray(val)) {
      memoryFilters.push((item) => {
        return val.some(q => matchQuery(item, q));
      });
      continue;
    }

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$in && Array.isArray(val.$in)) {
        if (val.$in.length > 0) {
          queryRef = queryRef.where(key, 'in', val.$in);
        } else {
          queryRef = queryRef.where(key, '==', '__NON_EXISTENT_VALUE__');
        }
        continue;
      }
      
      let mapped = false;
      if (val.$gt !== undefined) { queryRef = queryRef.where(key, '>', val.$gt); mapped = true; }
      if (val.$gte !== undefined) { queryRef = queryRef.where(key, '>=', val.$gte); mapped = true; }
      if (val.$lt !== undefined) { queryRef = queryRef.where(key, '<', val.$lt); mapped = true; }
      if (val.$lte !== undefined) { queryRef = queryRef.where(key, '<=', val.$lte); mapped = true; }
      if (mapped) continue;
    }

    if (val instanceof RegExp) {
      memoryFilters.push((item) => val.test(item[key]));
      continue;
    }

    if (typeof val === 'object' && val !== null) {
      memoryFilters.push((item) => matchQuery(item, { [key]: val }));
    } else {
      queryRef = queryRef.where(key, '==', val);
    }
  }

  return { queryRef, memoryFilters };
};

const populateField = async (item, path) => {
  let targetCollection;
  let field = path;

  if (path === 'userId' || path === 'adminUserId' || path === 'requesterId' || path === 'seekerId' || path === 'receiverId' || path === 'senderId' || path === 'recipientId') {
    targetCollection = 'users';
  } else if (path === 'donorId') {
    targetCollection = 'donors';
  } else if (path === 'bloodBankId') {
    targetCollection = 'bloodbanks';
  } else if (path === 'bloodRequestId') {
    targetCollection = 'bloodrequests';
  } else if (path === 'donationHistory') {
    targetCollection = 'donations';
  }

  if (!targetCollection || !item[field]) return;

  const idVal = item[field];
  if (Array.isArray(idVal)) {
    const docs = [];
    for (const id of idVal) {
      if (typeof id === 'string') {
        const snap = await db.collection(targetCollection).doc(id).get();
        if (snap.exists) {
          docs.push(convertTimestampsToDates({ _id: snap.id, id: snap.id, ...snap.data() }));
        }
      } else {
        docs.push(id);
      }
    }
    item[field] = docs;
  } else if (typeof idVal === 'string') {
    const snap = await db.collection(targetCollection).doc(idVal).get();
    if (snap.exists) {
      item[field] = convertTimestampsToDates({ _id: snap.id, id: snap.id, ...snap.data() });
    }
  }
};

class FirestoreQueryBuilder {
  constructor(collectionName, query, findType = 'all', model) {
    this.collectionName = collectionName;
    this.query = query;
    this.findType = findType;
    this.model = model;
    
    this.populatePaths = [];
    this.selectFields = null;
    this.sortOption = null;
    this.limitNum = undefined;
    this.skipNum = undefined;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  sort(sortOption) {
    this.sortOption = sortOption;
    return this;
  }

  populate(path) {
    if (path) {
      const paths = Array.isArray(path) ? path : [path];
      this.populatePaths.push(...paths);
    }
    return this;
  }

  limit(n) {
    this.limitNum = parseInt(n, 10);
    return this;
  }

  skip(n) {
    this.skipNum = parseInt(n, 10);
    return this;
  }

  lean() {
    return this;
  }

  async execute() {
    let queryRef = db.collection(this.collectionName);
    let results = [];

    // Resolve by Primary Key if pk query type
    if (this.findType === 'pk') {
      const docId = typeof this.query === 'string' ? this.query : this.query?.toString();
      if (!docId) return null;
      const snap = await queryRef.doc(docId).get();
      if (!snap.exists) return null;
      
      const item = convertTimestampsToDates({ _id: snap.id, id: snap.id, ...snap.data() });
      if (this.populatePaths.length > 0) {
        for (const path of this.populatePaths) {
          await populateField(item, path);
        }
      }
      return this.model.wrapDocument(item);
    }

    // Apply where filters
    const { queryRef: filteredRef, memoryFilters } = convertMongoQueryToFirestore(this.query, queryRef);
    queryRef = filteredRef;

    // Fetch from Firestore
    const snapshot = await queryRef.get();
    snapshot.forEach(doc => {
      results.push(convertTimestampsToDates({ _id: doc.id, id: doc.id, ...doc.data() }));
    });

    // Apply memory filters (e.g. RegExp, $or)
    if (memoryFilters.length > 0) {
      results = results.filter(item => memoryFilters.every(f => f(item)));
    }

    // Apply near location proximity filter in memory
    if (this.query && this.query.location && this.query.location.$near) {
      const [lng, lat] = this.query.location.$near.$geometry.coordinates;
      const maxDist = this.query.location.$near.$maxDistance || 1000000;
      results = results
        .map(item => {
          if (!item.latitude || !item.longitude) return { item, distance: Infinity };
          const distKm = getHaversineDistance(lat, lng, item.latitude, item.longitude);
          return { item, distanceMeters: distKm * 1000 };
        })
        .filter(e => e.distanceMeters <= maxDist)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .map(e => {
          e.item.distance = parseFloat((e.distanceMeters / 1000).toFixed(1));
          return e.item;
        });
    }

    // Apply sort
    if (this.sortOption) {
      let key = 'createdAt';
      let direction = -1;
      if (typeof this.sortOption === 'string') {
        if (this.sortOption.startsWith('-')) {
          key = this.sortOption.substring(1);
          direction = -1;
        } else {
          key = this.sortOption;
          direction = 1;
        }
      } else if (typeof this.sortOption === 'object') {
        key = Object.keys(this.sortOption)[0];
        direction = this.sortOption[key];
      }
      results.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return -direction;
        if (valA > valB) return direction;
        return 0;
      });
    }

    // Apply limit / skip
    if (this.skipNum !== undefined) {
      results = results.slice(this.skipNum);
    }
    if (this.limitNum !== undefined) {
      results = results.slice(0, this.limitNum);
    }

    // Apply populate
    if (this.populatePaths.length > 0) {
      for (const item of results) {
        for (const path of this.populatePaths) {
          await populateField(item, path);
        }
      }
    }

    // Apply select field filtering
    if (this.selectFields) {
      const exclude = this.selectFields.startsWith('-');
      const fieldList = this.selectFields.replace(/[+-]/g, '').split(' ').filter(Boolean);
      results.forEach(item => {
        if (exclude) {
          fieldList.forEach(f => delete item[f]);
        } else {
          Object.keys(item).forEach(k => {
            if (k !== '_id' && !fieldList.includes(k)) delete item[k];
          });
        }
      });
    }

    const wrappedResults = results.map(item => this.model.wrapDocument(item));

    if (this.findType === 'one') {
      return wrappedResults[0] || null;
    }
    return wrappedResults;
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

class FirestoreModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  wrapDocument(data) {
    if (!data) return null;
    const doc = { ...data };
    const self = this;
    
    doc.save = async function() {
      const dataToSave = { ...this };
      delete dataToSave.save;
      delete dataToSave.toObject;
      delete dataToSave._id;
      delete dataToSave.id;
      
      this.updatedAt = new Date();
      dataToSave.updatedAt = this.updatedAt;
      
      const docRef = db.collection(self.collectionName).doc(this._id);
      await docRef.set(dataToSave, { merge: true });
      return this;
    };
    
    doc.toObject = function() {
      const obj = { ...this };
      delete obj.save;
      delete obj.toObject;
      return obj;
    };
    
    return doc;
  }

  async create(data) {
    const items = Array.isArray(data) ? data : [data];
    const created = [];
    
    for (const itemData of items) {
      const docId = itemData._id || generateMongoObjectId();
      const docData = { ...itemData };
      delete docData._id;
      delete docData.id;
      
      docData.createdAt = new Date();
      docData.updatedAt = new Date();
      
      await db.collection(this.collectionName).doc(docId).set(docData);
      
      created.push(this.wrapDocument({ _id: docId, id: docId, ...docData }));
    }
    
    return Array.isArray(data) ? created : created[0];
  }

  find(query = {}) {
    return new FirestoreQueryBuilder(this.collectionName, query, 'all', this);
  }

  findOne(query = {}) {
    return new FirestoreQueryBuilder(this.collectionName, query, 'one', this);
  }

  findById(id) {
    return new FirestoreQueryBuilder(this.collectionName, id, 'pk', this);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!id) return null;
    const snap = await db.collection(this.collectionName).doc(id).get();
    if (!snap.exists) return null;

    const data = snap.data();
    let updatedData = { ...data };

    if (update.$push) {
      for (const k in update.$push) {
        updatedData[k] = updatedData[k] || [];
        updatedData[k].push(JSON.parse(JSON.stringify(update.$push[k])));
      }
    } else {
      const cleanUpdate = { ...update };
      if (cleanUpdate.$set) {
        Object.assign(cleanUpdate, cleanUpdate.$set);
        delete cleanUpdate.$set;
      }
      Object.assign(updatedData, cleanUpdate);
    }

    updatedData.updatedAt = new Date();
    await db.collection(this.collectionName).doc(id).set(updatedData, { merge: true });
    
    return this.wrapDocument(convertTimestampsToDates({ _id: id, id, ...updatedData }));
  }

  async findOneAndUpdate(query, update, options = {}) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'one', this);
    const doc = await builder.execute();
    if (!doc) return null;
    return this.findByIdAndUpdate(doc._id, update, options);
  }

  async findOneAndDelete(query) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'one', this);
    const doc = await builder.execute();
    if (!doc) return null;
    await db.collection(this.collectionName).doc(doc._id).delete();
    return doc;
  }

  async updateMany(query, update) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'all', this);
    const docs = await builder.execute();
    let count = 0;
    for (const doc of docs) {
      if (update.$push) {
        const pushUpdate = {};
        for (const k in update.$push) {
          pushUpdate[k] = admin.firestore.FieldValue.arrayUnion(update.$push[k]);
        }
        await db.collection(this.collectionName).doc(doc._id).update(pushUpdate);
      } else {
        const plainUpdate = { ...update };
        if (plainUpdate.$set) {
          Object.assign(plainUpdate, plainUpdate.$set);
          delete plainUpdate.$set;
        }
        await db.collection(this.collectionName).doc(doc._id).set(plainUpdate, { merge: true });
      }
      count++;
    }
    return { modifiedCount: count };
  }

  async deleteMany(query = {}) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'all', this);
    const docs = await builder.execute();
    let count = 0;
    for (const doc of docs) {
      await db.collection(this.collectionName).doc(doc._id).delete();
      count++;
    }
    return { deletedCount: count };
  }

  async countDocuments(query = {}) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'all', this);
    const docs = await builder.execute();
    return docs.length;
  }

  async distinct(field, query = {}) {
    const builder = new FirestoreQueryBuilder(this.collectionName, query, 'all', this);
    const docs = await builder.execute();
    const set = new Set();
    docs.forEach(d => {
      if (d[field] !== undefined) {
        set.add(d[field]);
      }
    });
    return Array.from(set);
  }
}

const getModel = (collectionName) => {
  return new FirestoreModel(collectionName);
};

module.exports = {
  getModel,
  FirestoreModel,
  Types: {
    ObjectId: class ObjectId {
      constructor(id) {
        this.id = id || generateMongoObjectId();
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
