import { Whatsapp } from '../api/whatsapp';
import { CreateConfig } from '../config/create-config';
/**
 * Start the bot
 * @param session, You must pass a string type parameter, this parameter will be the name of the client's session. If the parameter is not passed, the section name will be "session".
 * @param catchQR, A callback will be received, informing the status of the qrcode
 * @param statusFind, A callback will be received, informing the customer's status
 * @param options, Pass an object with the bot settings
 * @param browserSessionToken, Pass the session token information you can receive this token with the await client.getSessionTokenBrowser () function
 * @returns Whatsapp page, with this parameter you will be able to access the bot functions
 */
export declare function create(session?: string, catchQR?: (qrCode: string, asciiQR: string, attempt: number, urlCode?: string) => void, statusFind?: (statusGet: string, session: string) => void, options?: CreateConfig, browserSessionToken?: object): Promise<Whatsapp>;
