import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, Observer } from 'rxjs';

export const InputPatterns = new Map<string, any>([['image', '.+\\\\.{1}(jpg|jpeg|png|gif|bmp)$']]);

export const sizeValidatorFn = (params: { size: number; max: number }): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const _maxKb = params.max * 1024;
    if (params.size > _maxKb) {
      return {
        size: true,
      };
    }
    return null;
  };
};

export const isValidFileType = (fileType: string) => {
  console.log('fileType: ', fileType);
  const allowedImagePattern = /^image\/(jpeg|jpg|png|bmp|gif)$/;
  return allowedImagePattern.test(fileType);
};

export const isValidFile = (fileReaderResult: string | ArrayBuffer | null): boolean => {
  const arr = new Uint8Array(fileReaderResult as ArrayBuffer).subarray(0, 4);

  let header = '';

  for (let i = 0; i < arr.length; ++i) {
    header += arr[i].toString(16);
  }

  switch (header) {
    case '89504e47':
    // isValid = true;
    // break;
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2':
    case 'ffd8ffe3':
    case 'ffd8ffe8':
      console.log('file accepted, through header');
      return true;
    default:
      console.log('file declined, through header');
      return false;
  }
};

export const simpleFileTypeValidator = (control: AbstractControl): ValidationErrors | null => {
  const file = control.value as File;

  if (!file) {
    console.log('simpleFileTypeValidator: !file - nothing selected');
    return null;
  }

  // if (!file.type || file.type === '') {
  //   console.log('simpleFileTypeValidator: !file.type || file.type === "" - no filetype set or empty');
  //   return { invalidMimeType: true };
  // }

  if (isValidFileType(file.type)) {
    return null;
  } else {
    console.log('simpleFileTypeValidator: !isValidFileType - invalid filetype');
    return { invalidMimeType: true };
  }
};

export const mimeType = (
  control: AbstractControl,
):
  | Promise<{ [key: string]: any }>
  | Observable<{ [key: string]: any } | Promise<{ string: any }>> => {
  const file = control.value as File | null;
  const fileReader = new FileReader();

  if (!file) {
    console.log('file rejected early');
    return new Promise(() => {
      invalidMimeType: true;
    });
  }

  const fileReaderObservable = new Observable((observer: Observer<{ [key: string]: any }>) => {
    console.log('fileReaderObservable');
    fileReader.addEventListener('loadend', () => {
      console.log('fileReader eventListener; file loadend');

      console.log('reader.result in observable: ', fileReader.result);
      let isValid = isValidFile(fileReader.result);

      if (isValid) {
        observer.next({ invalidMimeType: null });
      } else {
        observer.next({ invalidMimeType: true });
      }
      observer.complete();
    });

    fileReader.readAsArrayBuffer(new Blob([file as BlobPart]));
  });

  return fileReaderObservable;
};
