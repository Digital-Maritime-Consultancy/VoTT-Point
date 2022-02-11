import React from "react";
import { IDot2RectFormProps, Dot2RectForm, IDot2RectFormState } from "./dot2RectForm";
import { ReactWrapper, mount } from "enzyme";
import { ModelPathType, IDot2RectSettings } from "../../../../models/applicationState";
import Form from "react-jsonschema-form";

describe("Active Learning Form", () => {
    const onChangeHandler = jest.fn();
    const onSubmitHandler = jest.fn();
    const onCancelHandler = jest.fn();
    const defaultProps: IDot2RectFormProps = {
        settings: {
            url: null,
        },
        onChange: onChangeHandler,
        onSubmit: onSubmitHandler,
        onCancel: onCancelHandler,
    };

    function createComponent(props?: IDot2RectFormProps)
        : ReactWrapper<IDot2RectFormProps, IDot2RectFormState> {
        props = props || defaultProps;
        return mount(<Dot2RectForm {...props} />);
    }

    it("renders a dynamic json schema form with default props", () => {
        const wrapper = createComponent();
        expect(wrapper.find(Form).exists()).toBe(true);
        expect(wrapper.state().formData).toEqual(defaultProps.settings);
    });

    it("sets formData state when loaded with different props", () => {
        const props: IDot2RectFormProps = {
            ...defaultProps,
            settings: {
                url: "https://myserver.com/myModel",
            },
        };

        const wrapper = createComponent(props);
        expect(wrapper.state().formData).toEqual(props.settings);
    });

    it("updates form data when the props change", () => {
        const wrapper = createComponent();

        const newSettings: IDot2RectSettings = {
            url: "https://myserver.com/myModel",
        };

        wrapper.setProps({ settings: newSettings });
        expect(wrapper.state().formData).toEqual(newSettings);
    });
});
