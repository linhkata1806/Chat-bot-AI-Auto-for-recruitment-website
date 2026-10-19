import { Ref } from 'vue';
import { CredentialStatus } from './credentialStatus';
import { ChatMessage } from './messages';
import { SendMessageResponse } from './webhook';
export interface Chat {
    initialMessages: Ref<ChatMessage[]>;
    messages: Ref<ChatMessage[]>;
    currentSessionId: Ref<string | null>;
    waitingForResponse: Ref<boolean>;
    blockUserInput: Ref<boolean>;
    credentialStatus: Ref<CredentialStatus | null>;
    loadPreviousSession?: () => Promise<string | undefined>;
    startNewSession?: () => Promise<void>;
    sendMessage: (text: string, files?: File[]) => Promise<SendMessageResponse | null>;
    ws?: WebSocket | null;
}
