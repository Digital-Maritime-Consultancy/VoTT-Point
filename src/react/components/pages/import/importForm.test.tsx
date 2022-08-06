import React from "react";
import ImportForm, { IImportFormProps, IImportFormState } from "./importForm";
import { mount } from "enzyme";
import { IFileInfo } from "../../../../models/applicationState";
import MockFactory from "../../../../common/mockFactory";
import { ImportProviderFactory } from "../../../../providers/import/importProviderFactory";

jest.mock("../../../../providers/import/importProviderFactory");

describe("Import Form Component", () => {
    const importProviderRegistrations = MockFactory.createImportProviderRegistrations();

    function createComponent(props: IImportFormProps) {
        return mount(
            <ImportForm {...props} />,
        );
    }

    beforeAll(() => {
        Object.defineProperty(ImportProviderFactory, "providers", {
            get: jest.fn(() => importProviderRegistrations),
        });
        Object.defineProperty(ImportProviderFactory, "defaultProvider", {
            get: jest.fn(() => importProviderRegistrations[0]),
        });
    });

    const onSubmitHandler = jest.fn();

    it("State is initialized without import settings", () => {
        const defaultImportType = "vottJson";
        const props: IImportFormProps = {
            settings: null,
            onSubmit: onSubmitHandler,
            onCheck: function (file: IFileInfo): void {
                throw new Error("Function not implemented.");
            }
        };

        const wrapper = createComponent(props);
        expect(wrapper.find(ImportForm).exists()).toBe(true);

        const state = wrapper.find(ImportForm).state() as IImportFormState;
        expect(state.providerName).toEqual(defaultImportType);
        expect(state.formData).not.toBeNull();
        expect(state.formSchema).not.toBeNull();
        expect(state.uiSchema).not.toBeNull();
    });
});
