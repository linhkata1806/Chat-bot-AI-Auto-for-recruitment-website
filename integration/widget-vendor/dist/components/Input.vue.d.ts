export interface ChatInputProps {
    placeholder?: string;
}
export interface ArrowKeyDownPayload {
    key: 'ArrowUp' | 'ArrowDown';
    currentInputValue: string;
}
declare var __VLS_1: {};
type __VLS_Slots = {} & {
    leftPanel?: (props: typeof __VLS_1) => any;
};
declare const __VLS_base: import('vue').DefineComponent<ChatInputProps, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    arrowKeyDown: (value: ArrowKeyDownPayload) => any;
}, string, import('vue').PublicProps, Readonly<ChatInputProps> & Readonly<{
    onArrowKeyDown?: ((value: ArrowKeyDownPayload) => any) | undefined;
}>, {
    placeholder: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
