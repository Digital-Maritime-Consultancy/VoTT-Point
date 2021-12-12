import React from "react";
import Form, { ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { IDot2RectSettings, ModelPathType } from "../../../../models/applicationState";
import { strings, addLocValues } from "../../../../common/strings";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import LocalFolderPicker from "../../common/localFolderPicker/localFolderPicker";
import { CustomWidget } from "../../common/customField/customField";
import Checkbox from "rc-checkbox";

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./dot2RectForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./dot2RectForm.ui.json"));

export interface IDot2RectFormProps extends React.Props<Dot2RectForm> {
    settings: IDot2RectSettings;
    onSubmit: (settings: IDot2RectSettings) => void;
    onChange?: (settings: IDot2RectSettings) => void;
    onCancel?: () => void;
}

export interface IDot2RectFormState {
    classNames: string[];
    formData: IDot2RectSettings;
    uiSchema: any;
    formSchema: any;
}

export class Dot2RectForm extends React.Component<IDot2RectFormProps, IDot2RectFormState> {
    public state: IDot2RectFormState = {
        classNames: ["needs-validation"],
        uiSchema: { ...uiSchema },
        formSchema: { ...formSchema },
        formData: {
            ...this.props.settings,
        },
    };

    private widgets = {
        localFolderPicker: (LocalFolderPicker as any) as Widget,
        checkbox: CustomWidget(Checkbox, (props) => ({
            checked: props.value,
            onChange: (value) => props.onChange(value.target.checked),
            disabled: props.disabled,
        })),
    };

    public componentDidUpdate(prevProps: Readonly<IDot2RectFormProps>) {
        if (this.props.settings !== prevProps.settings) {
            this.setState({ formData: this.props.settings });
        }
    }

    public render() {
        return (
            <Form
                className={this.state.classNames.join(" ")}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                FieldTemplate={CustomFieldTemplate}
                widgets={this.widgets}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-success mr-1" type="submit">{strings.projectSettings.save}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
            </Form>
        );
    }

    private onFormChange = (changeEvent: IChangeEvent<IDot2RectSettings>): void => {
        let updatedSettings = changeEvent.formData;

        this.setState({
            formData: updatedSettings,
        }, () => {
            if (this.props.onChange) {
                this.props.onChange(updatedSettings);
            }
        });
    }

    private onFormSubmit = (args: ISubmitEvent<IDot2RectSettings>): void => {
        const settings: IDot2RectSettings = {
            ...args.formData,
        };

        this.setState({ formData: settings });
        this.props.onSubmit(settings);
    }

    private onFormCancel = (): void => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }
}
