import firebase from "./FirebaseConfig";
import {
  addDoc,
  doc,
  getDoc,
  collection as firetoreCollection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore/lite";

const firestore = firebase.firestore;

const createDocument = (collection, document) => {
  return addDoc(firetoreCollection(firestore, collection), document);
  // return firestore.collection(collection).add(document);
};

const readDocument = (collection, id) => {
  return getDoc(doc(firetoreCollection(firestore, collection)), id);
  // return firestore.collection(collection).doc(id).get();
};

const readDocuments = async ({
  collection,
  queries,
  orderByField,
  orderByDirection,
  perPage,
  cursorId,
}) => {
  const collectionRef = firetoreCollection(firestore, collection);
  // let collectionRef = firestore.collection(collection);
  const queryConstraints = [];
  if (queries && queries.length > 0) {
    for (const query of queries) {
      // collectionRef = collectionRef.where(
      //   query.field,
      //   query.condition,
      //   query.value
      // );
      queryConstraints.push(where(query.field, query.condition, query.value));
    }
  }
  if (orderByField && orderByDirection) {
    // collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
    queryConstraints.push(orderBy(orderByField, orderByDirection));
  }

  if (perPage) {
    // collectionRef = collectionRef.limit(perPage);
    queryConstraints.push(limit(perPage));
  }

  if (cursorId) {
    const document = await readDocument(collection, cursorId);
    // collectionRef = collectionRef.startAfter(document);
    queryConstraints.push(startAfter(document));
  }

  const firestoreQuery = query(collectionRef, ...queryConstraints);

  // return collectionRef.get();
  return getDocs(firestoreQuery);
};

const updateDocument = (collection, id, document) => {
  // return firestore.collection(collection).doc(id).update(document);
  return updateDoc(
    doc(firetoreCollection(firestore, collection), id),
    document
  );
};

const deleteDocument = (collection, id) => {
  // return firestore.collection(collection).doc(id).delete();
  return deleteDoc(doc(firetoreCollection(firestore, collection), id));
};

const FirebaseFirestoreService = {
  createDocument,
  readDocuments,
  updateDocument,
  deleteDocument,
};

export default FirebaseFirestoreService;
