import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "src/shared/config/firebase/firebase";

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const path = `avatars/${uid}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
