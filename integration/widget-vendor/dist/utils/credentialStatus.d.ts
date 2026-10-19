import { CredentialStatus } from '../types';
export declare const CREDENTIAL_STATUS_MESSAGE_TYPE = "n8n-chat:credential-status";
export declare function listenForCredentialStatus(onStatus: (status: CredentialStatus) => void): () => void;
