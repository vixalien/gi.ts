
import * as GObject from "gobject";
import * as Gio from "gio";
import * as GLib from "glib";
import * as GIRepository from "girepository";
import * as GModule from "gmodule";
import * as Peas from "peas";
/**
 * peas.d.ts
 */
type properties = { [key: string]: any };
type GType = object;
export type ExtensionSetForeachFunc = (set: ExtensionSet, info: PluginInfo, exten: Extension, data: object | null) => void;
export type FactoryFunc = (n_parameters: number, parameters: GObject.Parameter[], user_data: object | null) => GObject.Object;
/**
 * 
 */
export function cclosure_marshal_VOID__BOXED_OBJECT(closure: GObject.Closure, return_value: GObject.Value, n_param_values: number, param_values: GObject.Value, invocation_hint: object | null, marshal_data: object | null): void;
/**
 * 
 */
export function plugin_info_error_quark(): GLib.Quark;
export enum PluginInfoError {
    LOADING_FAILED = 0,
    LOADER_NOT_FOUND = 1,
    DEP_NOT_FOUND = 2,
    DEP_LOADING_FAILED = 3,
}
export type Extension = GObject.Object;
export class Engine extends GObject.Object {
    constructor(config?: properties);
    loaded_plugins: string[];
    nonglobal_loaders: boolean;
    readonly plugin_list: object;static new_with_nonglobal_loaders(): Engine;
    add_search_path(module_dir: string, data_dir: string | null): void;
    create_extensionv(info: PluginInfo, extension_type: GType, n_parameters: number, parameters: GObject.Parameter[] | null): Extension;
    enable_loader(loader_name: string): void;
    garbage_collect(): void;
    get_loaded_plugins(): string[];
    get_plugin_info(plugin_name: string): PluginInfo;
    get_plugin_list(): GLib.List;
    load_plugin(info: PluginInfo): boolean;
    prepend_search_path(module_dir: string, data_dir: string | null): void;
    provides_extension(info: PluginInfo, extension_type: GType): boolean;
    rescan_plugins(): void;
    set_loaded_plugins(plugin_names: string[] | null): void;
    unload_plugin(info: PluginInfo): boolean;
    vfunc_load_plugin(info: PluginInfo): void;
    vfunc_unload_plugin(info: PluginInfo): void;
    static get_default(): Engine;
}
export class ExtensionBase  {
    constructor(config?: properties);
    readonly data_dir: string;
    plugin_info: PluginInfo;
    readonly priv: ExtensionBasePrivate;
    get_data_dir(): string;
    get_plugin_info(): PluginInfo;
}
export class ExtensionSet extends GObject.Object {
    constructor(config?: properties);
    construct_properties: object;
    engine: Engine;
    extension_type: GType;static newv(engine: Engine | null, exten_type: GType, n_parameters: number, parameters: GObject.Parameter[]): ExtensionSet;
    static newv(...args: never[]): ExtensionSet;
    foreach(func: ExtensionSetForeachFunc, data: object | null): void;
    get_extension(info: PluginInfo): Extension;
    vfunc_call(method_name: string, args: GIRepository.Argument): boolean;
    vfunc_extension_added(info: PluginInfo, exten: Extension): void;
    vfunc_extension_removed(info: PluginInfo, exten: Extension): void;
}
export class ObjectModule extends GObject.TypeModule {
    constructor(config?: properties);
    local_linkage: boolean;
    module_name: string;
    path: string;
    resident: boolean;
    symbol: string;
    register_extension_factory(exten_type: GType, factory_func: FactoryFunc, user_data: object | null, destroy_func: GLib.DestroyNotify): void;
    register_extension_type(exten_type: GType, impl_type: GType): void;
}
export class EnginePrivate  {
    constructor(config?: properties);
}
export class ExtensionBasePrivate  {
    constructor(config?: properties);
}
export class ExtensionSetPrivate  {
    constructor(config?: properties);
}
export class ObjectModulePrivate  {
    constructor(config?: properties);
}
export class PluginInfo  {
    constructor(config?: properties);
    get_authors(): string[];
    get_copyright(): string;
    get_data_dir(): string;
    get_dependencies(): string[];
    get_description(): string;
    get_external_data(key: string): string;
    get_help_uri(): string;
    get_icon_name(): string;
    get_module_dir(): string;
    get_module_name(): string;
    get_name(): string;
    get_settings(schema_id: string | null): Gio.Settings;
    get_version(): string;
    get_website(): string;
    has_dependency(module_name: string): boolean;
    is_available(): boolean;
    is_builtin(): boolean;
    is_hidden(): boolean;
    is_loaded(): boolean;
    static error_quark(): GLib.Quark;
}
export interface Activatable  {
    object: GObject.Object;
    activate(): void;
    deactivate(): void;
    update_state(): void;
}