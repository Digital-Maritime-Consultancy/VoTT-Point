import React, { SyntheticEvent } from "react";
import shortid from "shortid";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { IFileInfo } from "../../../../models/applicationState";

/**
 * Properties for Local File Picker
 * @member onChange - Function to call on change of file selection
 * @member onError - Function to call on file picking error
 */
export interface ILocalFilePickerProps {
    acceptFormat: string;
    onChange: (sender: SyntheticEvent, fileText: IFileInfo) => void;
    onError: (sender: SyntheticEvent, error: any) => void;
}

interface ILocalFilePickerState {
    value: string;
}

/**
 * @name - Local File Picker
 * @description - Pick file from local file system
 */
export default class LocalFilePicker extends React.Component<ILocalFilePickerProps, ILocalFilePickerState> {
    private fileInput;

    constructor(props, context) {
        super(props, context);
        this.fileInput = React.createRef();
        this.onFileUploaded = this.onFileUploaded.bind(this);

        this.state = {
            value: "",
        };
    }

    public render() {
        return (
            <div className="input-group">
                <input type="text" className="form-control" value={this.state.value} readOnly={true} />
                <input type="file" style={{ "display": "none" }} ref={this.fileInput} accept={this.props.acceptFormat} onChange={this.onFileUploaded}/>
                <div className="input-group-append">
                    <button onClick={this.selectFile} className='btn btn-primary' type="button">
                        <span className='ms-2' >Select File</span>
                    </button>
                </div>
            </div>
        );
    }

    private selectFile = () => {
        this.fileInput.current.click();
    }

    private onFileUploaded = (e) => {
        if (e.target.files.length === 0) {
            this.props.onError(e, "No files were selected");
            return ;
        }

        this.setState({
            value: e.target.files[0].name,
        });

        HtmlFileReader.readAsText(e.target.files[0])
            .then((fileInfo) => this.props.onChange(e, fileInfo))
            .catch((err) => this.props.onError(e, err));

    }
}
