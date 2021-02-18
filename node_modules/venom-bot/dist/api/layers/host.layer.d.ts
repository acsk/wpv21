import { Page } from 'puppeteer';
import { SocketState } from '../model/enum';
export declare class HostLayer {
    page: Page;
    constructor(page: Page);
    /**
     * Delete the Service Workers
     */
    killServiceWorker(): Promise<boolean>;
    /**
     * Load the service again
     */
    restartService(): Promise<boolean>;
    /**
     * @returns Current host device details
     */
    getHostDevice(): Promise<import("../model").HostDevice>;
    /**
     * Retrieves WA version
     */
    getWAVersion(): Promise<string>;
    /**
     * Retrieves the connecction state
     */
    getConnectionState(): Promise<SocketState>;
    /**
     * Retrieves if the phone is online. Please note that this may not be real time.
     */
    isConnected(): Promise<boolean>;
    /**
     * Retrieves if the phone is online. Please note that this may not be real time.
     */
    isLoggedIn(): Promise<boolean>;
    /**
     * Retrieves Battery Level
     */
    getBatteryLevel(): Promise<number>;
}
