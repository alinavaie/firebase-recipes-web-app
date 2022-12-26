import firebase from "./FirebaseConfig";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// const storageRef = firebase.storage.ref();
const storage = firebase.storage;

const uploadFile = (file, fullFilePath, progressCallBack) => {
  const uploadRef = ref(storage, fullFilePath);
  const uploadTask = uploadBytesResumable(uploadRef, file);
  // const uploadTask = storageRef.child(fullFilePath).put(file);
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      );
      progressCallBack(progress);
    },
    (error) => {
      throw error;
    }
  );

  return uploadTask.then(async () => {
    // const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadUrl;
  });
};

const deleteFile = (fileDownloadUrl) => {
  const decodedUrl = decodeURIComponent(fileDownloadUrl);
  const startIndex = decodedUrl.indexOf("/o/") + 3;
  const endIndex = decodedUrl.indexOf("?");
  const filePath = decodedUrl.substring(startIndex, endIndex);

  // return storageRef.child(filePath).delete();
  const fileRef = ref(storage, filePath);
  return deleteObject(fileRef);
};

const FirebaseStorageService = {
  uploadFile,
  deleteFile,
};

export default FirebaseStorageService;
