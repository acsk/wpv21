import * as puppeteer from 'puppeteer';
import { CreateConfig } from '../config/create-config';
import { ScrapQrcode } from '../api/model/qrcode';
/**
 * Validates if client is authenticated
 * @returns true if is authenticated, false otherwise
 * @param waPage
 */
export declare const isAuthenticated: (waPage: puppeteer.Page) => Promise<boolean>;
export declare const needsToScan: (waPage: puppeteer.Page) => import("rxjs").Observable<boolean>;
export declare const isInsideChat: (waPage: puppeteer.Page) => import("rxjs").Observable<boolean>;
export declare function asciiQr(code: string): Promise<string>;
export declare function retrieveQR(page: puppeteer.Page): Promise<ScrapQrcode | undefined>;
export declare function SessionTokenCkeck(token: object): boolean;
export declare function auth_InjectToken(page: puppeteer.Page, session: string, options: CreateConfig, token: object): Promise<false | void>;
