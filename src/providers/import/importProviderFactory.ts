import Guard from "../../common/guard";
import { IImportProvider } from "./importProvider";
import { IProject } from "../../models/applicationState";

export interface IImportProviderRegistrationOptions {
    name: string;
    displayName: string;
    description?: string;
    factory: (project: IProject, options?: any) => IImportProvider;
}

/**
 * @name - Import Provider Factory
 * @description - Creates instance of import providers based on request provider type
 */
export class ImportProviderFactory {

    /**
     * @returns Dictionary of registered providers
     */
    public static get providers() {
        return { ...ImportProviderFactory.providerRegistry };
    }

    /**
     * @returns Options from specified default provider
     */
    public static get defaultProvider() {
        return ImportProviderFactory.defaultProviderOptions;
    }

    /**
     * Registers a factory method for the specified import provider type
     * @param options - The options to use when registering an import provider
     */
    public static register(options: IImportProviderRegistrationOptions) {
        Guard.null(options);
        Guard.empty(options.name);
        Guard.empty(options.displayName);
        Guard.null(options.factory);

        // The first provider registered will be the default
        if (ImportProviderFactory.defaultProviderOptions === null) {
            ImportProviderFactory.defaultProviderOptions = options;
        }
        ImportProviderFactory.providerRegistry[options.name] = options;
    }

    /**
     * Creates new instances of the specified import provider
     * @param name - The name of the import provider to instantiate
     * @param project - The project to load into the import provider
     * @param options  - The provider specific options for importing
     */
    public static create(name: string, project: IProject, options?: any): IImportProvider {
        Guard.empty(name);
        Guard.null(project);

        const handler = ImportProviderFactory.providerRegistry[name];
        if (!handler) {
            throw new Error(`No import provider has been registered with name '${name}'`);
        }

        return handler.factory(project, options);
    }

    /**
     * Create import provider from project
     * @param project VoTT project
     */
    public static createFromProject(project: IProject): IImportProvider {
        return ImportProviderFactory.create(
            project.importFormat.providerType,
            project,
            project.importFormat.providerOptions,
        );
    }

    private static providerRegistry: { [id: string]: IImportProviderRegistrationOptions } = {};
    private static defaultProviderOptions: IImportProviderRegistrationOptions = null;
}
