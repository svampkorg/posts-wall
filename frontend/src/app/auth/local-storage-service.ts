import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
class LocalStorageService {
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('LocalStorageService error: ', error);
    }
  }

  get(key: string) {
    return localStorage.getItem(key);
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }
}

export default LocalStorageService;
