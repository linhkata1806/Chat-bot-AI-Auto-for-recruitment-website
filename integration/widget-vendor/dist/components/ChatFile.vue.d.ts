type __VLS_Props = {
    file: File;
    isRemovable: boolean;
    isPreviewable?: boolean;
    href?: string;
};
declare const __VLS_export: import('vue').DefineComponent<__VLS_Props, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    remove: (value: File) => any;
}, string, import('vue').PublicProps, Readonly<__VLS_Props> & Readonly<{
    onRemove?: ((value: File) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const _default: typeof __VLS_export;
export default _default;
