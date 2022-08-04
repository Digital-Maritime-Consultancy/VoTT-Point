import React from "react";
import Form, { FormValidation, IChangeEvent, ISubmitEvent, Widget } from "react-jsonschema-form";
import { addLocValues, strings } from "../../../../common/strings";
import { IFileInfo, IImportFormat } from "../../../../models/applicationState";
import { ImportProviderFactory } from "../../../../providers/import/importProviderFactory";
import { CustomWidget } from "../../common/customField/customField";
import ImportProviderPicker from "../../common/importProviderPicker/importProviderPicker";
import { ProtectedInput } from "../../common/protectedInput/protectedInput";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import XmlFilePicker from "../../common/xmlFilePicker/xmlFilePicker";
import { ICvatXmlImportProviderOptions } from "../../../../providers/import/cvatXml";
import Alert from "../../common/alert/alert";

// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./importForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./importForm.ui.json"));

/**
 * Properties for Import Form
 * @member settings - Current settings for Import
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface IImportFormProps{
    settings: IImportFormat;
    onSubmit: (importFormat: IImportFormat) => void;
    onCheck: (importFormat: IImportFormat) => void;
    onCancel?: () => void;
}

/**
 * State for Import Form
 * @member classNames - Class names for HTML form component
 * @member providerName - Name of import provider
 * @member formSchema - JSON Form Schema for import form
 * @member uiSchema - JSON Form UI Schema for import form
 * @member formData - Current state of form data as Import Format
 */
export interface IImportFormState {
    classNames: string[];
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IImportFormat;
}
export default class ImportForm extends React.Component<IImportFormProps, IImportFormState> {
    public state: IImportFormState = {
        classNames: ["needs-validation"],
        providerName: this.props.settings ? this.props.settings.providerType : null,
        formSchema: { ...formSchema },
        uiSchema: { ...uiSchema },
        formData: this.props.settings,
    };

    private widgets = {
        importProviderPicker: (ImportProviderPicker as any) as Widget,
        protectedInput: (ProtectedInput as any) as Widget,
        xmlFilePicker: CustomWidget(XmlFilePicker, (props) => ({
            onChange: (value: IFileInfo) => {
                const currentFormData = {...this.state.formData};
                if (value) {
                    currentFormData.providerOptions.file = value;
                    this.setState({ formData: currentFormData});
                }
            },
        })),
    };

    public componentDidMount() {
        if (this.props.settings) {
            this.bindForm(this.props.settings);
        }
    }

    public componentDidUpdate(prevProps: IImportFormProps) {
        if (prevProps.settings !== this.props.settings) {
            this.bindForm(this.props.settings);
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
                validate={this.onFormValidate}
                widgets={this.widgets}
                formContext={this.state.formData}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <button className="btn btn-primary mr-1"
                        type="button" onClick={(e) => this.onFormCheck(this.state.formData)}>{strings.import.check}</button>
                    <button className="btn btn-success mr-1" type="submit">{strings.import.execute}</button>
                    <button className="btn btn-secondary btn-cancel"
                        type="button"
                        onClick={this.onFormCancel}>{strings.common.cancel}</button>
                </div>
            </Form>
        );
    }

    private onFormChange = (args: IChangeEvent<IImportFormat>) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        } else {
            this.bindForm(args.formData, false);
        }
    }

    private onFormValidate = (importFormat: IImportFormat, errors: FormValidation): FormValidation => {
        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormSubmit = (args: ISubmitEvent<IImportFormat>): void => {
        if (!args.formData.providerOptions.imageFolderPath) {
            alert(strings.import.providers.cvatXml.imageFolderPath.emptyError);
            return ;
        }
        this.props.onSubmit(args.formData);
    }

    private onFormCheck = (formData: IImportFormat): void => {
        this.props.onCheck(formData);
    }

    private onFormCancel = (): void => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    private bindForm = (importFormat: IImportFormat, resetProviderOptions: boolean = false): void => {
        // If no provider type was specified on bind, pick the default provider
        const providerType = (importFormat && importFormat.providerType)
            ? importFormat.providerType
            : ImportProviderFactory.defaultProvider.name;

        let newFormSchema: any = this.state.formSchema;
        let newUiSchema: any = this.state.uiSchema;

        if (providerType) {
            const providerSchema = addLocValues(require(`../../../../providers/import/${providerType}.json`));
            const providerUiSchema = require(`../../../../providers/import/${providerType}.ui.json`);

            newFormSchema = { ...formSchema };
            newFormSchema.properties["providerOptions"] = providerSchema;

            newUiSchema = { ...uiSchema };
            newUiSchema["providerOptions"] = providerUiSchema;
        }

        const formData = { ...importFormat };

        formData.providerType = providerType;

        this.setState({
            providerName: providerType,
            formSchema: newFormSchema,
            uiSchema: newUiSchema,
            formData,
        });
    }
}