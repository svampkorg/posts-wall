import { Injectable } from '@angular/core';
import * as jwt_decode from 'jwt-decode';

export const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
class JwtTokenService {
  private decodeToken(token: string) {
    return jwt_decode.jwtDecode(token);
  }

  private getExpiryTime(token: string) {
    const decodedToken = this.decodeToken(token);
    return decodedToken.exp;
  }

  public getRemainingTokenDurationSeconds(token: string) {
    const expiryTime = this.getExpiryTime(token);
    if (!expiryTime) return 0;
    const expiryMs = 1000 * expiryTime;
    const nowTimeMs = new Date().getTime();
    return (expiryMs - nowTimeMs) / 1000;
  }

  public isTokenExpired(token: string | undefined | null): boolean {
    if (!token) {
      console.error('No token found');
      return true;
    }
    const expiryTime = this.getExpiryTime(token);
    if (!expiryTime) {
      console.error('No expiry time found in token');
      return true; // If no expiryTime is found, consider the token expired
    }
    // const expiryMs = 1000 * expiryTime;
    // const nowTimeMs = new Date().getTime();
    // console.log('Token time ms: ', expiryMs);
    // console.log('Now time ms: ', nowTimeMs);
    // console.log('Expires in seconds: ', (expiryMs - nowTimeMs) / 1000);
    // Check if the remaining time until expiry is less than 1 hour (3600 * 1000 milliseconds)
    // TODO: use getRemainingTokenDurationSeconds method
    return 1000 * expiryTime - new Date().getTime() < 3600 * 1000;
  }
}

export default JwtTokenService;
