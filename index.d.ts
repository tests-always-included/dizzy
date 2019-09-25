export type FnWithReturn<T> = (...args: any) => T;
export type FnWithReturnPromise<T> = (...args: any) => (T | Promise<T>);
export class DizzyProvider {
    constructor(key: string, value: any, container: Dizzy);
    asFactory(): this;
    asFactory(...args): this;
    asFn<T>(val: FnWithReturn<T>): T
    asFnAsync<T>(val: Promise<FnWithReturnPromise<T>>): Promise<T>;
    asInstance(): this;
    asInstance(...args): this;
    asValue(): this;
    cached(newSetting?: boolean): this;
    fromContainer(): this;
    fromFn(): any;
    fromFnAsync(): Promise<any>;
    fromModule(baseDir?: string): this;
    fromValue(): this;
    provide(): any;
    provideAsync(): Promise<any>;
    resetCache(): void;
    resolve(): any;
    resolveAsync(): Promise<any>;
    withContext(context?: Object): this;
}

export class BulkProvider {
    addProvider(provider: DizzyProvider): void;
    asFactory(): this;
    asFactory(...args): this;
    asInstance(): this;
    asInstance(...args): this;
    asValue(): this;
    cached(newSetting?: boolean): this;
    chainMethod(methodName: string): (...args: any) => this;
    forEach(callback: (key: string, provider: DizzyProvider) => void): void;
    fromContainer(): this;
    fromModule(baseDir?: string): this;
    fromValue(): this;
    resolve(): any;
    withContext(context?: Object): this;
}

export interface DizzyRegisterBulk {
    [key: string]: any;
}

export type FnConstructor<T> = { new(): T; };

export default class Dizzy {
    call<T>(callbackFn: FnWithReturn<T>, argsArray?: string[], contextObj?: Object): T;
    callAsync<T>(callbackFn: FnWithReturnPromise<T>, argsArray?: string[], contextObj?: Object): Promise<T>;
    instance<T>(ClassFn: FnConstructor<T>, argsArray?: string[]): T;
    instanceAsync<T>(ClassFn: FnConstructor<T>, argsArray?: string[]): Promise<T>;
    isRegistered(key: string): boolean;
    list(): string[];
    register(key: string, value: any): DizzyProvider;
    registerBulk(mapping: DizzyRegisterBulk): BulkProvider;
    resolve(key: string): any;
    resolveAsync(key: string): Promise<any>;
}
