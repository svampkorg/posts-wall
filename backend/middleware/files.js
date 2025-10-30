import multer, { diskStorage } from 'multer';
import fs from 'fs';

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
};

const storage = diskStorage({
  destination: (_req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('Invalid mime type');
    if (isValid) {
      console.log('is valid');
      error = null;
    } else {
      console.log('is not valid');
    }
    cb(error, 'images');
  },
  filename: (_req, file, cb) => {
    // NOTE: this check seem unecessary because if no file is provided it will never
    // run in the first place. So replacing with code after and commenting out
    // this check until maybe the backend does end up with a file which is string
    // if (file instanceof String) {
    //   console.log('file was a string');
    //   cb(null, file);
    //   return;
    // } else {
    //   const name = file.originalname.toLocaleLowerCase().split(' ').join('-');
    //   const ext = MIME_TYPE_MAP[file.mimetype];
    //   const shorterName = name.slice(0, Math.min(8, name.length)) + '-' + Date.now() + '.' + ext;
    //   console.log('in filename multer: ', shorterName);
    //   cb(null, shorterName);
    // }

    const name = file.originalname.toLocaleLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    const shorterName = name.slice(0, Math.min(8, name.length)) + '-' + Date.now() + '.' + ext;
    console.log('in filename multer: ', shorterName);
    cb(null, shorterName);
  },
});

export const getDiskPath = (imagePath) => {
  return 'images' + imagePath.split('/images')[1];
};
export const deleteImageFromPost = (post) => {
  const imagePath = getDiskPath(post.imagePath);
  fs.unlink(imagePath, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }
  });
};

export const filesStorage = multer({ storage: storage });
