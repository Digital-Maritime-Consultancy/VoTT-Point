import React from "react";
import { mount, ReactWrapper } from "enzyme";
import _ from "lodash";
import ImportProviderPicker, { IImportProviderPickerProps } from "./importProviderPicker";
import MockFactory from "../../../../common/mockFactory";
import { ImportProviderFactory } from "../../../../providers/import/importProviderFactory";

jest.mock("../../../../providers/import/importProviderFactory");

describe("Import Provider Picker", () => {
    const importProviderRegistrations = MockFactory.createImportProviderRegistrations();

    let wrapper: ReactWrapper;

    const onChangeHandler = jest.fn();
    const defaultProps: IImportProviderPickerProps = {
        id: "test-import-provider-picker",
        value: "azureCustomVision",
        onChange: onChangeHandler,
    };

    function createComponent(props: IImportProviderPickerProps) {
        return mount(<ImportProviderPicker {...props} />);
    }

    beforeAll(() => {
        Object.defineProperty(ImportProviderFactory, "providers", {
            get: jest.fn(() => importProviderRegistrations),
        });
    });

    describe("With default properties", () => {
        beforeEach(() => {
            wrapper = createComponent(defaultProps);
        });

        it("Renders a dropdown with all import providers", () => {
            const importProviders = _.values(importProviderRegistrations);

            const allProviders = _([])
                .concat(importProviders)
                .orderBy("displayName")
                .value();

            const picker = wrapper.find("select");
            const htmlNode = picker.getDOMNode() as HTMLSelectElement;

            // Count of unique providers + the "Select" option
            expect(htmlNode.id).toEqual(defaultProps.id);
            expect(htmlNode.value).toEqual(defaultProps.value);
            expect(picker.find("option").length).toEqual(allProviders.length);
        });

        it("Calls registred onChange handler when value changes", async () => {
            await MockFactory.flushUi(() => {
                wrapper.find("select").simulate("change", { target: { value: importProviderRegistrations[1].name } });
            });

            expect(onChangeHandler).toBeCalledWith(importProviderRegistrations[1].name);
        });
    });

    describe("With property overrides", () => {
        it("Selects correct option based on value", () => {
            const props = {
                ...defaultProps,
                value: importProviderRegistrations[1].name,
            };
            wrapper = createComponent(props);

            const htmlNode = wrapper.find("select").getDOMNode() as HTMLSelectElement;
            expect(htmlNode.value).toEqual(props.value);
        });
    });
});
