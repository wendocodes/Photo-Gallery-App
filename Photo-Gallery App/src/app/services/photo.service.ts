import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory,
CameraPhoto, CameraSource } from '@capacitor/core';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = 'photos';
  private async savePicture(cameraPhoto: CameraPhoto) {
    // convert photo to base64 format, this is required by the filesystem to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // write file to the data directory
    const fileName = new Date().getTime() + ' .jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });
    // get platform-specific photo filepaths
    return await this.getPhotoFile(cameraPhoto, fileName);
  }
  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(cameraPhoto.webPath);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  private async getPhotoFile(cameraPhoto: CameraPhoto, fileName: string): Promise<Photo> {
  return {
  filepath: fileName,
  webviewPath: cameraPhoto.webPath
  };
}
  public async addNewToGallery() {
    /*take photo*/
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    this.photos.unshift({
      filepath: 'soon...',
      webviewPath: capturedPhoto.webPath
    });
    // add a call to Storage.set()
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos.map(p => {
              // Don't save the base64 representation of the photo data,
              // since it's already saved on the Filesystem
              const photoCopy = { ...p };
              delete photoCopy.base64;
              return photoCopy;
              }))
    });
  }
  public async loadSaved() {
    // retrieve catched photo array data
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photos.value) || [];
    // display photo by reading into base64 format
    for (const photo of this.photos) {
      // read each saved photo's data from the FileSytem
      const readFile = await FilesystemDirectory.readFile({
        path: photo.filepath,
        directory: FilesystemDirectory.Data
      });
      // web platform only, save the photo into the base64 field
      photo.base64 = 'data:image/jpeg;base64,${readFile.data}';
    }
  }
  constructor() { }
}
/*create a new interface to hold our photo metadata*/
interface Photo {
  filepath: string;
  webviewPath: string;
  base64?: string;
}
